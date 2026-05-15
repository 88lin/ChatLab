/**
 * 聊天记录查询模块
 * 提供通用的消息查询功能：搜索、筛选、上下文、无限滚动等
 * 在 Worker 线程中执行
 */

import { openDatabase, buildTimeFilter, type TimeFilter } from '../core'
import { ensureAvatarColumn } from './basic'
import { hasFtsIndex } from './fts'
import { tokenizeQueryForFts } from '../../nlp/ftsTokenizer'
import {
  FULL_MSG_SELECT,
  FULL_MSG_FROM,
  SYSTEM_MSG_FILTER,
  TEXT_ONLY_FILTER,
  mapMessageRow,
  type FullMessageRow,
  type MappedMessage,
} from '@openchatlab/core'

// ==================== 类型定义 ====================

export type MessageResult = MappedMessage

export interface PaginatedMessages {
  messages: MessageResult[]
  hasMore: boolean
}

export interface MessagesWithTotal {
  messages: MessageResult[]
  total: number
}

// ==================== 工具函数 ====================

function buildSenderCondition(senderId?: number): { condition: string; params: number[] } {
  if (senderId === undefined) {
    return { condition: '', params: [] }
  }
  return { condition: 'AND msg.sender_id = ?', params: [senderId] }
}

function buildKeywordCondition(keywords?: string[]): { condition: string; params: string[] } {
  if (!keywords || keywords.length === 0) {
    return { condition: '', params: [] }
  }
  const condition = `AND (${keywords.map(() => `msg.content LIKE ?`).join(' OR ')})`
  const params = keywords.map((k) => `%${k}%`)
  return { condition, params }
}

const SYSTEM_FILTER = `AND ${SYSTEM_MSG_FILTER}`
const TEXT_FILTER = `AND ${TEXT_ONLY_FILTER}`

// ==================== 查询函数 ====================

/**
 * 获取最近的消息（AI Agent 专用，只返回文本消息）
 */
export function getRecentMessages(sessionId: string, filter?: TimeFilter, limit: number = 100): MessagesWithTotal {
  ensureAvatarColumn(sessionId)

  const db = openDatabase(sessionId)
  if (!db) return { messages: [], total: 0 }

  const { clause: timeClause, params: timeParams } = buildTimeFilter(filter, 'msg')
  const timeCondition = timeClause ? timeClause.replace('WHERE', 'AND') : ''

  const countSql = `
    SELECT COUNT(*) as total
    ${FULL_MSG_FROM}
    WHERE 1=1
    ${timeCondition}
    ${SYSTEM_FILTER}
    ${TEXT_FILTER}
  `
  const totalRow = db.prepare(countSql).get(...timeParams) as { total: number }
  const total = totalRow?.total || 0

  const sql = `
    ${FULL_MSG_SELECT}
    WHERE 1=1
    ${timeCondition}
    ${SYSTEM_FILTER}
    ${TEXT_FILTER}
    ORDER BY msg.ts DESC
    LIMIT ?
  `

  const rows = db.prepare(sql).all(...timeParams, limit) as FullMessageRow[]

  return {
    messages: rows.map(mapMessageRow).reverse(),
    total,
  }
}

/**
 * 获取所有最近的消息（消息查看器专用，包含所有类型消息）
 */
export function getAllRecentMessages(sessionId: string, filter?: TimeFilter, limit: number = 100): MessagesWithTotal {
  ensureAvatarColumn(sessionId)

  const db = openDatabase(sessionId)
  if (!db) return { messages: [], total: 0 }

  const { clause: timeClause, params: timeParams } = buildTimeFilter(filter, 'msg')
  const timeCondition = timeClause ? timeClause.replace('WHERE', 'AND') : ''

  const countSql = `
    SELECT COUNT(*) as total
    ${FULL_MSG_FROM}
    WHERE 1=1
    ${timeCondition}
  `
  const totalRow = db.prepare(countSql).get(...timeParams) as { total: number }
  const total = totalRow?.total || 0

  const sql = `
    ${FULL_MSG_SELECT}
    WHERE 1=1
    ${timeCondition}
    ORDER BY msg.ts DESC
    LIMIT ?
  `

  const rows = db.prepare(sql).all(...timeParams, limit) as FullMessageRow[]

  return {
    messages: rows.map(mapMessageRow).reverse(),
    total,
  }
}

/**
 * 关键词搜索消息
 */
