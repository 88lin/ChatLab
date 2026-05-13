/**
 * ElectronAdapter — 包装 window.chatApi (Electron IPC)
 *
 * 行为与现有 window.chatApi 完全一致，确保桌面版零影响。
 * 所有方法直接代理到 window.chatApi 的对应方法。
 */

import type {
  QueryAdapter,
  AdapterCapabilities,
  SQLResult,
  TableSchema,
  PaginationParams,
  PaginatedResult,
  MentionGraphData,
  MessageLengthDistribution,
  ImportProgress,
  ImportResult,
  FormatInfo,
  MultiChatEntry,
} from './types'
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

export class ElectronAdapter implements QueryAdapter {
  getCapabilities(): AdapterCapabilities {
    return {
      ai: true,
      nlp: true,
      fts: true,
      nativeFileDialog: true,
      osIntegration: true,
      demoImport: true,
      plugin: true,
      migration: true,
      merge: true,
      incrementalImport: true,
    }
  }

  // ==================== 会话管理 ====================

  getSessions(): Promise<AnalysisSession[]> {
    return window.chatApi.getSessions()
  }

  getSession(sessionId: string): Promise<AnalysisSession | null> {
    return window.chatApi.getSession(sessionId)
  }

  deleteSession(sessionId: string): Promise<boolean> {
    return window.chatApi.deleteSession(sessionId)
  }

  renameSession(sessionId: string, newName: string): Promise<boolean> {
    return window.chatApi.renameSession(sessionId, newName)
  }

  updateSessionOwnerId(sessionId: string, ownerId: string | null): Promise<boolean> {
    return window.chatApi.updateSessionOwnerId(sessionId, ownerId)
  }

  // ==================== 时间范围 ====================

  getAvailableYears(sessionId: string): Promise<number[]> {
    return window.chatApi.getAvailableYears(sessionId)
  }

  getTimeRange(sessionId: string): Promise<{ start: number; end: number } | null> {
    return window.chatApi.getTimeRange(sessionId)
  }

  // ==================== 统计分析 ====================

  getMemberActivity(sessionId: string, filter?: TimeFilter): Promise<MemberActivity[]> {
    return window.chatApi.getMemberActivity(sessionId, filter)
  }

  getHourlyActivity(sessionId: string, filter?: TimeFilter): Promise<HourlyActivity[]> {
    return window.chatApi.getHourlyActivity(sessionId, filter)
  }

  getDailyActivity(sessionId: string, filter?: TimeFilter): Promise<DailyActivity[]> {
    return window.chatApi.getDailyActivity(sessionId, filter)
  }

  getWeekdayActivity(sessionId: string, filter?: TimeFilter): Promise<WeekdayActivity[]> {
    return window.chatApi.getWeekdayActivity(sessionId, filter)
  }

  getMonthlyActivity(sessionId: string, filter?: TimeFilter): Promise<MonthlyActivity[]> {
    return window.chatApi.getMonthlyActivity(sessionId, filter)
  }

  getYearlyActivity(sessionId: string, filter?: TimeFilter): Promise<Array<{ year: number; messageCount: number }>> {
    return window.chatApi.getYearlyActivity(sessionId, filter)
  }

  getMessageLengthDistribution(sessionId: string, filter?: TimeFilter): Promise<MessageLengthDistribution> {
    return window.chatApi.getMessageLengthDistribution(sessionId, filter)
  }

  getMessageTypeDistribution(
    sessionId: string,
    filter?: TimeFilter
  ): Promise<Array<{ type: MessageType; count: number }>> {
    return window.chatApi.getMessageTypeDistribution(sessionId, filter)
  }

  // ==================== 成员管理 ====================

  getMembers(sessionId: string): Promise<MemberWithStats[]> {
    return window.chatApi.getMembers(sessionId)
  }

  getMembersPaginated(sessionId: string, params: PaginationParams): Promise<PaginatedResult<MemberWithStats>> {
    return window.chatApi.getMembersPaginated(sessionId, params).then((result) => ({
      items: result.members,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    }))
  }

  getMemberNameHistory(sessionId: string, memberId: number): Promise<MemberNameHistory[]> {
    return window.chatApi.getMemberNameHistory(sessionId, memberId)
  }

  updateMemberAliases(sessionId: string, memberId: number, aliases: string[]): Promise<boolean> {
    return window.chatApi.updateMemberAliases(sessionId, memberId, aliases)
  }

