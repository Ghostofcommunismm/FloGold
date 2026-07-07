<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-card">
          <!-- 顶部操作栏 -->
          <div class="modal-top-row">
            <button class="modal-cancel" @click="$emit('close')">取消</button>
            <h3 class="modal-title">预算管理</h3>
            <button class="modal-save" @click="save">保存</button>
          </div>

          <!-- 月度总预算 -->
          <div class="budget-section">
            <label class="budget-label">月度支出总预算</label>
            <div class="budget-input-row">
              <span class="budget-currency">¥</span>
              <input
                v-model="limitStr"
                type="text"
                class="budget-input"
                placeholder="0"
                inputmode="decimal"
                @input="onInput"
              />
            </div>
            <p class="budget-hint">设置后将在首页和统计页显示预算使用进度</p>
          </div>

          <!-- 本月预算使用情况 -->
          <div v-if="currentMonthExpense > 0 || limit > 0" class="budget-overview">
            <div class="overview-row">
              <span class="overview-label">本月已支出</span>
              <span class="overview-value expense">¥{{ currentMonthExpense.toFixed(2) }}</span>
            </div>
            <div class="overview-row">
              <span class="overview-label">月度预算</span>
              <span class="overview-value">¥{{ (limit || 0).toFixed(2) }}</span>
            </div>
            <div class="overview-row">
              <span class="overview-label">剩余预算</span>
              <span class="overview-value" :class="{ over: remaining < 0 }">
                ¥{{ remaining.toFixed(2) }}
              </span>
            </div>
            <!-- 进度条 -->
            <div class="budget-progress">
              <div class="progress-track">
                <div
                  class="progress-fill"
                  :class="{ over: usagePercent > 100 }"
                  :style="{ width: Math.min(usagePercent, 100) + '%' }"
                ></div>
              </div>
              <span class="progress-text" :class="{ over: usagePercent > 100 }">
                {{ usagePercent.toFixed(0) }}%
                <template v-if="usagePercent > 100">（超支）</template>
              </span>
            </div>
          </div>

          <!-- 快捷设置 -->
          <div class="quick-budget">
            <span class="quick-label">快捷设置：</span>
            <div class="quick-btns">
              <button v-for="v in [2000, 3000, 5000, 8000, 10000]" :key="v" class="quick-btn" @click="setQuick(v)">
                ¥{{ v.toLocaleString() }}
              </button>
              <button class="quick-btn clear" @click="setQuick(0)">清除</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { currentMonthKey } from '../storage'

const props = defineProps<{
  show: boolean
  budget: number
  transactions: { date: string; amount: number; type: string }[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', limit: number): void
}>()

const limitStr = ref(String(props.budget || ''))
const limit = ref(props.budget)

watch(() => props.show, (v) => {
  if (v) {
    limit.value = props.budget
    limitStr.value = props.budget ? String(props.budget) : ''
  }
})

function onInput() {
  limitStr.value = limitStr.value.replace(/[^\d.]/g, '')
  const parts = limitStr.value.split('.')
  if (parts.length > 2) limitStr.value = parts[0] + '.' + parts.slice(1).join('')
  if (parts[1] && parts[1].length > 2) limitStr.value = parts[0] + '.' + parts[1].substring(0, 2)
  limit.value = parseFloat(limitStr.value) || 0
}

function setQuick(v: number) {
  limit.value = v
  limitStr.value = v ? String(v) : ''
}

function save() {
  emit('save', limit.value)
}

const cmKey = currentMonthKey()
const currentMonthExpense = computed(() =>
  props.transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(cmKey))
    .reduce((s, t) => s + t.amount, 0)
)
const remaining = computed(() => (limit.value || 0) - currentMonthExpense.value)
const usagePercent = computed(() => {
  if (limit.value <= 0) return 0
  return (currentMonthExpense.value / limit.value) * 100
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
  display: flex; flex-direction: column; gap: 18px; max-height: 85vh; overflow-y: auto;
}
.modal-top-row { display: flex; align-items: center; justify-content: space-between; padding: 0 4px; }
.modal-cancel { background: none; border: none; font-size: 15px; color: var(--text-secondary); cursor: pointer; font-family: var(--sans); padding: 4px 8px; }
.modal-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0; }
.modal-save { background: var(--accent); border: none; font-size: 14px; font-weight: 600; color: #fff; cursor: pointer; font-family: var(--sans); padding: 6px 16px; border-radius: 16px; box-shadow: 0 2px 8px rgba(212,165,116,0.35); }
.modal-save:active { transform: scale(0.95); }

.budget-section { display: flex; flex-direction: column; gap: 8px; }
.budget-label { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.budget-input-row { display: flex; align-items: center; gap: 4px; padding: 14px 20px; border-radius: 16px; background: var(--bg-card); box-shadow: var(--shadow-inset); }
.budget-currency { font-size: 24px; color: var(--text-muted); }
.budget-input { flex: 1; border: none; background: none; font-size: 28px; font-weight: 700; color: var(--text-primary); outline: none; font-family: var(--sans); font-variant-numeric: tabular-nums; }
.budget-hint { font-size: 12px; color: var(--text-muted); }

.budget-overview { display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 16px; background: var(--bg-card); box-shadow: var(--shadow-sm); }
.overview-row { display: flex; justify-content: space-between; align-items: center; }
.overview-label { font-size: 13px; color: var(--text-secondary); }
.overview-value { font-size: 15px; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums; }
.overview-value.expense { color: var(--expense); }
.overview-value.over { color: var(--expense); }
.budget-progress { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
.progress-track { height: 10px; border-radius: 5px; background: rgba(0,0,0,0.05); overflow: hidden; }
.progress-fill { height: 100%; border-radius: 5px; background: var(--income); transition: width 0.5s ease; }
.progress-fill.over { background: var(--expense); }
.progress-text { font-size: 12px; font-weight: 600; color: var(--income); text-align: right; }
.progress-text.over { color: var(--expense); }

.quick-budget { display: flex; flex-direction: column; gap: 8px; }
.quick-label { font-size: 13px; color: var(--text-secondary); }
.quick-btns { display: flex; flex-wrap: wrap; gap: 8px; }
.quick-btn { padding: 8px 14px; border: none; border-radius: 14px; background: var(--bg-card); font-size: 13px; color: var(--text-primary); cursor: pointer; font-family: var(--sans); font-weight: 500; box-shadow: var(--shadow-sm); transition: all 0.2s; }
.quick-btn:active { transform: scale(0.95); }
.quick-btn.clear { color: var(--text-muted); }

.modal-enter-active { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
.modal-leave-active { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: translateY(100%); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: translateY(50%); }
</style>