export function searchMessages(
  sessionId: string,
  keywords: string[],
  filter?: TimeFilter,
  limit: number = 20,
  offset: number = 0,
  senderId?: number
): MessagesWithTotal {
  ensureAvatarColumn(sessionId)

  const db = openDatabase(sessionId)
  if (!db) return { messages: [], total: 0 }

  const useFts = keywords.length > 0 && hasFtsIndex(sessionId)
  let matchQuery = ''
  if (useFts) {
    matchQuery = tokenizeQueryForFts(keywords)
  }

  if (useFts && matchQuery) {
    return searchMessagesWithFts(db, sessionId, matchQuery, filter, limit, offset, senderId)
  }

  return searchMessagesWithLike(db, keywords, filter, limit, offset, senderId)
}

/**
 * FTS5 搜索路径
 */
function searchMessagesWithFts(
  db: ReturnType<typeof openDatabase> & object,
  _sessionId: string,
  matchQuery: string,
  filter?: TimeFilter,
  limit: number = 20,
  offset: number = 0,
  senderId?: number
): MessagesWithTotal {
  const { clause: timeClause, params: timeParams } = buildTimeFilter(filter, 'msg')
  const timeCondition = timeClause ? timeClause.replace('WHERE', 'AND') : ''
  const { condition: senderCondition, params: senderParams } = buildSenderCondition(senderId)

  try {
    const countSql = `
      SELECT COUNT(*) as total
      ${FULL_MSG_FROM}
      WHERE msg.id IN (SELECT rowid FROM message_fts WHERE content MATCH ?)
      ${timeCondition}
      ${senderCondition}
    `
    const totalRow = db.prepare(countSql).get(matchQuery, ...timeParams, ...senderParams) as { total: number }
    const total = totalRow?.total || 0

    const sql = `
      ${FULL_MSG_SELECT}
      WHERE msg.id IN (SELECT rowid FROM message_fts WHERE content MATCH ?)
      ${timeCondition}
      ${senderCondition}
      ORDER BY msg.ts DESC
      LIMIT ? OFFSET ?
    `

    const rows = db.prepare(sql).all(matchQuery, ...timeParams, ...senderParams, limit, offset) as FullMessageRow[]

    return {
      messages: rows.map(mapMessageRow),
      total,
    }
  } catch (error) {
    console.error('[FTS] searchMessages FTS path failed, falling back to LIKE:', error)
    return searchMessagesWithLike(db, [], filter, limit, offset, senderId)
  }
}

/**
 * LIKE 搜索路径（fallback 或 deep_search 使用）
 */
export function searchMessagesWithLike(
  db: ReturnType<typeof openDatabase> & object,
  keywords: string[],
  filter?: TimeFilter,
  limit: number = 20,
  offset: number = 0,
  senderId?: number
): MessagesWithTotal {
  let keywordCondition = '1=1'
  const keywordParams: string[] = []
  if (keywords.length > 0) {
    keywordCondition = `(${keywords.map(() => `msg.content LIKE ?`).join(' OR ')})`
    keywordParams.push(...keywords.map((k) => `%${k}%`))
  }

  const { clause: timeClause, params: timeParams } = buildTimeFilter(filter, 'msg')
  const timeCondition = timeClause ? timeClause.replace('WHERE', 'AND') : ''
  const { condition: senderCondition, params: senderParams } = buildSenderCondition(senderId)

  const countSql = `
    SELECT COUNT(*) as total
    ${FULL_MSG_FROM}
    WHERE ${keywordCondition}
    ${timeCondition}
    ${senderCondition}
  `
  const totalRow = db.prepare(countSql).get(...keywordParams, ...timeParams, ...senderParams) as { total: number }
  const total = totalRow?.total || 0

  const sql = `
    ${FULL_MSG_SELECT}
    WHERE ${keywordCondition}
    ${timeCondition}
    ${senderCondition}
    ORDER BY msg.ts DESC
    LIMIT ? OFFSET ?
  `

  const rows = db.prepare(sql).all(...keywordParams, ...timeParams, ...senderParams, limit, offset) as FullMessageRow[]

  return {
    messages: rows.map(mapMessageRow),
    total,
  }
}

/**
 * 深度搜索消息（LIKE 子串匹配，速度较慢但不会遗漏）
 * 始终使用 LIKE 路径，不经过 FTS5。
 */
export function deepSearchMessages(
  sessionId: string,
  keywords: string[],
  filter?: TimeFilter,
  limit: number = 20,
  offset: number = 0,
  senderId?: number
): MessagesWithTotal {
  ensureAvatarColumn(sessionId)
  const db = openDatabase(sessionId)
  if (!db) return { messages: [], total: 0 }
  return searchMessagesWithLike(db, keywords, filter, limit, offset, senderId)
}

