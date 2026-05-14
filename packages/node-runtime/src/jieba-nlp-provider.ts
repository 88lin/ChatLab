/**
 * JiebaNlpProvider — NlpProvider 实现（基于 @node-rs/jieba）
 *
 * 提供给 @openchatlab/core 的 getLanguagePreferenceAnalysis 使用。
 * 仅在 Node.js 环境中可用（Electron worker / CLI server）。
 *
 * 使用 nlp/segmenter 的共享 getJieba() 实例，自动加载磁盘词库。
 */

import type { NlpProvider, PosTagResult } from '@openchatlab/core'
import { MEANINGFUL_POS_TAGS, isStopword } from '@openchatlab/core'
import { getJieba } from './nlp/segmenter'
import type { DictType } from '@openchatlab/core'

export function createJiebaNlpProvider(dictType: DictType = 'default'): NlpProvider {
  return {
    tag(text: string): PosTagResult[] {
      return getJieba(dictType).tag(text)
    },
    isStopword,
    meaningfulPosTags: MEANINGFUL_POS_TAGS,
  }
}
