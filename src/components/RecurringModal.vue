<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-card">
          <!-- 顶部操作栏 -->
          <div class="modal-top-row">
            <button class="modal-cancel" @click="$emit('close')">返回</button>
            <h3 class="modal-title">周期性记账</h3>
            <button class="modal-save" @click="showAdd = !showAdd">+ 添加</button>
          </div>

          <!-- 添加区域 -->
          <Transition name="expand">
            <div v-if="showAdd" class="add-section">
              <div class="add-tabs">
                <button class="add-tab" :class="{ active: form.type === 'expense' }" @click="form.type = 'expense'">支出</button>
                <button class="add-tab" :class="{ active: form.type === 'income' }" @click="form.type = 'income'">收入</button>
              </div>

              <div class="add-field">
                <label class="field-label">名称</label>
                <input v-model="form.name" type="text" class="field-input" placeholder="如：房租、工资" maxlength="10" />
              </div>

              <div class="add-field">
                <label class="field-label">金额</label>
                <div class="amount-input-row">
                  <span class="field-currency">¥</span>
                  <input v-model="form.amountStr" type="text" class="field-input" placeholder="0.00" inputmode="decimal" @input="onAmountInput" />
                </div>
              </div>

              <div class="add-field">
                <label class="field-label">分类</label>
                <div class="cat-select-row">
                  <button
                    v-for="cat in categories"
                    :key="cat.name"
                    class="cat-select-chip"
                    :class="{ active: form.category === cat.name }"
                    @click="selectCategory(cat.name)"
                  >{{ cat.icon }} {{ cat.name }}</button>
                </div>
              </div>

              <div class="add-field">
                <label class="field-label">频率</label>
                <div class="freq-row">
                  <button class="freq-btn" :class="{ active: form.frequency === 'daily' }" @click="form.frequency = 'daily'">每天</button>
                  <button class="freq-btn" :class="{ active: form.frequency === 'weekly' }" @click="form.frequency = 'weekly'">每周</button>
                  <button class="freq-btn" :class="{ active: form.frequency === 'monthly' }" @click="form.frequency = 'monthly'">每月</button>
                </div>
              </div>

              <!-- 每周选择 -->
              <div v-if="form.frequency === 'weekly'" class="add-field">
                <label class="field-label">星期</label>
                <div class="weekday-row">
                  <button
                    v-for="(wd, i) in ['日','一','二','三','四','五','六']"
                    :key="i"
                    class="weekday-btn"
                    :class="{ active: form.dayOfWeek === i }"
                    @click="form.dayOfWeek = i"
                  >{{ wd }}</button>
                </div>
              </div>

              <!-- 每月选择 -->
              <div v-if="form.frequency === 'monthly'" class="add-field">
                <label class="field-label">每月几号</label>
                <input v-model.number="form.dayOfMonth" type="number" min="1" max="31" class="field-input day-input" />
              </div>

              <button class="add-confirm-btn" :disabled="!canAdd" @click="addRecurring">添加周期性记账</button>
            </div>
          </Transition>

          <!-- 已有列表 -->
          <div v-if="items.length === 0" class="empty-state">
            <span class="empty-icon"><IconDisplay icon="RefreshCw" :size="48" /></span>
            <span class="empty-text">暂无周期性记账，点击上方添加</span>
          </div>
          <div v-else class="recurring-list">
            <div
              v-for="item in items"
              :key="item.id"
              class="recurring-item"
            >
              <div class="recurring-left">
                <span class="recurring-icon"><IconDisplay :icon="getLucideIconName(item.icon)" :size="22" /></span>
                <div class="recurring-info">
                  <span class="recurring-name">{{ item.name }}</span>
                  <span class="recurring-desc">{{ freqText(item) }} · {{ item.category }}</span>
                </div>
              </div>
              <div class="recurring-right">
                <span class="recurring-amount" :class="item.type">{{ item.type === 'income' ? '+' : '-' }}¥{{ item.amount.toFixed(2) }}</span>
                <div class="recurring-actions">
                  <button class="toggle-btn" :class="{ off: !item.enabled }" @click="toggle(item.id)">
                    {{ item.enabled ? '开启' : '已停' }}
                  </button>
                  <button class="del-btn" @click="remove(item.id)">删除</button>
                </div>
              </div>
            </div>
          </div>

          <div class="info-box">
            <p class="info-text"><IconDisplay icon="Lightbulb" :size="16" /> 周期性记账会在到期日自动添加一笔交易记录。打开App时自动检查并触发。</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Category, RecurringItem } from '../types'
