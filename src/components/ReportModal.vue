<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-card">
          <!-- 顶部操作栏 -->
          <div class="modal-top-row">
            <button class="modal-cancel" @click="$emit('close')">返回</button>
            <h3 class="modal-title">{{ reportType === 'month' ? '月度报告' : '年度报告' }}</h3>
            <div class="period-switch">
              <button class="period-btn" :class="{ active: reportType === 'month' }" @click="reportType = 'month'">月</button>
              <button class="period-btn" :class="{ active: reportType === 'year' }" @click="reportType = 'year'">年</button>
            </div>
          </div>

          <!-- 月份/年份选择 -->
          <div class="period-nav">
            <button class="nav-btn" @click="prevPeriod">‹</button>
            <span class="period-label">{{ periodLabel }}</span>
            <button class="nav-btn" :disabled="isCurrentPeriod" @click="nextPeriod">›</button>
          </div>

          <!-- 概览卡片 -->
          <div class="overview-cards">
            <div class="overview-card income">
              <span class="overview-card-label">收入</span>
              <span class="overview-card-value">¥{{ periodData.income.toFixed(2) }}</span>
            </div>
            <div class="overview-card expense">
              <span class="overview-card-label">支出</span>
              <span class="overview-card-value">¥{{ periodData.expense.toFixed(2) }}</span>
            </div>
            <div class="overview-card balance">
              <span class="overview-card-label">结余</span>
              <span class="overview-card-value">¥{{ periodData.balance.toFixed(2) }}</span>
            </div>
          </div>

          <!-- 同比环比分析 -->
          <div class="analysis-section">
            <h4 class="section-h">{{ reportType === 'month' ? '同比环比分析' : '年度对比' }}</h4>

            <!-- 环比（本月 vs 上月） -->
            <div v-if="reportType === 'month'" class="compare-row">
              <div class="compare-label">
                <span class="compare-tag blue">环比</span>
                <span class="compare-desc">对比上月</span>
              </div>
              <div class="compare-data">
                <div class="compare-item">
                  <span class="compare-item-label">支出</span>
                  <span class="compare-item-value" :class="momExpenseClass">
                    {{ momExpenseText }}
                  </span>
                </div>
                <div class="compare-item">
                  <span class="compare-item-label">收入</span>
                  <span class="compare-item-value" :class="momIncomeClass">
                    {{ momIncomeText }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 同比（本月 vs 去年同月） -->
            <div class="compare-row">
              <div class="compare-label">
                <span class="compare-tag green">同比</span>
                <span class="compare-desc">对比{{ reportType === 'month' ? '去年同月' : '去年' }}</span>
              </div>
              <div class="compare-data">
                <div class="compare-item">
                  <span class="compare-item-label">支出</span>
                  <span class="compare-item-value" :class="yoyExpenseClass">
                    {{ yoyExpenseText }}
                  </span>
                </div>
                <div class="compare-item">
                  <span class="compare-item-label">收入</span>
                  <span class="compare-item-value" :class="yoyIncomeClass">
                    {{ yoyIncomeText }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 支出分类排行 Top5 -->
          <div class="ranking-section">
            <h4 class="section-h">支出分类排行</h4>
            <div v-if="topCategories.length === 0" class="empty-mini">暂无支出数据</div>
            <div v-else class="rank-list">
              <div v-for="(cat, i) in topCategories" :key="cat.name" class="rank-row">
                <span class="rank-num">{{ i + 1 }}</span>
                <span class="rank-icon">{{ cat.icon }}</span>
                <span class="rank-name">{{ cat.name }}</span>
                <div class="rank-bar-wrap">
                  <div class="rank-bar" :style="{ width: cat.percent * 100 + '%', background: cat.color }"></div>
                </div>
                <span class="rank-val">¥{{ cat.amount.toFixed(2) }}</span>
                <span class="rank-pct">{{ (cat.percent * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>

          <!-- 趋势图 -->
          <div class="trend-section">
            <h4 class="section-h">{{ reportType === 'month' ? '每日趋势' : '每月趋势' }}</h4>
            <div class="mini-trend-chart">
              <div class="mini-trend-bars">
                <div v-for="(d, i) in trendChartData" :key="i" class="mini-trend-col">
                  <div class="mini-trend-bar-group">
                    <div v-if="d.income > 0" class="mini-bar mini-bar-income" :style="{ height: (d.income / trendMax * 100) + '%' }"></div>
                    <div v-if="d.expense > 0" class="mini-bar mini-bar-expense" :style="{ height: (d.expense / trendMax * 100) + '%' }"></div>
                  </div>
                  <span class="mini-trend-label">{{ d.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 报告总结 -->
          <div class="summary-box">
            <h4 class="section-h">📊 报告总结</h4>
            <div class="summary-content">
              <p>{{ reportSummary }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Transaction } from '../types'

const props = defineProps<{
  show: boolean
  transactions: Transaction[]
}>()

defineEmits<{ (e: 'close'): void }>()

const reportType = ref<'month' | 'year'>('month')
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1) // 1-12

watch(() => props.show, (v) => {
  if (v) {
    const now = new Date()
    selectedYear.value = now.getFullYear()
    selectedMonth.value = now.getMonth() + 1
  }
})

const periodLabel = computed(() => {
  if (reportType.value === 'month') return `${selectedYear.value}年${selectedMonth.value}月`
  return `${selectedYear.value}年`
})

const isCurrentPeriod = computed(() => {
  const now = new Date()
  if (reportType.value === 'month') {
    return selectedYear.value === now.getFullYear() && selectedMonth.value === now.getMonth() + 1
  }
  return selectedYear.value === now.getFullYear()
})

function prevPeriod() {
  if (reportType.value === 'month') {
    selectedMonth.value--
    if (selectedMonth.value < 1) {
      selectedMonth.value = 12
      selectedYear.value--
    }
  } else {
    selectedYear.value--
  }
}

function nextPeriod() {
  if (isCurrentPeriod.value) return
  if (reportType.value === 'month') {
    selectedMonth.value++
    if (selectedMonth.value > 12) {
      selectedMonth.value = 1
      selectedYear.value++
    }
  } else {
    selectedYear.value++
  }
}

// 当前周期数据
const periodData = computed(() => {
  let txs: Transaction[]
  if (reportType.value === 'month') {
    const monthKey = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`
    txs = props.transactions.filter(t => t.date.startsWith(monthKey))
  } else {
    txs = props.transactions.filter(t => t.date.startsWith(String(selectedYear.value)))
  }
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  return { income, expense, balance: income - expense, txs }
})

// 上月/上年数据
const prevPeriodData = computed(() => {
  let txs: Transaction[]
  if (reportType.value === 'month') {
    let y = selectedYear.value, m = selectedMonth.value - 1
    if (m < 1) { m = 12; y-- }
    const monthKey = `${y}-${String(m).padStart(2, '0')}`
    txs = props.transactions.filter(t => t.date.startsWith(monthKey))
  } else {
    txs = props.transactions.filter(t => t.date.startsWith(String(selectedYear.value - 1)))
  }
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  return { income, expense, balance: income - expense }
})

// 去年同期数据
const lastYearData = computed(() => {
  let txs: Transaction[]
  if (reportType.value === 'month') {
    const monthKey = `${selectedYear.value - 1}-${String(selectedMonth.value).padStart(2, '0')}`
    txs = props.transactions.filter(t => t.date.startsWith(monthKey))
  } else {
    txs = props.transactions.filter(t => t.date.startsWith(String(selectedYear.value - 1)))
  }
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  return { income, expense, balance: income - expense }
})

// 环比
function calcChange(current: number, prev: number): { text: string; cls: string } {
  if (prev === 0) {
    return { text: current > 0 ? '新增' : '持平', cls: current > 0 ? 'up' : 'flat' }
  }
  const pct = ((current - prev) / prev) * 100
  const sign = pct > 0 ? '↑' : pct < 0 ? '↓' : '→'
  return { text: `${sign} ${Math.abs(pct).toFixed(1)}%`, cls: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' }
}

const momExpense = computed(() => calcChange(periodData.value.expense, prevPeriodData.value.expense))
const momIncome = computed(() => calcChange(periodData.value.income, prevPeriodData.value.income))
const yoyExpense = computed(() => calcChange(periodData.value.expense, lastYearData.value.expense))
const yoyIncome = computed(() => calcChange(periodData.value.income, lastYearData.value.income))

const momExpenseText = computed(() => {
  const v = prevPeriodData.value.expense
  return `${momExpense.value.text} (¥${v.toFixed(0)})`
})
const momIncomeText = computed(() => {
  const v = prevPeriodData.value.income
  return `${momIncome.value.text} (¥${v.toFixed(0)})`
})
const yoyExpenseText = computed(() => {
  const v = lastYearData.value.expense
  return `${yoyExpense.value.text} (¥${v.toFixed(0)})`
})
const yoyIncomeText = computed(() => {
  const v = lastYearData.value.income
  return `${yoyIncome.value.text} (¥${v.toFixed(0)})`
})

// 支出增加是坏事，所以用 down class 表示红色
const momExpenseClass = computed(() => momExpense.value.cls === 'up' ? 'bad' : momExpense.value.cls === 'down' ? 'good' : 'flat')
const momIncomeClass = computed(() => momIncome.value.cls === 'up' ? 'good' : momIncome.value.cls === 'down' ? 'bad' : 'flat')
const yoyExpenseClass = computed(() => yoyExpense.value.cls === 'up' ? 'bad' : yoyExpense.value.cls === 'down' ? 'good' : 'flat')
const yoyIncomeClass = computed(() => yoyIncome.value.cls === 'up' ? 'good' : yoyIncome.value.cls === 'down' ? 'bad' : 'flat')

// 支出分类排行
const chartColors = ['#e88b8b', '#7ecb7c', '#6bb8e3', '#f5a962', '#a78bfa', '#f472b6', '#38bdf8', '#c084fc', '#94a3b8']
const topCategories = computed(() => {
  const map = new Map<string, number>()
  for (const tx of periodData.value.txs.filter(t => t.type === 'expense')) {
    map.set(tx.category, (map.get(tx.category) || 0) + tx.amount)
  }
  const total = [...map.values()].reduce((s, v) => s + v, 0)
  const list = [...map.entries()]
    .map(([name, amount], i) => ({
      name,
      amount,
      percent: total > 0 ? amount / total : 0,
      icon: getCategoryIcon(name),
      color: chartColors[i % chartColors.length],
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
  return list
})

function getCategoryIcon(name: string): string {
  const map: Record<string, string> = {
    '餐饮': '🍜', '交通': '🚗', '购物': '🛍️', '娱乐': '🎮',
    '居家': '🏠', '医疗': '💊', '教育': '📚', '人情': '🎁', '其他': '📦',
  }
  return map[name] || '📦'
}

// 趋势图数据
const trendChartData = computed(() => {
  const result: { label: string; income: number; expense: number }[] = []
  if (reportType.value === 'month') {
    const daysInMonth = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayTxs = periodData.value.txs.filter(t => t.date === dateKey)
      result.push({
        label: d % 5 === 0 || d === 1 ? String(d) : '',
        income: dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      })
    }
  } else {
    for (let m = 1; m <= 12; m++) {
      const monthKey = `${selectedYear.value}-${String(m).padStart(2, '0')}`
      const monthTxs = periodData.value.txs.filter(t => t.date.startsWith(monthKey))
      result.push({
        label: `${m}月`,
        income: monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      })
    }
  }
  return result
})

const trendMax = computed(() => Math.max(...trendChartData.value.map(d => Math.max(d.income, d.expense)), 1))

// 报告总结
const reportSummary = computed(() => {
  const { income, expense, balance } = periodData.value
  const parts: string[] = []

  if (reportType.value === 'month') {
    parts.push(`${selectedYear.value}年${selectedMonth.value}月`)
  } else {
    parts.push(`${selectedYear.value}年`)
  }

  parts.push(`共收入 ¥${income.toFixed(2)}，支出 ¥${expense.toFixed(2)}，结余 ¥${balance.toFixed(2)}。`)

  // 支出环比
  if (momExpense.value.cls === 'up') {
    parts.push(`支出环比增加 ${momExpense.value.text}，请注意控制开支。`)
  } else if (momExpense.value.cls === 'down') {
    parts.push(`支出环比减少 ${momExpense.value.text}，继续保持！`)
  }

  // 最大支出分类
  if (topCategories.value.length > 0) {
    const top = topCategories.value[0]
    parts.push(`最大支出分类为「${top.name}」，占比 ${(top.percent * 100).toFixed(1)}%。`)
  }

  // 储蓄率
  if (income > 0) {
    const rate = (balance / income) * 100
    if (rate > 30) parts.push(`储蓄率 ${rate.toFixed(0)}%，财务状况良好。`)
    else if (rate > 0) parts.push(`储蓄率 ${rate.toFixed(0)}%，仍有优化空间。`)
    else parts.push(`本月入不敷出，需要控制支出。`)
  }

  return parts.join('')
})
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.35);
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center; z-index: 200;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.modal-card {
  width: 100%; max-width: 420px; background: var(--bg-primary);
  border-radius: 28px 28px 16px 16px; padding: 20px 16px 24px;
  box-shadow: 0 -8px 32px rgba(0,0,0,0.12), 0 20px 60px rgba(0,0,0,0.2);
  display: flex; flex-direction: column; gap: 16px; max-height: 88vh; overflow-y: auto;
}
.modal-top-row { display: flex; align-items: center; justify-content: space-between; padding: 0 4px; }
.modal-cancel { background: none; border: none; font-size: 15px; color: var(--text-secondary); cursor: pointer; font-family: var(--sans); padding: 4px 8px; }
.modal-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0; }
.period-switch { display: flex; gap: 4px; background: var(--bg-card); border-radius: 12px; padding: 3px; box-shadow: var(--shadow-inset); }
.period-btn { border: none; border-radius: 10px; padding: 4px 14px; font-size: 13px; font-weight: 500; font-family: var(--sans); cursor: pointer; transition: all 0.2s; background: transparent; color: var(--text-secondary); }
.period-btn.active { background: var(--bg-primary); box-shadow: var(--shadow-sm); color: var(--accent-dark); font-weight: 700; }

.period-nav { display: flex; align-items: center; justify-content: center; gap: 20px; }
.nav-btn { width: 36px; height: 36px; border: none; border-radius: 50%; background: var(--bg-card); font-size: 20px; color: var(--text-secondary); cursor: pointer; font-family: var(--sans); box-shadow: var(--shadow-sm); transition: all 0.2s; }
.nav-btn:active { transform: scale(0.92); }
.nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.period-label { font-size: 18px; font-weight: 700; color: var(--text-primary); min-width: 120px; text-align: center; }

.overview-cards { display: flex; gap: 8px; }
.overview-card { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 8px; border-radius: 16px; background: var(--bg-card); box-shadow: var(--shadow-sm); }
.overview-card-label { font-size: 11px; color: var(--text-muted); font-weight: 500; }
.overview-card-value { font-size: 14px; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums; }
.overview-card.income .overview-card-value { color: var(--income); }
.overview-card.expense .overview-card-value { color: var(--expense); }

.analysis-section { display: flex; flex-direction: column; gap: 10px; }
.section-h { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; }
.compare-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; background: var(--bg-card); box-shadow: var(--shadow-sm); }
.compare-label { display: flex; flex-direction: column; gap: 2px; min-width: 80px; }
.compare-tag { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 8px; width: fit-content; }
.compare-tag.blue { background: rgba(107,184,227,0.15); color: #6bb8e3; }
.compare-tag.green { background: rgba(126,203,124,0.15); color: #5cb85c; }
.compare-desc { font-size: 11px; color: var(--text-muted); }
.compare-data { display: flex; gap: 16px; flex: 1; }
.compare-item { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.compare-item-label { font-size: 11px; color: var(--text-muted); }
.compare-item-value { font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
.compare-item-value.good { color: var(--income); }
.compare-item-value.bad { color: var(--expense); }
.compare-item-value.flat { color: var(--text-muted); }

.ranking-section { display: flex; flex-direction: column; gap: 10px; }
.empty-mini { font-size: 13px; color: var(--text-muted); padding: 16px 0; text-align: center; }
.rank-list { display: flex; flex-direction: column; gap: 8px; }
.rank-row { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 12px; background: var(--bg-card); box-shadow: var(--shadow-sm); }
.rank-num { font-size: 14px; font-weight: 800; color: var(--accent-dark); width: 18px; text-align: center; }
.rank-icon { font-size: 16px; }
.rank-name { font-size: 13px; font-weight: 600; color: var(--text-primary); min-width: 36px; }
.rank-bar-wrap { flex: 1; height: 8px; border-radius: 4px; background: rgba(0,0,0,0.04); overflow: hidden; min-width: 40px; }
.rank-bar { height: 100%; border-radius: 4px; transition: width 0.5s; }
.rank-val { font-size: 12px; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums; min-width: 60px; text-align: right; }
.rank-pct { font-size: 11px; color: var(--text-muted); min-width: 36px; text-align: right; }

.trend-section { display: flex; flex-direction: column; gap: 10px; }
.mini-trend-chart { padding: 14px 8px; border-radius: 14px; background: var(--bg-card); box-shadow: var(--shadow-sm); }
.mini-trend-bars { display: flex; align-items: flex-end; gap: 2px; height: 120px; overflow-x: auto; }
.mini-trend-col { flex: 1; min-width: 8px; display: flex; flex-direction: column; align-items: center; height: 100%; }
.mini-trend-bar-group { flex: 1; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 1px; }
.mini-bar { width: 80%; max-width: 10px; border-radius: 3px 3px 1px 1px; min-height: 2px; transition: height 0.5s; }
.mini-bar-income { background: #7ecb7c; }
.mini-bar-expense { background: #e88b8b; }
.mini-trend-label { font-size: 8px; color: var(--text-muted); margin-top: 2px; white-space: nowrap; }

.summary-box { display: flex; flex-direction: column; gap: 8px; padding: 14px; border-radius: 14px; background: var(--accent-light); }
.summary-content p { font-size: 13px; color: var(--accent-dark); line-height: 1.7; margin: 0; }

.modal-enter-active { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
.modal-leave-active { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: translateY(100%); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: translateY(50%); }
</style>
