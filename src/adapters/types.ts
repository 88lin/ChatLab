/**
 * QueryAdapter — 统一的数据访问适配器接口
 *
 * 三种实现：
 * - ElectronAdapter: 包装 window.chatApi (IPC)
 * - FetchAdapter: 调用 /_web/ 内部 HTTP API
 * - BrowserSqlAdapter: sql.js Web Worker (纯浏览器)
 *
 * 所有方法以 sessionId 为参数，适配器内部负责打开/管理数据库连接。
 * 返回类型复用 src/types/ 中已有的前端类型，避免 UI 层改动。
 */

import type { AnalysisSession, MessageType } from '@/types/base'
import type { TimeFilter } from '@openchatlab/shared-types'
import type {
  MemberActivity,
  MemberWithStats,
  MemberNameHistory,
  HourlyActivity,
  DailyActivity,
  WeekdayActivity,
  MonthlyActivity,
  CatchphraseAnalysis,
  MentionAnalysis,
  LaughAnalysis,
  ClusterGraphData,
  ClusterGraphOptions,
  RelationshipStats,
} from '@/types/analysis'
import type { LanguagePreferenceResult } from '@/types/quotes/languagePreference'

// ==================== 能力声明 ====================

export interface AdapterCapabilities {
  /** 支持 AI 对话 / 分析 */
  ai: boolean
  /** 支持中文分词 / 词云 */
  nlp: boolean
  /** 支持 FTS5 全文搜索（否则降级为 LIKE） */
  fts: boolean
  /** 支持原生文件对话框 */
  nativeFileDialog: boolean
  /** 支持剪贴板 / 系统托盘等 OS 集成 */
  osIntegration: boolean
  /** 支持 Demo 数据导入 */
  demoImport: boolean
  /** 支持插件系统 (pluginQuery / pluginCompute) */
  plugin: boolean
  /** 支持数据库迁移 */
  migration: boolean
  /** 支持会话合并 */
  merge: boolean
  /** 支持增量导入 */
  incrementalImport: boolean
}

// ==================== 分页参数与结果 ====================

export interface PaginationParams {
  page: number
  pageSize: number
  search?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ==================== SQL Lab 结果 ====================

export interface SQLResult {
  columns: string[]
  rows: unknown[][]
  rowCount: number
  duration: number
  limited: boolean
}

export interface TableSchema {
  name: string
  columns: Array<{
    name: string
    type: string
    notnull: boolean
    pk: boolean
  }>
}

// ==================== Mention Graph ====================

export interface MentionGraphData {
  nodes: Array<{ id: number; name: string; value: number; symbolSize: number }>
  links: Array<{ source: string; target: string; value: number }>
  maxLinkValue: number
}

// ==================== 消息长度分布 ====================

export interface MessageLengthDistribution {
  detail: Array<{ len: number; count: number }>
  grouped: Array<{ range: string; count: number }>
}

// ==================== 导入相关 ====================

export interface ImportProgress {
  stage: 'detecting' | 'parsing' | 'saving' | 'indexing' | 'done' | 'error'
  progress: number
  message: string
  bytesRead?: number
  totalBytes?: number
  messagesProcessed?: number
}

export interface ImportResult {
  success: boolean
  sessionId?: string
  error?: string
  messageCount?: number
  memberCount?: number
}

export interface FormatInfo {
  id: string
  name: string
  platform: string
  extensions: string[]
  multiChat?: boolean
}

export interface MultiChatEntry {
  index: number
  name: string
  type: string
  id: number
  messageCount: number
}

// ==================== 核心适配器接口 ====================

export interface QueryAdapter {
  /** 返回当前适配器的能力声明 */
  getCapabilities(): AdapterCapabilities

  // ==================== 会话管理 ====================

  getSessions(): Promise<AnalysisSession[]>
  getSession(sessionId: string): Promise<AnalysisSession | null>
  deleteSession(sessionId: string): Promise<boolean>
  renameSession(sessionId: string, newName: string): Promise<boolean>
  updateSessionOwnerId(sessionId: string, ownerId: string | null): Promise<boolean>

  // ==================== 时间范围 ====================

  getAvailableYears(sessionId: string): Promise<number[]>
  getTimeRange(sessionId: string): Promise<{ start: number; end: number } | null>

  // ==================== 统计分析 ====================

  getMemberActivity(sessionId: string, filter?: TimeFilter): Promise<MemberActivity[]>
  getHourlyActivity(sessionId: string, filter?: TimeFilter): Promise<HourlyActivity[]>
  getDailyActivity(sessionId: string, filter?: TimeFilter): Promise<DailyActivity[]>
  getWeekdayActivity(sessionId: string, filter?: TimeFilter): Promise<WeekdayActivity[]>
  getMonthlyActivity(sessionId: string, filter?: TimeFilter): Promise<MonthlyActivity[]>
  getYearlyActivity(sessionId: string, filter?: TimeFilter): Promise<Array<{ year: number; messageCount: number }>>
  getMessageLengthDistribution(sessionId: string, filter?: TimeFilter): Promise<MessageLengthDistribution>
  getMessageTypeDistribution(
    sessionId: string,
    filter?: TimeFilter
  ): Promise<Array<{ type: MessageType; count: number }>>

  // ==================== 成员管理 ====================

  getMembers(sessionId: string): Promise<MemberWithStats[]>
  getMembersPaginated(sessionId: string, params: PaginationParams): Promise<PaginatedResult<MemberWithStats>>
  getMemberNameHistory(sessionId: string, memberId: number): Promise<MemberNameHistory[]>
  updateMemberAliases(sessionId: string, memberId: number, aliases: string[]): Promise<boolean>
  mergeMembers(sessionId: string, memberId1: number, memberId2: number): Promise<boolean>
  deleteMember(sessionId: string, memberId: number): Promise<boolean>

  // ==================== 社交分析 ====================

  getCatchphraseAnalysis(sessionId: string, filter?: TimeFilter): Promise<CatchphraseAnalysis>
  getLanguagePreferenceAnalysis(
    sessionId: string,
    locale: string,
    filter?: TimeFilter,
    dictType?: string
  ): Promise<LanguagePreferenceResult>
  getMentionAnalysis(sessionId: string, filter?: TimeFilter): Promise<MentionAnalysis>
  getMentionGraph(sessionId: string, filter?: TimeFilter): Promise<MentionGraphData>
  getClusterGraph(sessionId: string, filter?: TimeFilter, options?: ClusterGraphOptions): Promise<ClusterGraphData>
  getLaughAnalysis(sessionId: string, filter?: TimeFilter, keywords?: string[]): Promise<LaughAnalysis>
  getRelationshipStats(
    sessionId: string,
    filter?: TimeFilter,
    options?: { perseveranceThreshold?: number }
  ): Promise<RelationshipStats>

  // ==================== SQL Lab ====================

  executeSQL(sessionId: string, sql: string): Promise<SQLResult>
  getSchema(sessionId: string): Promise<TableSchema[]>

  // ==================== 导入管线 ====================

  importFile(
    file: File,
    options?: { formatId?: string; chatIndex?: number },
    onProgress?: (p: ImportProgress) => void
  ): Promise<ImportResult>
  detectFormat(file: File): Promise<FormatInfo | null>
  scanMultiChatFile(file: File): Promise<MultiChatEntry[]>
  getSupportedFormats(): Promise<FormatInfo[]>

  // ==================== 插件系统（能力依赖） ====================

  pluginQuery<T = Record<string, unknown>>(sessionId: string, sql: string, params?: unknown[]): Promise<T[]>
  pluginCompute<T = unknown>(fnString: string, input: unknown): Promise<T>
}
