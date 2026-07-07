import type { Transaction, RecurringItem } from './types'
import { todayStr } from './storage'

/**
 * 检查周期性记账项目是否需要在今天触发
 */
export function shouldTriggerToday(item: RecurringItem): boolean {
  if (!item.enabled) return false
  const today = new Date()

  // 检查是否已经触发过今天
  if (item.lastTriggered === todayStr()) return false

  if (item.frequency === 'daily') {
    return true
  }

  if (item.frequency === 'weekly') {
    return today.getDay() === (item.dayOfWeek ?? 1)
  }

  if (item.frequency === 'monthly') {
    const day = item.dayOfMonth ?? 1
    const todayDate = today.getDate()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    // 如果设置的日期超过本月天数，在最后一天触发
    if (day > daysInMonth) {
      return todayDate === daysInMonth
    }
    return todayDate === day
  }

  return false
}

/**
 * 从周期性项目生成交易记录
 */
export function recurringToTransaction(item: RecurringItem, id: number): Transaction {
  return {
    id,
    name: item.name,
    category: item.category,
    subCategory: item.subCategory,
    date: todayStr(),
    amount: item.amount,
    type: item.type,
    icon: item.icon,
    tag: item.type === 'income' ? '收入' : (item.subCategory || item.category),
    merchant: undefined,
    location: undefined,
  }
}

/**
 * 检查提醒是否应该触发
 * 返回 true 如果当前时间匹配提醒设置
 */
export function shouldShowReminder(reminder: { enabled: boolean; time: string; days: number[] }): boolean {
  if (!reminder.enabled) return false
  const now = new Date()
  const currentDay = now.getDay()
  if (!reminder.days.includes(currentDay)) return false

  const [h, m] = reminder.time.split(':').map(Number)
  const reminderKey = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const nowKey = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  // 在提醒时间的同一分钟内触发
  return reminderKey === nowKey
}

/**
 * 检查今天是否已经显示过提醒
 */
const REMINDER_KEY = 'light-ledger-reminder-shown'

export function markReminderShown(): void {
  try {
    localStorage.setItem(REMINDER_KEY, todayStr())
  } catch { /* ignore */ }
}

export function isReminderAlreadyShown(): boolean {
  try {
    return localStorage.getItem(REMINDER_KEY) === todayStr()
  } catch {
    return false
  }
}