import IconDisplay from './IconDisplay.vue'
import { getLucideIconName } from '../utils/emojiToLucide'

const props = defineProps<{
  show: boolean
  items: RecurringItem[]
  categories: Category[]
  subCategories: Record<string, string[]>
  nextId: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'add', item: RecurringItem): void
  (e: 'toggle', id: number): void
  (e: 'remove', id: number): void
}>()

const showAdd = ref(false)
const form = ref({
  type: 'expense' as 'expense' | 'income',
  name: '',
  amountStr: '',
  category: '',
  subCategory: '',
  icon: 'Package',
  frequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
  dayOfWeek: 1,
  dayOfMonth: 1,
})

const items = computed(() => props.items)

watch(() => props.show, (v) => {
  if (v) {
    showAdd.value = false
    resetForm()
  }
})

function resetForm() {
  form.value = {
    type: 'expense',
    name: '',
    amountStr: '',
    category: props.categories[0]?.name || '其他',
    subCategory: props.subCategories[props.categories[0]?.name || '']?.[0] || '其他',
    icon: props.categories[0]?.icon || 'Package',
    frequency: 'monthly',
    dayOfWeek: 1,
    dayOfMonth: 1,
  }
}

function selectCategory(name: string) {
  form.value.category = name
  const cat = props.categories.find(c => c.name === name)
  if (cat) form.value.icon = cat.icon
  form.value.subCategory = props.subCategories[name]?.[0] || '其他'
}

function onAmountInput() {
  form.value.amountStr = form.value.amountStr.replace(/[^\d.]/g, '')
  const parts = form.value.amountStr.split('.')
  if (parts.length > 2) form.value.amountStr = parts[0] + '.' + parts.slice(1).join('')
  if (parts[1] && parts[1].length > 2) form.value.amountStr = parts[0] + '.' + parts[1].substring(0, 2)
}

const canAdd = computed(() => {
  return form.value.name.trim() !== '' && parseFloat(form.value.amountStr) > 0 && form.value.category !== ''
})

function addRecurring() {
  if (!canAdd.value) return
  const item: RecurringItem = {
    id: props.nextId,
    name: form.value.name.trim(),
    amount: parseFloat(form.value.amountStr),
    type: form.value.type,
    category: form.value.category,
    subCategory: form.value.type === 'expense' ? form.value.subCategory : undefined,
    icon: form.value.icon,
    frequency: form.value.frequency,
    dayOfWeek: form.value.frequency === 'weekly' ? form.value.dayOfWeek : undefined,
    dayOfMonth: form.value.frequency === 'monthly' ? form.value.dayOfMonth : undefined,
    enabled: true,
  }
  emit('add', item)
  showAdd.value = false
  resetForm()
}

function toggle(id: number) {
  emit('toggle', id)
}

function remove(id: number) {
  emit('remove', id)
}

