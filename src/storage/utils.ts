// ============================================================
// 日期工具函数（纯函数）
//
// 这些函数被 App.vue / 各组件 / storage 内部多处共用。
// 全部保持同步、纯函数，方便单测。
// ============================================================

/** 获取今天的日期字符串 YYYY-MM-DD */
export function todayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/** 从 YYYY-MM-DD 提取月份 YYYY-MM */
export function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7)
}

/** 获取当前月份 key */
export function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** 获取上个月 key */
export function prevMonthKey(): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** 获取去年同月 key */
export function lastYearSameMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear() - 1}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** 获取当前年份 */
export function currentYear(): number {
  return new Date().getFullYear()
}

/** 从日期字符串获取显示用的 MM/DD */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return dateStr
  return dateStr.substring(5).replace('-', '/')
}

/** 格式化日期为中文显示 MM月DD日 */
export function formatChineseDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return dateStr
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}月${parseInt(d)}日`
}

/** 安全地把任意值转成 YYYY-MM-DD 字符串 */
export function toDateStr(value: string | number | Date | null | undefined): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value.length >= 10 ? value.substring(0, 10) : null
  return null
}