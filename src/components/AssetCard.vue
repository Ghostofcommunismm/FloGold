<template>
  <button class="ac" :class="`ac-${statusKey}`" @click="$emit('click')">
    <!-- 左侧细金条 -->
    <span class="ac-rail" aria-hidden="true"></span>

    <!-- 顶部：图标 + 名称 -->
    <div class="ac-top">
      <span class="ac-ic" aria-hidden="true">{{ asset.icon || '📦' }}</span>
      <span class="ac-nm">{{ asset.name }}</span>
    </div>

    <!-- 分类 + 归属 + 位置 -->
    <div class="ac-cat">
      <span class="ac-dot" aria-hidden="true"></span>
      <span class="ac-cat-text">
        {{ asset.category }}<template v-if="asset.owner"> · {{ asset.owner }}</template><template v-if="asset.location"> · {{ asset.location }}</template>
      </span>
    </div>

    <!-- 现价 + 状态 -->
    <div class="ac-amount">
      <span class="ac-curr">¥ {{ formatMoney(currentValue) }}</span>
      <span class="ac-st">{{ statusText }}</span>
    </div>

    <!-- 双层进度条 -->
    <div class="ac-bar" :title="`保留率 ${retentionRate}%`">
      <div class="ac-bar-main">
        <div class="ac-bar-fill" :style="{ width: retentionRate + '%' }"></div>
      </div>
      <div class="ac-bar-shadow">
        <div class="ac-bar-shadow-fill" :style="{ width: retentionRate + '%' }"></div>
      </div>
    </div>

    <!-- 购入价 + 保留率 -->
    <div class="ac-meta">
      <span class="ac-orig">¥ {{ formatMoney(asset.purchasePrice) }}</span>
      <span class="ac-sep" aria-hidden="true">·</span>
      <span class="ac-ret">保留 {{ retentionRate }}%</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { calculateCurrentValue } from '../asset-utils'
import type { Asset } from '../types'

const props = defineProps<{ asset: Asset }>()
defineEmits<{ (e: 'click'): void }>()

// ============ 数据计算 ============
const currentValue = computed(() => calculateCurrentValue(props.asset))
const statusText = computed(() => props.asset.status ?? '在用')

const statusKey = computed(() => {
  const s = statusText.value
  if (s === '在用') return 'using'
  if (s === '闲置') return 'idle'
  return 'sold'
})

// 保留率 = 现值 / 购入价
const retentionRate = computed(() => {
  if (props.asset.purchasePrice <= 0) return 0
  const rate = (currentValue.value / props.asset.purchasePrice) * 100
  return Math.max(0, Math.min(100, Math.round(rate)))
})

function formatMoney(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(2) + '万'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}
</script>

<style scoped>
/* ========================================================================
   资产卡片 · 双层渐变进度
   设计要点：
   - 暖白底 + 左侧 2px 细金条（唯一装饰，重复 30+ 不抢戏）
   - 双层进度：2px 主条（金渐变 + 微光） + 1px 影子条
   - 4 级字号（10.5 / 11 / 13.5 / 15）+ tabular-nums 数字
   - 状态仅文字色变化（绿/橙/灰），无背景色块
   ======================================================================== */

.ac {
  position: relative;
  width: 100%;
  min-width: 0;
  background: #fefcf7;
  border: 1px solid rgba(120, 100, 70, 0.08);
  border-radius: 13px;
  padding: 13px 14px 12px 17px;
  text-align: left;
  font-family: var(--sans);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  display: flex;
  flex-direction: column;
  min-height: 134px;
  overflow: hidden;
  box-sizing: border-box;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.6) inset, 0 1px 2px rgba(120, 100, 70, 0.03);
  /* 错峰入场动画 —— 由父级传 --ac-delay 控制每张卡的延迟 */
  animation: ac-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: var(--ac-delay, 0ms);
}

/* 左侧细金条（顶部/底部各内缩 12px，不顶到边缘） */
.ac-rail {
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 2px;
  background: linear-gradient(180deg, transparent, #c4a36a 30%, #c4a36a 70%, transparent);
  pointer-events: none;
}

.ac:hover {
  border-color: rgba(196, 163, 106, 0.25);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.6) inset, 0 3px 10px rgba(120, 100, 70, 0.08);
}