  mergeMembers(sessionId: string, memberId1: number, memberId2: number): Promise<boolean> {
    return window.chatApi.mergeMembers(sessionId, memberId1, memberId2)
  }

  deleteMember(sessionId: string, memberId: number): Promise<boolean> {
    return window.chatApi.deleteMember(sessionId, memberId)
  }

  // ==================== 社交分析 ====================

  getCatchphraseAnalysis(sessionId: string, filter?: TimeFilter): Promise<CatchphraseAnalysis> {
    return window.chatApi.getCatchphraseAnalysis(sessionId, filter)
  }

  getLanguagePreferenceAnalysis(
    sessionId: string,
    locale: string,
    filter?: TimeFilter,
    dictType?: string
  ): Promise<LanguagePreferenceResult> {
    return window.chatApi.getLanguagePreferenceAnalysis(sessionId, locale, filter, dictType)
  }

  getMentionAnalysis(sessionId: string, filter?: TimeFilter): Promise<MentionAnalysis> {
    return window.chatApi.getMentionAnalysis(sessionId, filter)
  }

  getMentionGraph(sessionId: string, filter?: TimeFilter): Promise<MentionGraphData> {
    return window.chatApi.getMentionGraph(sessionId, filter)
  }

  getClusterGraph(sessionId: string, filter?: TimeFilter, options?: ClusterGraphOptions): Promise<ClusterGraphData> {
    return window.chatApi.getClusterGraph(sessionId, filter, options)
  }

  getLaughAnalysis(sessionId: string, filter?: TimeFilter, keywords?: string[]): Promise<LaughAnalysis> {
    return window.chatApi.getLaughAnalysis(sessionId, filter, keywords)
  }

  getRelationshipStats(
    sessionId: string,
    filter?: TimeFilter,
    options?: { perseveranceThreshold?: number }
  ): Promise<RelationshipStats> {
    return window.chatApi.getRelationshipStats(sessionId, filter, options)
  }

  // ==================== SQL Lab ====================

  executeSQL(sessionId: string, sql: string): Promise<SQLResult> {
    return window.chatApi.executeSQL(sessionId, sql)
  }

  getSchema(sessionId: string): Promise<TableSchema[]> {
    return window.chatApi.getSchema(sessionId)
  }

  // ==================== 导入管线 ====================

  async importFile(
    file: File,
    options?: { formatId?: string; chatIndex?: number },
    onProgress?: (p: ImportProgress) => void
  ): Promise<ImportResult> {
    const filePath = (window as any).electron?.webUtils?.getPathForFile?.(file)
    if (!filePath) {
      return { success: false, error: 'Cannot get file path in Electron' }
    }
    return new Promise((resolve) => {
      const unlisten = window.chatApi.onImportProgress((progress: any) => {
        onProgress?.({
          stage: progress.stage || 'parsing',
          progress: progress.percentage || 0,
          message: progress.message || '',
          bytesRead: progress.bytesRead,
          totalBytes: progress.totalBytes,
          messagesProcessed: progress.messagesProcessed,
        })
      })
      window.chatApi
        .importWithOptions(filePath, options || {})
        .then((result) => {
          unlisten()
          resolve({
            success: result.success,
            sessionId: result.sessionId,
            error: result.error,
          })
        })
        .catch((err: Error) => {
          unlisten()
          resolve({ success: false, error: err.message })
        })
    })
  }

  async detectFormat(file: File): Promise<FormatInfo | null> {
    const filePath = (window as any).electron?.webUtils?.getPathForFile?.(file)
    if (!filePath) return null
    const result = await window.chatApi.detectFormat(filePath)
    if (!result) return null
    return { ...result, extensions: [] }
  }

  async scanMultiChatFile(file: File): Promise<MultiChatEntry[]> {
    const filePath = (window as any).electron?.webUtils?.getPathForFile?.(file)
    if (!filePath) return []
    const result = await window.chatApi.scanMultiChatFile(filePath)
    if (!result.success || !result.chats) return []
    return result.chats
  }

  async getSupportedFormats(): Promise<FormatInfo[]> {
    return window.chatApi.getSupportedFormats()
  }

  // ==================== 插件系统 ====================

  pluginQuery<T = Record<string, unknown>>(sessionId: string, sql: string, params?: unknown[]): Promise<T[]> {
    return window.chatApi.pluginQuery<T>(sessionId, sql, params)
  }

  pluginCompute<T = unknown>(fnString: string, input: unknown): Promise<T> {
    return window.chatApi.pluginCompute<T>(fnString, input)
  }
}
