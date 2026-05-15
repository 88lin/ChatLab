/**
 * FetchMessageAdapter — Web (CLI serve) 模式消息查询实现
 *
 * 通过 pluginQuery 构建 SQL 查询来实现消息检索。
 * SQL 模板和行映射来自 @openchatlab/core 的共享模块。
 */

import { FULL_MSG_SELECT, buildMsgConditions, mapMessageRow, type FullMessageRow } from '@openchatlab/core'
import type { MessageAdapter, TimeFilter, PaginatedMessages, MessageRecord, SearchResult } from './types'
import { getRegisteredAdapter } from '../registry'
import type { DataAdapter } from '../data/types'

function getDataAdapter(): DataAdapter {
  return getRegisteredAdapter<DataAdapter>('data')
}

function pq<T>(sessionId: string, sql: string, params: unknown[] = []) {
  return getDataAdapter().pluginQuery<T>(sessionId, sql, params)
}

function toConditions(filter?: TimeFilter, senderId?: number, keywords?: string[]) {
  return buildMsgConditions({
    startTs: filter?.startTs,
    endTs: filter?.endTs,
    senderId,
    keywords,
  })
}

export class FetchMessageAdapter implements MessageAdapter {
  async getMessagesBefore(
    sessionId: string,
    beforeId: number,
    limit: number = 50,
    filter?: TimeFilter,
    senderId?: number,
    keywords?: string[]
  ): Promise<PaginatedMessages> {
    const { clause, params } = toConditions(filter, senderId, keywords)
    const sql = `${FULL_MSG_SELECT} WHERE msg.id < ? ${clause} ORDER BY msg.id DESC LIMIT ?`
    const rows = await pq<FullMessageRow>(sessionId, sql, [beforeId, ...params, limit + 1])
    const hasMore = rows.length > limit
    const sliced = hasMore ? rows.slice(0, limit) : rows
    return { messages: sliced.map(mapMessageRow).reverse(), hasMore }
  }

  async getMessagesAfter(
    sessionId: string,
    afterId: number,
    limit: number = 50,
    filter?: TimeFilter,
    senderId?: number,
    keywords?: string[]
  ): Promise<PaginatedMessages> {
    const { clause, params } = toConditions(filter, senderId, keywords)
    const sql = `${FULL_MSG_SELECT} WHERE msg.id > ? ${clause} ORDER BY msg.id ASC LIMIT ?`
    const rows = await pq<FullMessageRow>(sessionId, sql, [afterId, ...params, limit + 1])
    const hasMore = rows.length > limit
    const sliced = hasMore ? rows.slice(0, limit) : rows
    return { messages: sliced.map(mapMessageRow), hasMore }
  }

  async getMessageContext(
    sessionId: string,
    messageIds: number | number[],
    contextSize: number = 20
  ): Promise<MessageRecord[]> {
    const ids = Array.isArray(messageIds) ? messageIds : [messageIds]
    if (ids.length === 0) return []

    const allIds = new Set<number>()

    for (const id of ids) {
      allIds.add(id)
      if (contextSize > 0) {
        const before = await pq<{ id: number }>(
          sessionId,
          'SELECT id FROM message WHERE id < ? ORDER BY id DESC LIMIT ?',
          [id, contextSize]
        )
        before.forEach((r) => allIds.add(r.id))

        const after = await pq<{ id: number }>(
          sessionId,
          'SELECT id FROM message WHERE id > ? ORDER BY id ASC LIMIT ?',
          [id, contextSize]
        )
        after.forEach((r) => allIds.add(r.id))
      }
    }

    const idList = Array.from(allIds).sort((a, b) => a - b)
    const placeholders = idList.map(() => '?').join(', ')
    const sql = `${FULL_MSG_SELECT} WHERE msg.id IN (${placeholders}) ORDER BY msg.id ASC`
    const rows = await pq<FullMessageRow>(sessionId, sql, idList)
    return rows.map(mapMessageRow)
  }

  async searchMessages(
    sessionId: string,
    keywords: string[],
    filter?: TimeFilter,
    limit: number = 100,
    offset: number = 0,
    senderId?: number
  ): Promise<SearchResult> {
    const { clause, params } = toConditions(filter, senderId, keywords)
    const countSql = `SELECT COUNT(*) as total FROM message msg JOIN member m ON msg.sender_id = m.id WHERE 1=1 ${clause}`
    const countResult = await pq<{ total: number }>(sessionId, countSql, params)
    const total = countResult[0]?.total ?? 0

    const sql = `${FULL_MSG_SELECT} WHERE 1=1 ${clause} ORDER BY msg.ts DESC LIMIT ? OFFSET ?`
    const rows = await pq<FullMessageRow>(sessionId, sql, [...params, limit, offset])
    return { messages: rows.map(mapMessageRow), total }
  }

  async getAllRecentMessages(sessionId: string, filter?: TimeFilter, limit: number = 100): Promise<SearchResult> {
    const { clause, params } = toConditions(filter)
    const countSql = `SELECT COUNT(*) as total FROM message msg JOIN member m ON msg.sender_id = m.id WHERE 1=1 ${clause}`
    const countResult = await pq<{ total: number }>(sessionId, countSql, params)
    const total = countResult[0]?.total ?? 0

    const sql = `${FULL_MSG_SELECT} WHERE 1=1 ${clause} ORDER BY msg.ts DESC LIMIT ?`
    const rows = await pq<FullMessageRow>(sessionId, sql, [...params, limit])
    return { messages: rows.map(mapMessageRow).reverse(), total }
  }
}
