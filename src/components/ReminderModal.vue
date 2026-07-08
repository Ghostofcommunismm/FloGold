<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-card">
          <!-- 顶部操作栏 -->
          <div class="modal-top-row">
            <button class="modal-cancel" @click="$emit('close')">取消</button>
            <h3 class="modal-title">记账提醒</h3>
            <button class="modal-save" @click="save">保存</button>
          </div>

          <!-- 开启提醒 -->
          <div class="toggle-row" @click="local.enabled = !local.enabled">
            <div class="toggle-left">
              <span class="toggle-icon"><IconDisplay icon="Bell" :size="22" /></span>
              <div class="toggle-info">
                <span class="toggle-label">每日记账提醒</span>
                <span class="toggle-desc">在指定时间提醒你记账</span>
              </div>
            </div>
            <div class="switch" :class="{ on: local.enabled }">
              <div class="switch-dot"></div>
            </div>
          </div>

          <template v-if="local.enabled">
            <!-- 提醒时间 -->
            <div class="setting-section">
              <label class="setting-label">提醒时间</label>
              <div class="time-picker-row">
                <select v-model="hour" class="time-select">
                  <option v-for="h in 24" :key="h" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}</option>
                </select>
                <span class="time-colon">:</span>
                <select v-model="minute" class="time-select">
                  <option v-for="m in [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
                </select>
              </div>
            </div>

            <!-- 重复频率 -->
            <div class="setting-section">
              <label class="setting-label">重复频率</label>
              <div class="weekday-row">
                <button
                  v-for="(wd, i) in ['日','一','二','三','四','五','六']"
                  :key="i"
                  class="weekday-btn"
                  :class="{ active: local.days.includes(i) }"
                  @click="toggleDay(i)"
                >{{ wd }}</button>
              </div>
              <p class="setting-hint">点击选择需要提醒的星期</p>
            </div>

            <!-- 提醒预览 -->
            <div class="preview-box">
              <span class="preview-icon">⏰</span>
              <span class="preview-text">{{ previewText }}</span>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ReminderSettings } from '../types'
import IconDisplay from './IconDisplay.vue'

const props = defineProps<{
  show: boolean
  reminder: ReminderSettings
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', reminder: ReminderSettings): void
}>()

const local = ref<ReminderSettings>({ enabled: false, time: '20:00', days: [] })
const hour = ref(20)
const minute = ref(0)

watch(() => props.show, (v) => {
  if (v) {
    local.value = { ...props.reminder }
    const [h, m] = props.reminder.time.split(':').map(Number)
    hour.value = h || 20
    minute.value = m || 0
  }
})

watch([hour, minute], () => {
  local.value.time = `${String(hour.value).padStart(2, '0')}:${String(minute.value).padStart(2, '0')}`
})

function toggleDay(day: number) {
  const idx = local.value.days.indexOf(day)
  if (idx >= 0) {
    local.value.days.splice(idx, 1)
  } else {
    local.value.days.push(day)
  }
}

const previewText = computed(() => {
  if (!local.value.enabled) return '提醒已关闭'
  const days = local.value.days.length
  let dayText = '每天'
  if (days === 0) dayText = '未选择日期'
  else if (days === 7) dayText = '每天'
  else if (days === 5 && [1,2,3,4,5].every(d => local.value.days.includes(d))) dayText = '工作日'
  else if (days === 2 && [0,6].every(d => local.value.days.includes(d))) dayText = '周末'
  else dayText = '每周' + local.value.days.sort().map(d => ['日','一','二','三','四','五','六'][d]).join('、')
  return `${dayText} ${local.value.time} 提醒记账`
})

function save() {
  emit('save', { ...local.value })
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

.toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-radius: 16px; background: var(--bg-card); box-shadow: var(--shadow-sm); cursor: pointer; }
.toggle-left { display: flex; align-items: center; gap: 12px; }
.toggle-icon { font-size: 22px; }
.toggle-info { display: flex; flex-direction: column; gap: 2px; }
.toggle-label { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.toggle-desc { font-size: 12px; color: var(--text-muted); }
.switch { width: 48px; height: 28px; border-radius: 14px; background: rgba(0,0,0,0.1); position: relative; transition: all 0.3s; }
.switch.on { background: var(--accent); }
.switch-dot { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: all 0.3s; }
.switch.on .switch-dot { left: 23px; }

.setting-section { display: flex; flex-direction: column; gap: 8px; }
.setting-label { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.setting-hint { font-size: 12px; color: var(--text-muted); }
.time-picker-row { display: flex; align-items: center; gap: 8px; }
.time-select { flex: 1; padding: 12px; border: none; border-radius: 14px; background: var(--bg-card); font-size: 24px; font-weight: 700; color: var(--text-primary); font-family: var(--sans); outline: none; text-align: center; box-shadow: var(--shadow-inset); }
.time-colon { font-size: 24px; font-weight: 700; color: var(--text-muted); }

.weekday-row { display: flex; gap: 6px; }
.weekday-btn { flex: 1; padding: 12px 0; border: none; border-radius: 12px; background: var(--bg-card); font-size: 14px; color: var(--text-secondary); cursor: pointer; font-family: var(--sans); font-weight: 500; box-shadow: var(--shadow-sm); transition: all 0.2s; }
.weekday-btn.active { background: var(--accent); color: #fff; font-weight: 700; }

.preview-box { display: flex; align-items: center; gap: 8px; padding: 14px 16px; border-radius: 14px; background: var(--accent-light); }
.preview-icon { font-size: 18px; }
.preview-text { font-size: 14px; color: var(--accent-dark); font-weight: 600; }

.modal-enter-active { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
.modal-leave-active { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: translateY(100%); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: translateY(50%); }
</style>
