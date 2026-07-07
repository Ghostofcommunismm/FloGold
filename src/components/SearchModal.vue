<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-card">
          <!-- 搜索栏 -->
          <div class="search-bar">
            <svg class="search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              ref="searchInput"
              v-model="keyword"
              type="text"
              class="search-input"
              placeholder="搜索名称、备注、商户、地点、分类..."
            />
            <button v-if="keyword" class="search-clear" @click="keyword = ''">✕</button>
          </div>

          <!-- 筛选条件 -->
          <div class="filter-row">
            <button class="filter-chip" :class="{ active: filterType === 'all' }" @click="filterType = 'all'">全部</button>
            <button class="filter-chip" :class="{ active: filterType === 'expense' }" @click="filterType = 'expense'">支出</button>
            <button class="filter-chip" :class="{ active: filterType === 'income' }" @click="filterType = 'income'">收入</button>
            <div class="filter-spacer"></div>
            <span class="result-count">{{ filtered.length }} 条结果</span>
          </div>

          <!-- 搜索结果 -->
          <div class="search-results">
            <div v-if="filtered.length === 0" class="empty-state">
              <span class="empty-icon">🔍</span>
              <span class="empty-text">{{ keyword ? '未找到相关记录' : '输入关键词搜索交易记录' }}</span>
            </div>
            <div v-else class="result-list">
              <div
                v-for="tx in filtered"
                :key="tx.id"
                class="result-item"
              >
                <div class="result-left">
                  <div class="result-icon-box" :class="tx.type">
                    <span>{{ tx.icon }}</span>
                  </div>
                  <div class="result-info">
                    <span class="result-name" v-html="highlight(tx.name)"></span>
                    <span class="result-meta">
                      {{ tx.category }}<template v-if="tx.subCategory"> · {{ tx.subCategory }}</template> · {{ formatDate(tx.date) }}
                      <template v-if="tx.merchant"> · 📍 {{ tx.merchant }}</template>
                    </span>
                  </div>
                </div>
                <span class="result-amount" :class="tx.type">
                  {{ tx.type === 'income' ? '+' : '-' }}¥{{ tx.amount.toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Transaction } from '../types'
import { formatDisplayDate } from '../storage'

const props = defineProps<{
  show: boolean
  transactions: Transaction[]
}>()

defineEmits<{ (e: 'close'): void }>()

const keyword = ref('')
const filterType = ref<'all' | 'expense' | 'income'>('all')
const searchInput = ref<HTMLInputElement | null>(null)

watch(() => props.show, (v) => {
  if (v) {
    keyword.value = ''
    filterType.value = 'all'
    nextTick(() => searchInput.value?.focus())
  }
})

function formatDate(dateStr: string) {
  return formatDisplayDate(dateStr)
}

function highlight(text: string): string {
  if (!keyword.value || !text) return text
  const escaped = keyword.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(escaped, 'gi'), (match) => `<mark>${match}</mark>`)
}

const filtered = computed(() => {
  let list = [...props.transactions].sort((a, b) => b.id - a.id)

  if (filterType.value !== 'all') {
    list = list.filter(t => t.type === filterType.value)
  }

  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(t => {
      return (
        t.name?.toLowerCase().includes(kw) ||
        t.category?.toLowerCase().includes(kw) ||
        t.subCategory?.toLowerCase().includes(kw) ||
        t.tag?.toLowerCase().includes(kw) ||
        t.merchant?.toLowerCase().includes(kw) ||
        t.location?.toLowerCase().includes(kw) ||
        String(t.amount).includes(kw)
      )
    })
  }

  return list
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
  display: flex; flex-direction: column; gap: 14px; max-height: 85vh; overflow-y: auto;
}

.search-bar { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 16px; background: var(--bg-card); box-shadow: var(--shadow-inset); }
.search-icon { color: var(--text-muted); flex-shrink: 0; }
.search-input { flex: 1; border: none; background: none; font-size: 16px; font-family: var(--sans); color: var(--text-primary); outline: none; }
.search-input::placeholder { color: var(--text-muted); }
.search-clear { border: none; background: none; font-size: 16px; color: var(--text-muted); cursor: pointer; padding: 0 4px; }

.filter-row { display: flex; align-items: center; gap: 8px; }
.filter-chip { padding: 6px 16px; border: none; border-radius: 14px; background: var(--bg-card); font-size: 13px; color: var(--text-secondary); cursor: pointer; font-family: var(--sans); font-weight: 500; box-shadow: var(--shadow-sm); transition: all 0.2s; }
.filter-chip.active { background: var(--accent-light); color: var(--accent-dark); font-weight: 700; }
.filter-spacer { flex: 1; }
.result-count { font-size: 12px; color: var(--text-muted); }

.search-results { flex: 1; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 0; }
.empty-icon { font-size: 48px; }
.empty-text { font-size: 14px; color: var(--text-muted); }

.result-list { display: flex; flex-direction: column; gap: 8px; }
.result-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 14px; background: var(--bg-card); box-shadow: var(--shadow-sm); }
.result-left { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.result-icon-box { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.result-icon-box.income { background: var(--income-bg); }
.result-icon-box.expense { background: var(--expense-bg); }
.result-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; overflow: hidden; }
.result-name { font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.result-name :deep(mark) { background: var(--accent-light); color: var(--accent-dark); border-radius: 3px; padding: 0 2px; }
.result-meta { font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.result-amount { font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; flex-shrink: 0; }
.result-amount.income { color: var(--income); }
.result-amount.expense { color: var(--expense); }

.modal-enter-active { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
.modal-leave-active { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
.modal-enter-from { opacity: 0; }
.modal-enter-from .modal-card { transform: translateY(100%); }
.modal-leave-to { opacity: 0; }
.modal-leave-to .modal-card { transform: translateY(50%); }
</style>
