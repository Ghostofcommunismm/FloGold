<template>
  <div class="fund-rank-page">
    <!-- Sticky Header -->
    <header class="fund-header" :class="{ scrolled }">
      <h1 class="fund-title">基金排行</h1>
      <button class="refresh-btn" @click="handleRefresh" :disabled="loading">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ rotating: loading }">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.495 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
      </button>
    </header>

    <!-- 交集提示区 -->
    <section v-if="fundData && fundData.intersection.length > 0" class="intersection-section" v-reveal>
      <div class="intersection-card">
        <div class="intersection-header">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span class="intersection-title">多榜同列</span>
          <span class="intersection-badge">{{ fundData.intersection.length }} 只</span>
        </div>
        <div class="intersection-list">
          <div
            v-for="fund in fundData.intersection"
            :key="fund.code"
            class="intersection-item"
            @click="$emit('view-detail', fund.code)"
          >
            <span class="fund-name">{{ fund.name }}</span>
            <span class="fund-code">{{ fund.code }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 基金类型滑块 -->
    <div class="fund-type-slider">
      <div class="slider-track">
        <div
          class="slider-thumb"
          :style="{ transform: `translateX(${fundTypeIndex * 100}%)` }"
        ></div>
        <div class="slider-options">
          <button
            class="slider-option"
            :class="{ active: fundType === 'gp' }"
            @click="fundType = 'gp'"
          >
            股票型
          </button>
          <button
            class="slider-option"
            :class="{ active: fundType === 'hh' }"
            @click="fundType = 'hh'"
          >
            混合型
          </button>
          <button
            class="slider-option"
            :class="{ active: fundType === 'zq' }"
            @click="fundType = 'zq'"
          >
            债券型
          </button>
        </div>
      </div>
    </div>

    <!-- 排行榜 Tab 切换 -->
    <div class="rank-tabs">
      <button
        class="rank-tab"
        :class="{ active: rankType === 'month' }"
        @click="rankType = 'month'"
      >
        月榜
      </button>
      <button
        class="rank-tab"
        :class="{ active: rankType === 'threeMonth' }"
        @click="rankType = 'threeMonth'"
      >
        3月榜
      </button>
      <button
        class="rank-tab"
        :class="{ active: rankType === 'halfYear' }"
        @click="rankType = 'halfYear'"
      >
        半年榜
      </button>
      <button
        class="rank-tab"
        :class="{ active: rankType === 'year' }"
        @click="rankType = 'year'"
      >
        年榜
      </button>
    </div>

    <!-- 基金列表 -->
    <div v-if="!loading && currentList.length > 0" class="fund-grid" v-reveal>
      <FundCard
        v-for="(fund, index) in currentList"
        :key="fund.code"
        :fund="fund"
        :rank="index + 1"
        :rank-type="rankType"
        :style="{ '--fr-delay': (index % 10) * 50 + 'ms' }"
        @click="$emit('view-detail', fund.code)"
      />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && currentList.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
      <p>暂无排行数据</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FundRankData, RankType } from '../types/fund'
import { fetchFundRankData } from '../api/fundApi'
import FundCard from './FundCard.vue'

const props = defineProps<{
  scrolled: boolean
}>()

const emit = defineEmits<{
  (e: 'view-detail', code: string): void
}>()

const fundData = ref<FundRankData | null>(null)
const loading = ref(false)
const rankType = ref<RankType>('month')
const fundType = ref<'gp' | 'hh' | 'zq'>('hh') // 默认混合型

// 计算滑块位置索引
const fundTypeIndex = computed(() => {
  if (fundType.value === 'gp') return 0
  if (fundType.value === 'hh') return 1
  return 2 // zq
})

// 当前排行榜
const currentList = computed(() => {
  if (!fundData.value) return []
  if (rankType.value === 'month') return fundData.value.monthTop5
  if (rankType.value === 'threeMonth') return fundData.value.threeMonthTop5
  if (rankType.value === 'halfYear') return fundData.value.halfYearTop5
  return fundData.value.yearTop5
})

// 监听基金类型变化，重新加载数据
watch(fundType, () => {
  handleRefresh()
})

// 加载数据
async function handleRefresh() {
  loading.value = true
  try {
    fundData.value = await fetchFundRankData(fundType.value)
  } catch (error) {
    console.error('加载基金排行失败:', error)
  } finally {
    loading.value = false
  }
}

// 初始加载
handleRefresh()
</script>

<style scoped>
.fund-rank-page {
  min-height: 100%;
  padding-bottom: 80px;
}

/* Header */
.fund-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--bg);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.fund-header.scrolled {
  background: rgba(254, 252, 247, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 1px 0 rgba(120, 100, 70, 0.08);
}

:root[data-theme="dark"] .fund-header.scrolled {
  background: rgba(45, 41, 37, 0.92);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06);
}

.fund-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
}

.refresh-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: var(--card);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.refresh-btn:hover {
  background: var(--hover);
}

.refresh-btn:active {
  transform: scale(0.92);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 交集提示区 */
.intersection-section {
  padding: 0 16px 12px;
}

.intersection-card {
  background: linear-gradient(135deg, rgba(212, 165, 116, 0.12), rgba(196, 163, 106, 0.08));
  border: 1px solid rgba(196, 163, 106, 0.25);
  border-radius: 12px;
  padding: 14px 16px;
}

:root[data-theme="dark"] .intersection-card {
  background: linear-gradient(135deg, rgba(196, 163, 106, 0.15), rgba(180, 150, 95, 0.08));
  border-color: rgba(196, 163, 106, 0.3);
}

.intersection-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  color: var(--accent-dark);
}

.intersection-title {
  font-size: 13px;
  font-weight: 600;
}

.intersection-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--accent);
  color: #fff;
}

.intersection-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.intersection-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

:root[data-theme="dark"] .intersection-item {
  background: rgba(255, 255, 255, 0.08);
}

.intersection-item:hover {
  background: rgba(255, 255, 255, 0.9);
}

.fund-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.fund-code {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: 'SF Mono', 'Monaco', monospace;
}

/* 排行榜 Tab */
.rank-tabs {
  display: flex;
  gap: 6px;
  padding: 0 16px 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}

.rank-tabs::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.rank-tab {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  border: none;
  border-radius: 20px;
  background: var(--card);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 基金类型滑块 */
.fund-type-slider {
  padding: 0 16px 12px;
}

.slider-track {
  position: relative;
  height: 44px;
  background: var(--card);
  border-radius: 12px;
  overflow: hidden;
}

.slider-thumb {
  position: absolute;
  top: 0;
  left: 0;
  width: 33.333%;
  height: 100%;
  background: var(--accent);
  border-radius: 12px;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 8px rgba(196, 163, 106, 0.3);
}

.slider-options {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  display: flex;
  pointer-events: none;
}

.slider-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  pointer-events: auto;
  transition: color 0.2s ease;
  z-index: 1;
}

.slider-option.active {
  color: #fff;
  font-weight: 600;
}

/* 基金网格 */
.fund-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  padding: 0 16px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  gap: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: rotate 0.8s linear infinite;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  gap: 12px;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}
</style>