function freqText(item: RecurringItem): string {
  if (item.frequency === 'daily') return '每天'
  if (item.frequency === 'weekly') return `每周${['日','一','二','三','四','五','六'][item.dayOfWeek ?? 1]}`
  return `每月${item.dayOfMonth}号`
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
  display: flex; flex-direction: column; gap: 16px; max-height: 85vh; overflow-y: auto;
}
.modal-top-row { display: flex; align-items: center; justify-content: space-between; padding: 0 4px; }
.modal-cancel { background: none; border: none; font-size: 15px; color: var(--text-secondary); cursor: pointer; font-family: var(--sans); padding: 4px 8px; }
.modal-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0; }
.modal-save { background: var(--accent); border: none; font-size: 14px; font-weight: 600; color: #fff; cursor: pointer; font-family: var(--sans); padding: 6px 16px; border-radius: 16px; box-shadow: 0 2px 8px rgba(212,165,116,0.35); }

.add-section { display: flex; flex-direction: column; gap: 12px; padding: 14px; border-radius: 16px; background: var(--bg-card); box-shadow: var(--shadow-sm); }
.add-tabs { display: flex; gap: 10px; justify-content: center; }
.add-tab { padding: 7px 28px; border-radius: 18px; border: none; background: var(--bg-primary); font-size: 14px; color: var(--text-secondary); cursor: pointer; font-family: var(--sans); font-weight: 500; box-shadow: var(--shadow-inset); transition: all 0.2s; }
.add-tab.active { color: var(--accent-dark); font-weight: 700; box-shadow: var(--shadow-md), var(--glow-accent); }

.add-field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.field-input { padding: 10px 14px; border: none; border-radius: 12px; background: var(--bg-primary); box-shadow: var(--shadow-inset); font-size: 15px; font-family: var(--sans); color: var(--text-primary); outline: none; }
.amount-input-row { display: flex; align-items: center; gap: 4px; padding: 10px 14px; border-radius: 12px; background: var(--bg-primary); box-shadow: var(--shadow-inset); }
.field-currency { font-size: 18px; color: var(--text-muted); }
.day-input { max-width: 80px; }

.cat-select-row { display: flex; flex-wrap: wrap; gap: 6px; }
.cat-select-chip { padding: 6px 12px; border: none; border-radius: 14px; background: var(--bg-primary); font-size: 13px; color: var(--text-secondary); cursor: pointer; font-family: var(--sans); box-shadow: var(--shadow-inset); transition: all 0.2s; }
.cat-select-chip.active { background: var(--accent-light); color: var(--accent-dark); font-weight: 700; }

.freq-row { display: flex; gap: 8px; }
.freq-btn { flex: 1; padding: 10px; border: none; border-radius: 12px; background: var(--bg-primary); font-size: 14px; color: var(--text-secondary); cursor: pointer; font-family: var(--sans); font-weight: 500; box-shadow: var(--shadow-inset); transition: all 0.2s; }
.freq-btn.active { background: var(--accent-light); color: var(--accent-dark); font-weight: 700; }

.weekday-row { display: flex; gap: 4px; }
.weekday-btn { flex: 1; padding: 8px 0; border: none; border-radius: 10px; background: var(--bg-primary); font-size: 13px; color: var(--text-secondary); cursor: pointer; font-family: var(--sans); box-shadow: var(--shadow-inset); transition: all 0.2s; }
.weekday-btn.active { background: var(--accent); color: #fff; font-weight: 700; }

.add-confirm-btn { padding: 12px; border: none; border-radius: 14px; background: var(--accent); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; font-family: var(--sans); box-shadow: 0 4px 12px rgba(212,165,116,0.4); }
.add-confirm-btn:disabled { opacity: 0.4; }
.add-confirm-btn:active { transform: scale(0.98); }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 0; }
.empty-icon { font-size: 48px; }
.empty-text { font-size: 14px; color: var(--text-muted); }

.recurring-list { display: flex; flex-direction: column; gap: 8px; }
.recurring-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 14px; background: var(--bg-card); box-shadow: var(--shadow-sm); }
.recurring-left { display: flex; align-items: center; gap: 10px; }
.recurring-icon { font-size: 22px; }
.recurring-info { display: flex; flex-direction: column; gap: 2px; }
.recurring-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.recurring-desc { font-size: 11px; color: var(--text-muted); }
.recurring-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.recurring-amount { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; }
.recurring-amount.income { color: var(--income); }
.recurring-amount.expense { color: var(--expense); }
.recurring-actions { display: flex; gap: 4px; }
.toggle-btn { padding: 3px 10px; border: none; border-radius: 8px; background: rgba(126,203,124,0.15); color: #5cb85c; font-size: 11px; font-weight: 600; cursor: pointer; font-family: var(--sans); }
.toggle-btn.off { background: rgba(0,0,0,0.06); color: var(--text-muted); }
.del-btn { padding: 3px 10px; border: none; border-radius: 8px; background: var(--expense-bg); color: var(--expense); font-size: 11px; font-weight: 600; cursor: pointer; font-family: var(--sans); }

.info-box { padding: 12px 14px; border-radius: 12px; background: var(--accent-light); }
.info-text { font-size: 12px; color: var(--accent-dark); line-height: 1.6; margin: 0; }

.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; }
.expand-enter-to, .expand-leave-from { opacity: 1; max-height: 600px; }

.modal-enter-active { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
.modal-leave-active { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: translateY(100%); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: translateY(50%); }
</style>
