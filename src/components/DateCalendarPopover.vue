<template>
  <Teleport to="body">
    <Transition name="dcp">
      <div v-if="show" class="dcp-overlay" @click.self="$emit('close')">
        <div class="dcp-card">
          <!-- 顶部 -->
          <div class="dcp-header">
            <button class="dcp-close" type="button" @click="$emit('close')">取消</button>
            <h3 class="dcp-title">选择日期</h3>
            <button class="dcp-confirm" type="button" @click="$emit('close')">完成</button>
          </div>

          <!-- 月份切换 -->
          <div class="dcp-month-nav">
            <button class="dcp-nav-btn" type="button" @click="prevMonth" aria-label="上个月">‹</button>
            <span class="dcp-month-text">{{ viewYear }} 年 {{ viewMonth }} 月</span>
            <button
              class="dcp-nav-btn"
              type="button"
              :disabled="!canNextMonth"
              @click="nextMonth"
              aria-label="下个月"
            >›</button>
          </div>

          <!-- 星期标题 -->
          <div class="dcp-weekdays">
            <span v-for="(d, i) in weekDays" :key="i">{{ d }}</span>
          </div>

          <!-- 日期网格 -->
          <div class="dcp-days">
            <button
              v-for="(cell, i) in cells"
              :key="i"
              type="button"
              class="dcp-day"
              :class="{
                selected: cell.date === modelValue,
                today: cell.date === todayStr,
                'other-month': !cell.inMonth,
                disabled: !cell.inMonth || cell.isFuture,
              }"
              :disabled="!cell.inMonth || cell.isFuture"
              @click="selectDay(cell)"
            >{{ cell.day }}</button>
          </div>

          <!-- 快捷 -->
          <div class="dcp-quick-row">
            <button class="dcp-quick-btn" type="button" @click="quickPick(0)">今天</button>
            <button class="dcp-quick-btn" type="button" @click="quickPick(-1)">昨天</button>
            <button class="dcp-quick-btn" type="button" @click="quickPick(-2)">前天</button>
            <button class="dcp-quick-btn" type="button" @click="quickPick(-7)">一周前</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Cell {
  day: number
  date: string
  inMonth: boolean
  isFuture: boolean
}

const props = withDefaults(
  defineProps<{
    show: boolean
    modelValue?: string
    max?: string
  }>(),
  { modelValue: '', max: '' },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'close'): void
}>()

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const todayStr = computed(() => fmt(new Date()))

const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth() + 1)

watch(
  () => [props.show, props.modelValue] as const,
  ([show, mv]) => {
    if (!show) return
    if (mv) {
      const [y, m] = mv.split('-').map(Number)
      if (y && m) {
        viewYear.value = y
        viewMonth.value = m
      }
    } else {
      const n = new Date()
      viewYear.value = n.getFullYear()
      viewMonth.value = n.getMonth() + 1
    }
  },
  { immediate: true },
)

const maxDateObj = computed(() => {
  const ds = props.max || todayStr.value
  const [y, m, d] = ds.split('-').map(Number)
  return new Date(y, m - 1, d)
})

const canNextMonth = computed(() => {
  const vm = new Date(viewYear.value, viewMonth.value - 1, 1)
  const mm = new Date(maxDateObj.value.getFullYear(), maxDateObj.value.getMonth(), 1)
  return vm < mm
})

function prevMonth() {
  if (viewMonth.value === 1) {
    viewMonth.value = 12
    viewYear.value -= 1
  } else {
    viewMonth.value -= 1
  }
}

function nextMonth() {
  if (!canNextMonth.value) return
  if (viewMonth.value === 12) {
    viewMonth.value = 1
    viewYear.value += 1
  } else {
    viewMonth.value += 1
  }
}

