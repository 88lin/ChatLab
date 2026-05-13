/**
 * Service 层统一入口
 *
 * 导出 initServices() 和各 useXxxService() composable。
 * 各 Phase 实施时在此追加导出。
 */

export { initServices, detectPlatform, type Platform } from './registry'

// Phase 1: export { useDataService } from './data/service'
// Phase 2: export { useImportService } from './import/service'
// Phase 3: export { useSessionIndexService } from './session-index/service'
// Phase 4: export { useMessageService } from './message/service'
// Phase 5: export { usePlatformService } from './platform/service'
// Phase 6: export { useAIService } from './ai/service'
