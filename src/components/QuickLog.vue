<template>
  <section class="quicklog-section" v-reveal>
    <div v-if="topSubs.length === 0" class="quicklog-empty">
      <span class="quicklog-empty-text">记几笔后这里会出现常去的分类</span>
    </div>

    <div v-else class="quicklog-grid">
      <button
        v-for="(item, idx) in topSubs"
        :key="item.key"
        class="quicklog-item"
        :style="{ animationDelay: idx * 0.04 + 's' }"
        @click="onPick(item)"
      >
        <div class="ql-icon-wrap">
          <IconDisplay :icon="item.icon" :size="21" />
        </div>
        <span class="ql-name">{{ item.subCategory }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Transaction, Category, SubCategories } from '../types'
import { vReveal } from '../useAnimations'
import IconDisplay from './IconDisplay.vue'
import { getLucideIconName } from '../utils/emojiToLucide'

interface QuickSub {
  key: string
  category: string
  subCategory: string
  count: number
  amount: number
  icon: string  // Lucide 图标名称（兼容 emoji）
}

const props = withDefaults(
  defineProps<{
    transactions: Transaction[]
    categories: Category[]
    subCategories: SubCategories
    days?: number
    limit?: number
  }>(),
  { days: 30, limit: 4 },
)

const emit = defineEmits<{
  (e: 'pick', payload: { category: string; subCategory: string }): void
}>()

// 兜底图标: 当没有该 subCategory 的交易时,用 category 默认图标
function fallbackIcon(category: string): string {
  const cat = props.categories.find((c) => c.name === category)
  return cat?.icon || 'Package'
}

// 在 transactions 里找(category, subCategory)最近一笔的图标
function pickIcon(category: string, subCategory: string): string {
  // 按 id 倒序 = 按创建顺序倒序,最新一笔在前
  for (let i = props.transactions.length - 1; i >= 0; i--) {
    const t = props.transactions[i]
    if (t.category === category && t.subCategory === subCategory && t.icon) {
      return getLucideIconName(t.icon)
    }
  }
  return fallbackIcon(category)
}

const topSubs = computed<QuickSub[]>(() => {
  const now = new Date()
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - props.days)
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`

  const map = new Map<string, { category: string; subCategory: string; count: number; amount: number }>()
  for (const tx of props.transactions) {
    if (tx.type !== 'expense') continue
    if (!tx.subCategory) continue
    if (tx.date < cutoffStr) continue
    const key = `${tx.category}::${tx.subCategory}`
    const cur = map.get(key)
    if (cur) {
      cur.count += 1
      cur.amount += tx.amount
    } else {
      map.set(key, {
        category: tx.category,
        subCategory: tx.subCategory,
        count: 1,
        amount: tx.amount,
      })
    }
  }

  return Array.from(map.values())
    .sort((a, b) => (b.count - a.count) || (b.amount - a.amount))
    .slice(0, props.limit)
    .map((v) => {
      const key = `${v.category}::${v.subCategory}`
      return {
        key,
        category: v.category,
        subCategory: v.subCategory,
        count: v.count,
        amount: v.amount,
        icon: pickIcon(v.category, v.subCategory),
      }
    })
})

function onPick(item: QuickSub) {
  emit('pick', { category: item.category, subCategory: item.subCategory })
}
</script>

<style scoped>
.quicklog-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}

.quicklog-empty {
  padding: 16px 14px;
  border-radius: 14px;
  background: var(--bg-card);
  box-shadow: var(--shadow-inset);
  display: flex;
  align-items: center;
  justify-content: center;
}
.quicklog-empty-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.quicklog-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.quicklog-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 6px 10px;
  border-radius: 16px;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
  border: none;
  cursor: pointer;
  font-family: var(--sans);
  color: var(--text-primary);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  animation: quicklog-rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  overflow: visible;
}

.quicklog-item:hover {
  background: var(--bg-card-hover);
  box-shadow: var(--shadow-md);
}

.quicklog-item:active {
  transform: scale(0.94);
  box-shadow: var(--shadow-inset);
  background: var(--bg-card-hover);
}

/* 图标容器 - 跟交易列表的 tx-icon-box 风格一致 */
.ql-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 13px;
  background: var(--expense-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
  position: relative;
  margin-bottom: 8px;
}

.ql-name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes quicklog-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 深色模式 */
:root[data-theme="dark"] .ql-icon-wrap {
  background: rgba(201, 123, 123, 0.20);
}

@media (prefers-reduced-motion: reduce) {
  .quicklog-item {
    animation: none;
    transition: none;
  }
}
</style>
