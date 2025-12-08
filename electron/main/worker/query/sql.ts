/**
 * SQL 实验室查询模块
 * 提供用户自定义 SQL 查询功能
 */

import { openDatabase } from '../core'

// 最大返回行数限制
const MAX_LIMIT = 1000

// 查询超时时间（毫秒）
const QUERY_TIMEOUT_MS = 10000

/**
 * SQL 执行结果
 */
export interface SQLResult {
  columns: string[]
  rows: any[][]
  rowCount: number
  duration: number
  limited: boolean // 是否被截断
}

/**
 * 表结构信息
 */
export interface TableSchema {
  name: string
  columns: {
    name: string
    type: string
    notnull: boolean
    pk: boolean
  }[]
}

/**
 * 获取数据库 Schema
 */
export function getSchema(sessionId: string): TableSchema[] {
  const db = openDatabase(sessionId)
  if (!db) {
    throw new Error('数据库不存在')
  }

  // 获取所有表名
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type='table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name`
    )
    .all() as { name: string }[]

  const schema: TableSchema[] = []

  for (const table of tables) {
    // 获取表的列信息
    const columns = db.prepare(`PRAGMA table_info('${table.name}')`).all() as {
      cid: number
      name: string
      type: string
      notnull: number
      dflt_value: any
      pk: number
    }[]

    schema.push({
      name: table.name,
      columns: columns.map((col) => ({
        name: col.name,
        type: col.type,
        notnull: col.notnull === 1,
        pk: col.pk === 1,
      })),
    })
  }

  return schema
}

/**
 * 解析并强制添加 LIMIT
 * 如果 SQL 没有 LIMIT 或 LIMIT 超过最大值，强制设置为 MAX_LIMIT
 */
function enforceLimit(sql: string): { sql: string; limited: boolean } {
  const trimmedSQL = sql.trim()

  // 检查是否是 SELECT 语句
  if (!trimmedSQL.toUpperCase().startsWith('SELECT')) {
    return { sql: trimmedSQL, limited: false }
  }

  // 使用正则匹配 LIMIT 子句
  const limitMatch = trimmedSQL.match(/\bLIMIT\s+(\d+)\s*(?:,\s*\d+)?(?:\s+OFFSET\s+\d+)?/i)

  if (limitMatch) {
    const currentLimit = parseInt(limitMatch[1], 10)
    if (currentLimit > MAX_LIMIT) {
      // 替换超出的 LIMIT
      const newSQL = trimmedSQL.replace(/\bLIMIT\s+\d+/i, `LIMIT ${MAX_LIMIT}`)
      return { sql: newSQL, limited: true }
    }
    return { sql: trimmedSQL, limited: false }
  } else {
    // 没有 LIMIT，追加
    // 需要处理可能存在的分号
    const sqlWithoutSemicolon = trimmedSQL.replace(/;\s*$/, '')
    return { sql: `${sqlWithoutSemicolon} LIMIT ${MAX_LIMIT}`, limited: true }
  }
}

/**
 * 执行用户 SQL 查询
 * - 只支持 SELECT 语句
 * - 强制 LIMIT 不超过 MAX_LIMIT
 * - 带超时控制
 */
export function executeRawSQL(sessionId: string, sql: string): SQLResult {
  const db = openDatabase(sessionId)
  if (!db) {
    throw new Error('数据库不存在')
  }

  const trimmedSQL = sql.trim()

  // 只允许 SELECT 语句
  if (!trimmedSQL.toUpperCase().startsWith('SELECT')) {
    throw new Error('只支持 SELECT 查询语句')
  }

  // 强制 LIMIT
  const { sql: limitedSQL, limited } = enforceLimit(trimmedSQL)

  // 执行查询
  const startTime = Date.now()

  try {
    // better-sqlite3 是同步的，我们通过 Worker 实现"超时"
    // 这里先执行，超时由 Worker 管理器控制
    const stmt = db.prepare(limitedSQL)
    const rows = stmt.all()
    const duration = Date.now() - startTime

    // 获取列名
    const columns = stmt.columns().map((col) => col.name)

    // 将结果转换为二维数组
    const rowData = rows.map((row: any) => columns.map((col) => row[col]))

    return {
      columns,
      rows: rowData,
      rowCount: rows.length,
      duration,
      limited: limited || rows.length >= MAX_LIMIT,
    }
  } catch (error) {
    if (error instanceof Error) {
      // 美化错误信息
      const message = error.message
        .replace(/^SQLITE_ERROR: /, '')
        .replace(/^SQLITE_READONLY: /, '只读模式：')
      throw new Error(message)
    }
    throw error
  }
}