/**
 * 获取消息上下文（指定消息前后的消息）
 */
export function getMessageContext(
  sessionId: string,
  messageIds: number | number[],
  contextSize: number = 20
): MessageResult[] {
  ensureAvatarColumn(sessionId)

  const db = openDatabase(sessionId)
  if (!db) return []

  const ids = Array.isArray(messageIds) ? messageIds : [messageIds]
  if (ids.length === 0) return []

  const contextIds = new Set<number>()

  for (const messageId of ids) {
    contextIds.add(messageId)

    const beforeRows = db
      .prepare('SELECT id FROM message WHERE id < ? ORDER BY id DESC LIMIT ?')
      .all(messageId, contextSize) as { id: number }[]
    beforeRows.forEach((row) => contextIds.add(row.id))

    const afterRows = db
      .prepare('SELECT id FROM message WHERE id > ? ORDER BY id ASC LIMIT ?')
      .all(messageId, contextSize) as { id: number }[]
    afterRows.forEach((row) => contextIds.add(row.id))
  }

  if (contextIds.size === 0) return []

  const idList = Array.from(contextIds)
  const placeholders = idList.map(() => '?').join(', ')

  const sql = `
    ${FULL_MSG_SELECT}
    WHERE msg.id IN (${placeholders})
    ORDER BY msg.id ASC
  `

  const rows = db.prepare(sql).all(...idList) as FullMessageRow[]

  return rows.map(mapMessageRow)
}

/**
 * 获取搜索结果的上下文消息（会话感知 + 区间合并去重）
 */
export function getSearchMessageContext(
  sessionId: string,
  messageIds: number[],
  contextBefore: number = 2,
  contextAfter: number = 2
): MessageResult[] {
  ensureAvatarColumn(sessionId)
  const db = openDatabase(sessionId)
  if (!db) return []
  if (messageIds.length === 0) return []

  const contextIds = new Set<number>()

  const hasSessionData =
    (db.prepare('SELECT 1 FROM message_context LIMIT 1').get() as { 1: number } | undefined) !== undefined

  for (const messageId of messageIds) {
    contextIds.add(messageId)

    if (hasSessionData) {
      const sessionRow = db.prepare('SELECT session_id FROM message_context WHERE message_id = ?').get(messageId) as
        | { session_id: number }
        | undefined

      if (sessionRow) {
        if (contextBefore > 0) {
          const rows = db
            .prepare(
              `SELECT mc.message_id as id
               FROM message_context mc
               WHERE mc.session_id = ? AND mc.message_id < ?
               ORDER BY mc.message_id DESC
               LIMIT ?`
            )
            .all(sessionRow.session_id, messageId, contextBefore) as { id: number }[]
          rows.forEach((r) => contextIds.add(r.id))
        }
        if (contextAfter > 0) {
          const rows = db
            .prepare(
              `SELECT mc.message_id as id
               FROM message_context mc
               WHERE mc.session_id = ? AND mc.message_id > ?
               ORDER BY mc.message_id ASC
               LIMIT ?`
            )
            .all(sessionRow.session_id, messageId, contextAfter) as { id: number }[]
          rows.forEach((r) => contextIds.add(r.id))
        }
        continue
      }
    }

    // Fallback: no session data or message not indexed — use simple id-based context
    if (contextBefore > 0) {
      const rows = db
        .prepare('SELECT id FROM message WHERE id < ? ORDER BY id DESC LIMIT ?')
        .all(messageId, contextBefore) as { id: number }[]
      rows.forEach((r) => contextIds.add(r.id))
    }
    if (contextAfter > 0) {
      const rows = db
        .prepare('SELECT id FROM message WHERE id > ? ORDER BY id ASC LIMIT ?')
        .all(messageId, contextAfter) as { id: number }[]
      rows.forEach((r) => contextIds.add(r.id))
    }
  }

  if (contextIds.size === 0) return []

  const idList = Array.from(contextIds)
  const placeholders = idList.map(() => '?').join(', ')

  const sql = `
    ${FULL_MSG_SELECT}
    WHERE msg.id IN (${placeholders})
    ORDER BY msg.ts ASC, msg.id ASC
  `

  const rows = db.prepare(sql).all(...idList) as FullMessageRow[]
  return rows.map(mapMessageRow)
}

/**
 * 获取指定消息之前的 N 条消息（用于向上无限滚动）
 */
