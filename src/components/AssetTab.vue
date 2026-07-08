<template>
  <div class="asset-tab">
    <!-- 页面标题 -->
    <div class="page-header" :class="{ scrolled }">
      <h1>家庭资产</h1>
    </div>

    <!-- 总览卡 -->
    <AssetSummaryCard :assets="assets" :card-style="cardStyle" />

    <!-- 分类 pills + 排序 -->
    <div class="filter-row">
      <div class="category-scroll">
        <button
          v-for="cat in categoryOptions"
          :key="cat.name"
          type="button"
          class="pill"
          :class="{ active: filterCategory === cat.name }"
          @click="filterCategory = cat.name"
        >
          {{ cat.name }}<span class="count">({{ cat.count }})</span>
        </button>
      </div>
      <div class="seg-control">
        <button type="button" :class="{ active: sortBy === 'value' }" @click="sortBy = 'value'">价值</button>
        <button type="button" :class="{ active: sortBy === 'date' }" @click="sortBy = 'date'">日期</button>
        <button type="button" :class="{ active: sortBy === 'location' }" @click="sortBy = 'location'">位置</button>
      </div>
    </div>

    <!-- 资产列表（2 列网格） -->
    <div v-if="filteredAssets.length > 0" class="asset-list">
      <AssetCard
        v-for="(asset, index) in filteredAssets"
        :key="asset.id"
        :asset="asset"
        :style="{ '--ac-delay': (index % 10) * 50 + 'ms' }"
        @click="openDetail(asset)"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <svg viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
      <p>{{ assets.length === 0 ? '还没有资产记录' : '该分类下暂无资产' }}</p>
      <button v-if="assets.length === 0" class="empty-add-btn" @click="openAddModal">添加第一件资产</button>
    </div>

    <!-- 新增/编辑 Modal -->
    <AssetModal
      :show="showAssetModal"
      :asset="editingAsset"
      :asset-categories="assetCategories"
      @close="showAssetModal = false"
      @save="handleSave"
    />

    <!-- 详情 Modal -->
    <AssetDetailModal
      :show="showDetailModal"
      :asset="detailAsset"
      @close="showDetailModal = false"
      @edit="() => detailAsset && openEditModal(detailAsset)"
      @delete="handleDelete"
      @view-transaction="handleViewTransaction"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AssetSummaryCard from './AssetSummaryCard.vue'
import AssetCard from './AssetCard.vue'
import AssetModal from './AssetModal.vue'
import AssetDetailModal from './AssetDetailModal.vue'
import { calculateCurrentValue } from '../asset-utils'
import type { Asset, AssetCardStyle, Category, Transaction } from '../types'

const props = withDefaults(
  defineProps<{
    assets: Asset[]
    assetCategories: Category[]
    transactions: Transaction[]
    cardStyle?: AssetCardStyle
    scrolled?: boolean
  }>(),
  { cardStyle: 'flowingGold', scrolled: false },
)

const emit = defineEmits<{
  (e: 'save-asset', asset: Asset): void
  (e: 'delete-asset', id: number): void
  (e: 'view-transaction', id: number): void
}>()

const filterCategory = ref('全部')
const sortBy = ref<'value' | 'date' | 'location'>('value')

const showAssetModal = ref(false)
const editingAsset = ref<Asset | null>(null)
const showDetailModal = ref(false)
const detailAsset = ref<Asset | null>(null)

// 分类选项（含「全部」+ 计数）
const categoryOptions = computed(() => {
  const counts: Record<string, number> = { '全部': props.assets.length }
  for (const a of props.assets) {
    counts[a.category] = (counts[a.category] ?? 0) + 1
  }
  const names = ['全部', ...props.assetCategories.map(c => c.name)]
  return names.map(name => ({ name, count: counts[name] ?? 0 }))
})

const filteredAssets = computed(() => {
  let list = props.assets
  if (filterCategory.value !== '全部') {
    list = list.filter(a => a.category === filterCategory.value)
  }
  const sorted = [...list]
  if (sortBy.value === 'value') {
    sorted.sort((a, b) => calculateCurrentValue(b) - calculateCurrentValue(a))
  } else if (sortBy.value === 'date') {
    sorted.sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))
  } else if (sortBy.value === 'location') {
    sorted.sort((a, b) => (a.location ?? '').localeCompare(b.location ?? ''))
  }
  return sorted
})

function openAddModal() {
  editingAsset.value = null
  showAssetModal.value = true
}

defineExpose({ openAddModal })

function openEditModal(asset: Asset) {
  editingAsset.value = asset
  showAssetModal.value = true
  showDetailModal.value = false
}

function openDetail(asset: Asset) {
  detailAsset.value = asset
  showDetailModal.value = true
}

function handleSave(asset: Asset) {
  emit('save-asset', asset)
  showAssetModal.value = false
}

function handleDelete() {
  if (detailAsset.value) {
    emit('delete-asset', detailAsset.value.id)
    showDetailModal.value = false
    detailAsset.value = null
  }
}