.ac:active {
  transform: scale(0.98);
}

/* ===== 顶部行：图标 + 名称 ===== */
.ac-top {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 3px;
}

.ac-ic {
  font-size: 16px;
  flex-shrink: 0;
  line-height: 1;
}

.ac-nm {
  font-size: 13.5px;
  font-weight: 600;
  color: #2a2520;
  letter-spacing: -0.005em;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 分类行 ===== */
.ac-cat {
  display: flex;
  align-items: center;
  font-size: 10.5px;
  color: #9a8a68;
  font-weight: 500;
  margin-left: 23px;
  margin-bottom: 9px;
  letter-spacing: 0.02em;
}

.ac-dot {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #c4a36a;
  margin-right: 5px;
  flex-shrink: 0;
}

.ac-cat-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* ===== 现价 + 状态 ===== */
.ac-amount {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  margin-top: auto;
}

.ac-curr {
  font-size: 15px;
  font-weight: 700;
  color: #2a2520;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.015em;
  white-space: nowrap;
}

.ac-st {
  font-size: 9.5px;
  font-weight: 600;
  color: #6a9b7a;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.ac-idle .ac-st { color: #c49a6a; }
.ac-sold .ac-st { color: #9a9080; }

/* ===== 双层进度条 ===== */
.ac-bar {
  margin-top: 8px;
}

.ac-bar-main {
  position: relative;
  height: 2px;
  background: rgba(120, 100, 70, 0.1);
  border-radius: 1px;
  overflow: hidden;
}

.ac-bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #d4af37 0%, #c4a36a 40%, #8a6e3a 100%);
  border-radius: 1px;
  box-shadow: 0 0 6px rgba(196, 163, 106, 0.4);
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.ac-bar-shadow {
  position: relative;
  height: 1px;
  background: rgba(120, 100, 70, 0.06);
  margin-top: 2px;
  overflow: hidden;
}

.ac-bar-shadow-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: rgba(196, 163, 106, 0.25);
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: reduce) {
  .ac-bar-fill,
  .ac-bar-shadow-fill { transition: none !important; }
  .ac { animation: none !important; }
}

/* 错峰入场关键帧 */
@keyframes ac-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== 底部元信息行 ===== */
.ac-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  color: #8a7a60;
  margin-top: 5px;
  font-variant-numeric: tabular-nums;
}

.ac-orig {
  text-decoration: line-through;
  text-decoration-color: rgba(120, 100, 70, 0.3);
}

.ac-sep {
  color: #c4a36a;
  opacity: 0.6;
}

.ac-ret {
  color: #6a9b7a;
  font-weight: 600;
  margin-left: auto;
}

.ac-sold .ac-ret { color: #9a9080; }

/* ===== 深色模式 ===== */
:root[data-theme="dark"] .ac {
  background: #2d2925;
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.02) inset, 0 1px 2px rgba(0, 0, 0, 0.2);
}

:root[data-theme="dark"] .ac:hover {
  border-color: rgba(196, 163, 106, 0.2);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.02) inset, 0 3px 10px rgba(0, 0, 0, 0.3);
}

:root[data-theme="dark"] .ac-nm,
:root[data-theme="dark"] .ac-curr { color: #f4f0e6; }

:root[data-theme="dark"] .ac-cat { color: #b8a890; }
:root[data-theme="dark"] .ac-meta { color: #b8a890; }

:root[data-theme="dark"] .ac-bar-main { background: rgba(255, 255, 255, 0.08); }
:root[data-theme="dark"] .ac-bar-shadow { background: rgba(255, 255, 255, 0.04); }

/* ===== 极窄屏（< 360px）压缩 ===== */
@media (max-width: 360px) {
  .ac { padding: 11px 12px 10px 15px; min-height: 124px; }
  .ac-nm { font-size: 13px; }
  .ac-curr { font-size: 14px; }
  .ac-cat { font-size: 10px; margin-left: 21px; }
}
</style>
