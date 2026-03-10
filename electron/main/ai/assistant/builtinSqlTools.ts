/**
 * 内置工具目录查询
 *
 * SQL 工具定义位于 tools/definitions/sql-analysis.ts，
 * TS 工具名称列表位于 tools/definitions/index.ts。
 * 本模块仅提供前端展示所需的目录信息和名称查询。
 */

import type { BuiltinSqlToolInfo } from './types'
import { getSqlToolCatalog, SQL_TOOL_NAMES } from '../tools/definitions/sql-analysis'
import { TS_TOOL_NAMES } from '../tools/definitions'

/**
 * 获取内置 SQL 工具的精简目录（供前端展示勾选列表）
 */
export function getBuiltinSqlToolCatalog(): BuiltinSqlToolInfo[] {
  return getSqlToolCatalog()
}

/**
 * 获取内置 TS 工具的名称列表（供前端展示勾选列表）
 */
export function getBuiltinTsToolNames(): string[] {
  return TS_TOOL_NAMES
}

/**
 * 检查名称是否为内置 SQL 工具
 */
export function isBuiltinSqlTool(name: string): boolean {
  return SQL_TOOL_NAMES.includes(name)
}
