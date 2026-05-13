/**
 * 平台检测工具
 *
 * 通过编译时注入的常量区分运行环境：
 * - Electron: __IS_ELECTRON__ = true
 * - CLI serve Web: 两者都为 false（默认，FetchAdapter）
 * - 在线版 Web: __IS_BROWSER_STANDALONE__ = true（BrowserSqlAdapter）
 */

declare const __IS_ELECTRON__: boolean | undefined
declare const __IS_BROWSER_STANDALONE__: boolean | undefined

export const IS_ELECTRON = typeof __IS_ELECTRON__ !== 'undefined' && __IS_ELECTRON__

export const IS_BROWSER_STANDALONE = typeof __IS_BROWSER_STANDALONE__ !== 'undefined' && __IS_BROWSER_STANDALONE__