const cells = computed<Cell[]>(() => {
  const first = new Date(viewYear.value, viewMonth.value - 1, 1)
  let startWeekday = first.getDay()
  startWeekday = startWeekday === 0 ? 6 : startWeekday - 1

  const daysInMonth = new Date(viewYear.value, viewMonth.value, 0).getDate()
  const prevMonthDays = new Date(viewYear.value, viewMonth.value - 1, 0).getDate()
  const maxD = maxDateObj.value

  const out: Cell[] = []
  for (let i = startWeekday - 1; i >= 0; i--) {
    out.push({ day: prevMonthDays - i, date: '', inMonth: false, isFuture: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(viewYear.value, viewMonth.value - 1, d)
    const isFuture = dt > maxD
    out.push({ day: d, date: fmt(dt), inMonth: true, isFuture })
  }
  while (out.length < 42) {
    const tailIdx = out.length - startWeekday - daysInMonth
    out.push({ day: tailIdx + 1, date: '', inMonth: false, isFuture: false })
  }
  return out
})

function selectDay(cell: Cell) {
  if (!cell.inMonth || cell.isFuture) return
  emit('update:modelValue', cell.date)
  emit('close')
}

function quickPick(delta: number) {
  const d = new Date()
  d.setDate(d.getDate() + delta)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth() + 1
  emit('update:modelValue', fmt(d))
  emit('close')
}
</script>

<style scoped>
.dcp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 300;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.dcp-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-primary);
  border-radius: 28px 28px 16px 16px;
  padding: 16px 16px 24px;
  box-shadow:
    0 -8px 32px rgba(0, 0, 0, 0.12),
    0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 顶部 */
.dcp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}
.dcp-close {
  background: none;
  border: none;
  font-size: 15px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--sans);
  padding: 4px 8px;
}
.dcp-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.dcp-confirm {
  background: var(--accent);
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  font-family: var(--sans);
  padding: 6px 16px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(212, 165, 116, 0.35);
}
.dcp-close:active,
.dcp-confirm:active {
  transform: scale(0.95);
}

/* 月份切换 */
.dcp-month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 0;
}
.dcp-nav-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  font-family: var(--sans);
  box-shadow: var(--shadow-inset);
  transition: all 0.15s ease;
}
.dcp-nav-btn:not(:disabled):hover {
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}
.dcp-nav-btn:not(:disabled):active {
  transform: scale(0.92);
}
.dcp-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.dcp-month-text {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.3px;
}

/* 星期标题 */
.dcp-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  font-weight: 600;
}
.dcp-weekdays span {
  padding: 6px 0;
}

/* 日期网格 */
.dcp-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.dcp-day {
  aspect-ratio: 1 / 1;
  border: none;
  background: var(--bg-card);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  font-family: var(--sans);
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  line-height: 1;
  box-shadow: var(--shadow-inset);
}
.dcp-day:not(.disabled):not(.selected):hover {
  background: var(--accent-light);
  box-shadow: var(--shadow-sm);
}
.dcp-day:active:not(.disabled) {
  transform: scale(0.92);
}
.dcp-day.selected {
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 3px 8px rgba(212, 165, 116, 0.4);
}
.dcp-day.today:not(.selected) {
  border: 1.5px solid var(--accent);
  color: var(--accent-dark);
  font-weight: 700;
}
.dcp-day.other-month {
  color: var(--text-muted);
  opacity: 0.3;
  cursor: default;
}
.dcp-day.disabled {
  color: var(--text-muted);
  opacity: 0.4;
  cursor: not-allowed;
}

/* 快捷按钮 */
.dcp-quick-row {
  display: flex;
  gap: 6px;
  padding-top: 10px;
  margin-top: 2px;
  border-top: 1px solid rgba(174, 168, 155, 0.18);
}
.dcp-quick-btn {
  flex: 1;
  padding: 9px 4px;
  border: none;
  border-radius: 12px;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--sans);
  box-shadow: var(--shadow-inset);
  transition: all 0.15s ease;
  white-space: nowrap;
}
.dcp-quick-btn:hover {
  color: var(--accent-dark);
  box-shadow: var(--shadow-sm);
}
.dcp-quick-btn:active {
  transform: scale(0.96);
}

/* 弹入弹出动画 */
.dcp-enter-active,
.dcp-leave-active {
  transition: opacity 0.3s ease;
}
.dcp-enter-active .dcp-card,
.dcp-leave-active .dcp-card {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.dcp-enter-from,
.dcp-leave-to {
  opacity: 0;
}
.dcp-enter-from .dcp-card,
.dcp-leave-to .dcp-card {
  transform: translateY(100%);
}
</style>