<template>
  <div class="fund-card" :class="{ positive: returnRate >= 0, negative: returnRate < 0 }">
    <!-- 左侧金条 -->
    <div class="gold-bar"></div>
    
    <!-- 排名徽章 -->
    <div class="rank-badge" v-if="rank">{{ rank }}</div>
    
    <!-- 内容 -->
    <div class="card-content">
      <!-- 顶部：名称 -->
      <div class="card-top">
        <span class="fund-name">{{ fund.name }}</span>
        <span class="fund-type">{{ fund.type }}</span>
      </div>
      
      <!-- 中部：代码 + 规模 -->
      <div class="card-middle">
        <span class="fund-code">{{ fund.code }}</span>
        <span class="fund-scale">{{ fund.scale.toFixed(1) }}亿</span>
      </div>
      
      <!-- 底部：收益率 -->
      <div class="card-bottom">
        <div class="return-value">
          <span class="return-arrow">{{ returnRate >= 0 ? '↑' : '↓' }}</span>
          <span class="return-percent">{{ Math.abs(returnRate * 100).toFixed(2) }}%</span>
        </div>
        
        <!-- 进度条 -->
        <div class="return-bar">
          <div class="bar-fill" :style="{ width: barWidth + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FundRankItem } from '../types/fund'

const props = defineProps<{
  fund: FundRankItem
  rank?: number
  rankType?: 'month' | 'threeMonth' | 'halfYear' | 'year'
}>()

// 根据父组件的 rankType 决定显示哪个收益率
const returnRate = computed(() => {
  switch (props.rankType) {
    case 'month':
      return props.fund.monthReturn
    case 'threeMonth':
      return props.fund.threeMonthReturn
    case 'halfYear':
      return props.fund.halfYearReturn
    case 'year':
      return props.fund.yearReturn
    default:
      return props.fund.monthReturn
  }
})

// 进度条宽度（0-100%）
const barWidth = computed(() => {
  return Math.min(100, Math.abs(returnRate.value) * 100)
})
</script>

<style scoped>
.fund-card {
  position: relative;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 13px;
  padding: 14px 16px 12px;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
  
  /* 错峰入场动画 */
  animation: fr-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: var(--fr-delay, 0ms);
}

.fund-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(120, 100, 70, 0.12);
}

.fund-card:active {
  transform: scale(0.97);
}

/* 左侧金条 */
.gold-bar {
  position: absolute;
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 2px;
  background: linear-gradient(180deg, transparent, #c4a36a 30%, #c4a36a 70%, transparent);
  border-radius: 1px;
}

/* 排名徽章 */
.rank-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 顶部 */
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.fund-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.fund-type {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(120, 100, 70, 0.1);
  color: var(--text-secondary);
  white-space: nowrap;
}

/* 中部 */
.card-middle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.fund-code {
  font-family: 'SF Mono', 'Monaco', monospace;
}

.fund-scale::before {
  content: '·';
  margin-right: 8px;
}

/* 底部 */
.card-bottom {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.return-value {
  display: flex;
  align-items: center;
  gap: 4px;
}

.return-arrow {
  font-size: 14px;
}

.return-percent {
  font-size: 15px;
  font-weight: 700;
}

/* 正收益（涨） */
.fund-card.positive .return-arrow,
.fund-card.positive .return-percent {
  color: var(--income, #4f8869);
}

/* 负收益（跌） */
.fund-card.negative .return-arrow,
.fund-card.negative .return-percent {
  color: var(--expense, #e88b8b);
}

/* 进度条 */
.return-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fund-card.positive .bar-fill {
  background: linear-gradient(90deg, var(--income, #4f8869), #6aab84);
}

.fund-card.negative .bar-fill {
  background: linear-gradient(90deg, var(--expense, #e88b8b), #f5a5a5);
}

/* 深色模式 */
:root[data-theme="dark"] .fund-card {
  background: var(--card);
  border-color: var(--border);
}

:root[data-theme="dark"] .gold-bar {
  background: linear-gradient(180deg, transparent, #d4a86a 30%, #d4a86a 70%, transparent);
}

:root[data-theme="dark"] .fund-type {
  background: rgba(255, 255, 255, 0.08);
}

/* 入场动画 */
@keyframes fr-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>