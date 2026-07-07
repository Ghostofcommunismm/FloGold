<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-card">
          <!-- 顶部操作栏 -->
          <div class="modal-top-row">
            <button class="modal-cancel" @click="$emit('close')">取消</button>
            <h3 class="modal-title">选择月份</h3>
            <button class="modal-save" @click="confirm">确定</button>
          </div>

          <!-- 年份切换 -->
          <div class="year-nav">
            <button class="year-btn neumorph-circle" @click="prevYear">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span class="year-text">{{ tempYear }} 年</span>
            <button class="year-btn neumorph-circle" @click="nextYear">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          <!-- 月份网格 -->
          <div class="month-grid">
            <button
              v-for="m in 12"
              :key="m"
              class="month-btn"
              :class="{
                active: tempMonth === m,
                current: isCurrentMonth(m)
              }"
              @click="selectMonth(m)"
            >{{ m }}月</button>
          </div>

          <!-- 快捷回到本月 -->
          <button class="current-btn" @click="goCurrent">回到本月</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
  year: number
  month: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', year: number, month: number): void
}>()

const tempYear = ref(props.year)
const tempMonth = ref(props.month)

watch(() => props.show, (v) => {
  if (v) {
    tempYear.value = props.year
    tempMonth.value = props.month
  }
})

function prevYear() {
  tempYear.value--
}

function nextYear() {
  tempYear.value++
}

function isCurrentMonth(m: number): boolean {
  const now = new Date()
  return tempYear.value === now.getFullYear() && m === now.getMonth() + 1
}

function selectMonth(m: number) {
  tempMonth.value = m
}

function goCurrent() {
  const now = new Date()
  tempYear.value = now.getFullYear()
  tempMonth.value = now.getMonth() + 1
}

function confirm() {
  emit('select', tempYear.value, tempMonth.value)
}
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

/* 年份切换 */
.year-nav { display: flex; align-items: center; justify-content: center; gap: 24px; padding: 4px 0; }
.year-btn { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-card); box-shadow: var(--shadow-sm); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); transition: all 0.2s ease; }
.year-btn:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
.year-btn:active { transform: scale(0.92); }
.year-text { font-size: 20px; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums; min-width: 90px; text-align: center; }

/* 月份网格 */
.month-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.month-btn {
  position: relative;
  padding: 14px 0;
  border: none;
  border-radius: 14px;
  background: var(--bg-card);
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--sans);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}
.month-btn:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
.month-btn:active { transform: scale(0.96); }
.month-btn.active {
  background: linear-gradient(145deg, #D4A843 0%, #B8860B 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(184, 134, 11, 0.3), inset 0 1px 0 rgba(255,255,255,0.2);
}
/* 当前真实月份小圆点 */
.month-btn.current::after {
  content: '';
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
}
.month-btn.current.active::after { background: #fff; opacity: 0.8; }

/* 回到本月按钮 */
.current-btn {
  padding: 12px;
  border: none;
  border-radius: 14px;
  background: var(--bg-card);
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-dark);
  cursor: pointer;
  font-family: var(--sans);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}
.current-btn:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
.current-btn:active { transform: scale(0.98); }

.modal-enter-active { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
.modal-leave-active { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: translateY(100%); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: translateY(50%); }
</style>