function handleViewTransaction(id: number) {
  showDetailModal.value = false
  emit('view-transaction', id)
}
</script>

<style scoped>
.asset-tab {
  padding: 0 0px 120px;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  /* 注意：不要在这里加 overflow:hidden/scroll/auto，
     否则 .page-header 的 position:sticky 会被截胡在这里，
     永远粘不到 page-shell 的滚动容器上。
     横向溢出由内部元素自己处理（.category-scroll / .lg-card / .ac 都自带 overflow:hidden） */
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  /* 负边际让毛玻璃铺满 #app 整行（#app 左右各 20px padding） */
  margin: 0 -20px 20px;
  padding: 4px 20px 0px;
  padding-top: calc(env(safe-area-inset-top, 0px) + 12px);
  /* 提升到独立合成层,跨过 motion.section 给 page-shell 加的 will-change 合成层边界,
     否则 sticky 会被父合成层截胡、永远粘在初始位置 */
  transform: translate3d(0, 0, 0);
  -webkit-transform: translate3d(0, 0, 0);
  /* Apple风格渐变模糊：顶部模糊强度最大，向下递减 */
  background: transparent;
  border-bottom: 1px solid transparent;
  transition: background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  isolation: isolate;
}
.page-header::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: -1;
  /* 初始状态：有 backdrop-filter 但背景色极淡，模糊效果几乎不可见 */
  background: rgba(249, 249, 249, 0.01);
  -webkit-backdrop-filter: saturate(180%) blur(24px);
  backdrop-filter: saturate(180%) blur(24px);
  box-shadow: none;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

/* 底部渐变过渡层 + 模糊效果 */
.page-header::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  height: 20px;
  margin-top: -1px;
  z-index: -1;
  /* 初始状态：极淡渐变背景 + 模糊效果 */
  background: linear-gradient(to bottom, rgba(249, 249, 249, 0.01), rgba(249, 249, 249, 0));
  -webkit-backdrop-filter: saturate(180%) blur(24px);
  backdrop-filter: saturate(180%) blur(24px);
  pointer-events: none;
  transition: background 0.3s ease;
}

/* 滚动后：显示模糊效果 */
.page-header.scrolled::before {
  background: rgba(249, 249, 249, 0.88);
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.04);
}

.page-header.scrolled::after {
  /* 从顶栏背景色渐变到透明 */
  background: linear-gradient(to bottom, rgba(249, 249, 249, 0.88), rgba(249, 249, 249, 0));
}

.page-header h1 {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 滚动后：增加下边框分隔线 */
.page-header.scrolled {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

/* 深色模式资产页顶栏 - 初始状态背景色极淡 */
:root[data-theme="dark"] .page-header::before {
  background: rgba(45, 41, 37, 0.01);
  -webkit-backdrop-filter: saturate(180%) blur(26px);
  backdrop-filter: saturate(180%) blur(26px);
}

:root[data-theme="dark"] .page-header::after {
  background: linear-gradient(to bottom, rgba(45, 41, 37, 0.01), rgba(45, 41, 37, 0));
  -webkit-backdrop-filter: saturate(180%) blur(26px);
  backdrop-filter: saturate(180%) blur(26px);
}

:root[data-theme="dark"] .page-header.scrolled::before {
  background: rgba(45, 41, 37, 0.85);
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.15);
}

:root[data-theme="dark"] .page-header.scrolled::after {
  background: linear-gradient(to bottom, rgba(45, 41, 37, 0.85), rgba(45, 41, 37, 0));
}

:root[data-theme="dark"] .page-header.scrolled {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.filter-row {
  padding: 12px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.category-scroll {
  flex: 1;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.pill {
  flex-shrink: 0;
  height: 30px;
  padding: 0 12px;
  border-radius: 99px;
  border: 1px solid rgba(174, 168, 155, 0.25);
  background: var(--bg-card, #fff);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  font-family: var(--sans);
}

.pill:active {
  transform: scale(0.95);
}

.pill.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  font-weight: 600;
}

.pill .count {
  font-size: 10px;
  opacity: 0.7;
}

.seg-control {
  flex-shrink: 0;
  display: flex;
  background: rgba(174, 168, 155, 0.15);
  border-radius: 99px;
  padding: 3px;
  gap: 2px;
}

.seg-control button {
  border: none;
  background: transparent;
  padding: 5px 10px;
  border-radius: 99px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--sans);
  transition: all 0.2s;
  white-space: nowrap;
}

.seg-control button.active {
  background: var(--bg-card, #fff);
  color: var(--accent);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.asset-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  min-width: 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted, #999);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-state svg {
  width: 48px;
  height: 48px;
  fill: var(--text-muted, #999);
  opacity: 0.4;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}

.empty-add-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: var(--sans);
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.4);
  transition: transform 0.2s;
}

.empty-add-btn:hover {
  transform: translateY(-1px);
}
</style>