export function getMessagesBefore(
  sessionId: string,
  beforeId: number,
  limit: number = 50,
  filter?: TimeFilter,
  senderId?: number,
  keywords?: string[]
): PaginatedMessages {
  ensureAvatarColumn(sessionId)

  const db = openDatabase(sessionId)
  if (!db) return { messages: [], hasMore: false }

  const { clause: timeClause, params: timeParams } = buildTimeFilter(filter, 'msg')
  const timeCondition = timeClause ? timeClause.replace('WHERE', 'AND') : ''
  const { condition: keywordCondition, params: keywordParams } = buildKeywordCondition(keywords)
  const { condition: senderCondition, params: senderParams } = buildSenderCondition(senderId)

  const sql = `
    ${FULL_MSG_SELECT}
    WHERE msg.id < ?
    ${timeCondition}
    ${keywordCondition}
    ${senderCondition}
    ORDER BY msg.id DESC
    LIMIT ?
  `

  const rows = db
    .prepare(sql)
    .all(beforeId, ...timeParams, ...keywordParams, ...senderParams, limit + 1) as FullMessageRow[]

  const hasMore = rows.length > limit
  const resultRows = hasMore ? rows.slice(0, limit) : rows

  return {
    messages: resultRows.map(mapMessageRow).reverse(),
    hasMore,
  }
}

/**
 * 获取指定消息之后的 N 条消息（用于向下无限滚动）
 */
export function getMessagesAfter(
  sessionId: string,
  afterId: number,
  limit: number = 50,
  filter?: TimeFilter,
  senderId?: number,
  keywords?: string[]
): PaginatedMessages {
  ensureAvatarColumn(sessionId)

  const db = openDatabase(sessionId)
  if (!db) return { messages: [], hasMore: false }

  const { clause: timeClause, params: timeParams } = buildTimeFilter(filter, 'msg')
  const timeCondition = timeClause ? timeClause.replace('WHERE', 'AND') : ''
  const { condition: keywordCondition, params: keywordParams } = buildKeywordCondition(keywords)
  const { condition: senderCondition, params: senderParams } = buildSenderCondition(senderId)

  const sql = `
    ${FULL_MSG_SELECT}
    WHERE msg.id > ?
    ${timeCondition}
    ${keywordCondition}
    ${senderCondition}
    ORDER BY msg.id ASC
    LIMIT ?
  `

  const rows = db
    .prepare(sql)
    .all(afterId, ...timeParams, ...keywordParams, ...senderParams, limit + 1) as FullMessageRow[]

  const hasMore = rows.length > limit
  const resultRows = hasMore ? rows.slice(0, limit) : rows

  return {
    messages: resultRows.map(mapMessageRow),
    hasMore,
  }
}

/**
 * 获取两个成员之间的对话
 */
export function getConversationBetween(
  sessionId: string,
  memberId1: number,
  memberId2: number,
  filter?: TimeFilter,
  limit: number = 100
): MessagesWithTotal & { member1Name: string; member2Name: string } {
  ensureAvatarColumn(sessionId)

  const db = openDatabase(sessionId)
  if (!db) return { messages: [], total: 0, member1Name: '', member2Name: '' }

  const member1 = db
    .prepare('SELECT COALESCE(group_nickname, account_name, platform_id) as name FROM member WHERE id = ?')
    .get(memberId1) as { name: string } | undefined

  const member2 = db
    .prepare('SELECT COALESCE(group_nickname, account_name, platform_id) as name FROM member WHERE id = ?')
    .get(memberId2) as { name: string } | undefined

  if (!member1 || !member2) {
    return { messages: [], total: 0, member1Name: '', member2Name: '' }
  }

  const { clause: timeClause, params: timeParams } = buildTimeFilter(filter, 'msg')
  const timeCondition = timeClause ? timeClause.replace('WHERE', 'AND') : ''

  const countSql = `
    SELECT COUNT(*) as total
    ${FULL_MSG_FROM}
    WHERE msg.sender_id IN (?, ?)
    ${timeCondition}
    AND msg.content IS NOT NULL AND msg.content != ''
  `
  const totalRow = db.prepare(countSql).get(memberId1, memberId2, ...timeParams) as { total: number }
  const total = totalRow?.total || 0

  const sql = `
    ${FULL_MSG_SELECT}
    WHERE msg.sender_id IN (?, ?)
    ${timeCondition}
    AND msg.content IS NOT NULL AND msg.content != ''
    ORDER BY msg.ts DESC
    LIMIT ?
  `

  const rows = db.prepare(sql).all(memberId1, memberId2, ...timeParams, limit) as FullMessageRow[]

  return {
    messages: rows.map(mapMessageRow).reverse(),
    total,
    member1Name: member1.name,
    member2Name: member2.name,
  }
}
