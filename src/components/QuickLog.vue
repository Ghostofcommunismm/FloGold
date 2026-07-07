<template>
  <section class="quicklog-section" v-reveal>
    <div class="section-header">
      <h2 class="section-title">快捷记账</h2>
      <span class="quicklog-subtitle">近 {{ days }} 天常用</span>
    </div>

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
        <div class="ql-icon-wrap ql-with-ring">
          <CategoryIcon :name="item.category" />
          <svg class="ql-ring" viewBox="0 0 48 48" aria-hidden="true">
            <circle class="ql-ring-track" cx="24" cy="24" r="22" />
            <circle
              class="ql-ring-fill"
              cx="24" cy="24" r="22"
              :stroke-dasharray="ringCircumference"
              :stroke-dashoffset="ringOffset(item.count)"
            />
          </svg>
          <span class="ql-ring-num">{{ item.count }}</span>
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
import CategoryIcon from './CategoryIcon.vue'

interface QuickSub {
  key: string
  category: string
  subCategory: string
  count: number
  amount: number
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
    .map((v) => ({ key: `${v.category}::${v.subCategory}`, ...v }))
})

const ringCircumference = 2 * Math.PI * 22 // r=22
const maxCount = computed(() => topSubs.value[0]?.count || 1)

function ringOffset(count: number) {
  const ratio = Math.min(1, count / maxCount.value)
  return ringCircumference * (1 - ratio)
}

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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}
.section-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.quicklog-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-card);
  padding: 4px 10px;
  border-radius: 10px;
  box-shadow: var(--shadow-inset);
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

.ql-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--accent-light);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-inset);
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

/* ============ 迷你进度环 ============ */
.ql-with-ring {
  position: relative;
}
.ql-ring {
  position: absolute;
  inset: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  transform: rotate(-90deg);
  pointer-events: none;
}
.ql-ring-track {
  fill: none;
  stroke: rgba(212, 165, 116, 0.18);
  stroke-width: 3;
}
.ql-ring-fill {
  fill: none;
  stroke: var(--accent);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}
.ql-ring-num {
  position: absolute;
  bottom: -5px;
  right: -7px;
  background: var(--accent);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(212, 165, 116, 0.4);
  border: 2px solid var(--bg-primary);
  line-height: 1;
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

@media (prefers-reduced-motion: reduce) {
  .quicklog-item {
    animation: none;
    transition: none;
  }
  .ql-ring-fill {
    transition: none;
  }
}
</style>