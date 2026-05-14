/**
 * 词性标签定义（静态数据，平台无关）
 */

import type { PosTagInfo } from './types'

export const POS_TAG_DEFINITIONS: PosTagInfo[] = [
  { tag: 'n', name: '名词', description: '普通名词', meaningful: true },
  { tag: 'nr', name: '人名', description: '人名', meaningful: true },
  { tag: 'ns', name: '地名', description: '地名', meaningful: true },
  { tag: 'nt', name: '机构名', description: '机构团体名', meaningful: true },
  { tag: 'nz', name: '其他专名', description: '其他专有名词', meaningful: true },
  { tag: 'nw', name: '作品名', description: '作品名', meaningful: true },
  { tag: 'v', name: '动词', description: '普通动词', meaningful: false },
  { tag: 'vn', name: '动名词', description: '动名词', meaningful: true },
  { tag: 'vd', name: '副动词', description: '副动词', meaningful: false },
  { tag: 'vg', name: '动语素', description: '动词性语素', meaningful: false },
  { tag: 'a', name: '形容词', description: '普通形容词', meaningful: true },
  { tag: 'an', name: '名形词', description: '名形词', meaningful: true },
  { tag: 'ad', name: '副形词', description: '副形词', meaningful: true },
  { tag: 'ag', name: '形语素', description: '形容词性语素', meaningful: true },
  { tag: 'i', name: '成语', description: '成语', meaningful: true },
  { tag: 'l', name: '习用语', description: '习用语', meaningful: true },
  { tag: 'j', name: '简称', description: '简称略语', meaningful: true },
  { tag: 'd', name: '副词', description: '副词', meaningful: false },
  { tag: 'p', name: '介词', description: '介词', meaningful: false },
  { tag: 'c', name: '连词', description: '连词', meaningful: false },
  { tag: 'u', name: '助词', description: '助词', meaningful: false },
  { tag: 'r', name: '代词', description: '代词', meaningful: false },
  { tag: 'm', name: '数词', description: '数词', meaningful: false },
  { tag: 'q', name: '量词', description: '量词', meaningful: false },
  { tag: 'f', name: '方位词', description: '方位词', meaningful: false },
  { tag: 't', name: '时间词', description: '时间词', meaningful: false },
  { tag: 'e', name: '叹词', description: '叹词', meaningful: false },
  { tag: 'y', name: '语气词', description: '语气词', meaningful: false },
  { tag: 'o', name: '拟声词', description: '拟声词', meaningful: false },
  { tag: 'x', name: '非语素字', description: '非语素字', meaningful: false },
  { tag: 'w', name: '标点符号', description: '标点符号', meaningful: false },
]

export const MEANINGFUL_POS_TAGS = new Set(POS_TAG_DEFINITIONS.filter((t) => t.meaningful).map((t) => t.tag))
