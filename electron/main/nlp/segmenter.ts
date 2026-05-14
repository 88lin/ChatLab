/**
 * 分词器 — 从 @openchatlab/node-runtime 重导出
 *
 * 保留此文件是为了不改变 Electron 内部 import 路径。
 */

export {
  initNlpDir,
  getNlpDir,
  getJieba,
  clearJiebaInstance,
  segment,
  batchSegmentWithFrequency,
  collectPosTagStats,
  getPosTagDefinitions,
} from '@openchatlab/node-runtime'

export type { SegmentOptions, BatchSegmentOptions, BatchSegmentResult, DictType } from '@openchatlab/core'

export { POS_TAG_DEFINITIONS, MEANINGFUL_POS_TAGS } from '@openchatlab/core'
