<template>
  <section class="lg-card" :class="[`lg-v-${cardStyle}`, { 'lg-empty': itemCount === 0 }]">
    <!-- 背景流光（仅流动金风格显示） -->
    <template v-if="cardStyle === 'flowingGold'">
      <div class="lg-aurora lg-aurora-1" aria-hidden="true"></div>
      <div class="lg-aurora lg-aurora-2" aria-hidden="true"></div>
      <div class="lg-aurora lg-aurora-3" aria-hidden="true"></div>
    </template>

    <!-- 顶部：标签 + LIVE 指示 -->
    <header class="lg-head">
      <div class="lg-label">
        <span class="lg-label-bar"></span>
        <span>资产总值</span>
        <span class="lg-label-en">NET WORTH</span>
      </div>
      <div v-if="cardStyle === 'flowingGold' && itemCount > 0" class="lg-live">
        <span class="lg-live-dot"></span>
        <span class="lg-live-text">LIVE</span>
      </div>
    </header>

    <!-- v3 哑光金属:右上角足金标签 (设计稿 .purity) -->
    <div v-if="cardStyle === 'brushedMetal' && itemCount > 0" class="lg-purity">
      <strong>9999</strong>FINE GOLD
    </div>

    <!-- v2 烫金浮雕:副标 (设计稿 .sub) -->
    <div v-if="cardStyle === 'embossedGold'" class="lg-sub">— hereby acknowledged —</div>

    <!-- 主数字 -->
    <div class="lg-amount" :class="{ 'lg-amount-empty': itemCount === 0 }">
      <span class="lg-currency">¥</span>
      <span v-if="itemCount > 0" class="lg-num">{{ formattedTotal }}</span>
      <span v-else class="lg-num lg-num-placeholder">--</span>
    </div>

    <!-- 趋势行 -->
    <div v-if="itemCount > 0" class="lg-meta">
      <span>持有 {{ itemCount }} 件</span>
      <span class="lg-meta-sep">·</span>
      <span class="lg-meta-trend" :class="trendClass">
        <span class="lg-meta-arrow" aria-hidden="true">{{ trendArrow }}</span>
        <span>{{ trendText }}</span>
      </span>
      <!-- v5 流动金:右侧时间戳 (设计稿 .updated) -->
      <span v-if="cardStyle === 'flowingGold'" class="lg-meta-updated">UPDATED {{ currentTime }}</span>
    </div>

    <!-- v2 烫金浮雕:票据底部 (设计稿 .serial, 印章用绝对定位脱离文档流) -->
    <div v-if="cardStyle === 'embossedGold' && itemCount > 0" class="lg-cert-footer">
      <div class="lg-serial">No. {{ certSerial }} · {{ certYear }}</div>
    </div>
    <!-- v2 印章:绝对定位到卡片右下,不动高度 -->
    <div v-if="cardStyle === 'embossedGold' && itemCount > 0" class="lg-stamp" aria-hidden="true">BANK<br>SEAL</div>

    <!-- v2 双层边框内层(配合 ::after 外层) -->
    <div v-if="cardStyle === 'embossedGold'" class="lg-cert-inner-border" aria-hidden="true"></div>

    <!-- 底部：3 列子数据 -->
    <footer class="lg-stats">
      <div class="lg-stat">
        <div class="lg-stat-label">购入总价</div>
        <div class="lg-stat-value">¥{{ formatStat(totalPurchase) }}</div>
      </div>
      <div class="lg-stat-sep" aria-hidden="true"></div>
      <div class="lg-stat">
        <div class="lg-stat-label">累计折旧</div>
        <div class="lg-stat-value lg-stat-value-loss">
          -¥{{ formatStat(totalDepreciation) }}
        </div>
      </div>
      <div class="lg-stat-sep" aria-hidden="true"></div>
      <div class="lg-stat">
        <div class="lg-stat-label">保值率</div>
        <div class="lg-stat-value lg-stat-value-accent">
          {{ retentionRate }}%
        </div>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCountUp } from '../useAnimations'
import { calculateCurrentValue } from '../asset-utils'
import type { Asset, AssetCardStyle } from '../types'

const props = withDefaults(
  defineProps<{ assets: Asset[]; cardStyle?: AssetCardStyle }>(),
  { cardStyle: 'flowingGold' },
)

// ============ 总额计算 ============
const totalPurchase = computed(() =>
  props.assets.reduce((s, a) => s + a.purchasePrice, 0),
)

const totalCurrent = computed(() =>
  props.assets.reduce((s, a) => s + calculateCurrentValue(a), 0),
)

const totalDepreciation = computed(() =>
  Math.max(0, totalPurchase.value - totalCurrent.value),
)

const itemCount = computed(() => props.assets.length)

const retentionRate = computed(() => {
  if (totalPurchase.value <= 0) return 100
  return Math.max(0, Math.round((totalCurrent.value / totalPurchase.value) * 100))
})

// ============ 主数字滚动动画 ============
// useCountUp 自动跟随 source 变化平滑过渡（已有 hook，无需手写）
const totalCurrentRef = computed(() => totalCurrent.value)
const { display: animatedTotal } = useCountUp(totalCurrentRef, {
  duration: 1100,
  decimals: 2,
  immediate: true,
  from: 0,
})

const formattedTotal = computed(() =>
  animatedTotal.value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
)

// ============ 趋势（当前 vs 购入） ============
const trend = computed(() => {
  if (totalPurchase.value <= 0 || itemCount.value === 0) {
    return { text: '—', cls: 'flat', arrow: '·' }
  }
  const diff = totalCurrent.value - totalPurchase.value
  if (Math.abs(diff) < 0.01) {
    return { text: '持平', cls: 'flat', arrow: '·' }
  }
  const pct = (diff / totalPurchase.value) * 100
  const sign = pct > 0 ? '+' : ''
  return {
    text: `${sign}${pct.toFixed(2)}%`,
    cls: pct > 0 ? 'up' : 'down',
    arrow: pct > 0 ? '▲' : '▼',
  }
})

const trendText = computed(() => trend.value.text)
const trendClass = computed(() => trend.value.cls)
const trendArrow = computed(() => trend.value.arrow)

// ============ 设计稿装饰元素(v2/v3/v5 还原用) ============
// v5 流动金 UPDATED 时间戳 (HH:mm)
const currentTime = computed(() => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})
// v2 烫金浮雕 票据序列号 (000xxx 格式)
const certSerial = computed(() => String(itemCount.value).padStart(6, '0'))
const certYear = computed(() => new Date().getFullYear())

// ============ 子数据格式化 ============
function formatStat(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(2) + '万'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}
</script>

<style scoped>
/* ========================================================================
   Liquid Gold · 资产总值卡片
   设计要点：
   - 深紫黑渐变底 + 极光光晕 → 重量感、神秘感
   - 真金渐变数字 + 横向流光 → 金钱、价值、流动
   - LIVE 跳动点 → 现代金融、实时性
   ======================================================================== */

.lg-card {
  position: relative;
  background:
    radial-gradient(ellipse 80% 60% at 80% 15%, #2a2540 0%, transparent 60%),
    radial-gradient(ellipse 100% 80% at 20% 100%, #1a1530 0%, transparent 70%),
    linear-gradient(135deg, #14101f 0%, #0a0712 50%, #050308 100%);
  border-radius: 22px;
  padding: 22px 22px 18px;
  margin-bottom: 18px;
  overflow: hidden;
  color: #f4f0e6;
  box-shadow:
    0 20px 50px -16px rgba(10, 7, 18, 0.55),
    0 4px 14px rgba(10, 7, 18, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.04);
  /* 强制 GPU 合成，避免动画时整卡重绘 */
  transform: translate3d(0, 0, 0);
  -webkit-transform: translate3d(0, 0, 0);
  /* 流动金默认字体:Outfit */
  font-family: 'Outfit', system-ui, sans-serif;
}

/* 极光 div 自身加 overflow:hidden 防止溢出 lg-card 边界,
   但极光是 radial-gradient 软边,实际上即使溢出也看不出硬切,
   加这一层只是保险 */
.lg-aurora {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform, opacity;
  /* 不再使用 filter / mix-blend-mode */
  /* 关键:极光可能比 lg-card 大,溢出卡片无大碍(radial-gradient 软边),
     不用 overflow:hidden 也行,这里保留以防万一 */
}

/* ===== Aurora 极光（多段渐变模拟柔光 · 适配 Android WebView） =====
   关键：去掉 filter:blur() + mix-blend-mode · 用 6 段 radial-gradient 模拟
   原因：filter:blur 强制 CPU 光栅化，mix-blend-mode 强制重合成，
        两者在 Android Chromium WebView 上会让动画掉到 20fps 以下 */
.lg-aurora {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform, opacity;
  /* 不再使用 filter / mix-blend-mode */
}
.lg-aurora-1 {
  width: 360px;
  height: 360px;
  top: -120px;
  right: -110px;
  background: radial-gradient(circle,
    rgba(255, 210, 110, 0.55) 0%,
    rgba(255, 210, 110, 0.38) 10%,
    rgba(212, 175, 55, 0.22) 22%,
    rgba(212, 175, 55, 0.12) 35%,
    rgba(212, 175, 55, 0.05) 50%,
    transparent 70%);
  animation: lg-breathe 6s ease-in-out infinite;
}
.lg-aurora-2 {
  width: 340px;
  height: 340px;
  bottom: -140px;
  left: -110px;
  background: radial-gradient(circle,
    rgba(170, 120, 230, 0.40) 0%,
    rgba(170, 120, 230, 0.25) 12%,
    rgba(120, 90, 200, 0.15) 26%,
    rgba(120, 90, 200, 0.08) 40%,
    rgba(120, 90, 200, 0.03) 55%,
    transparent 70%);
  animation: lg-breathe 8s ease-in-out infinite;
  animation-delay: -2.5s;
}
.lg-aurora-3 {
  width: 240px;
  height: 240px;
  top: 18%;
  right: 8%;
  background: radial-gradient(circle,
    rgba(255, 225, 150, 0.40) 0%,
    rgba(255, 225, 150, 0.25) 14%,
    rgba(255, 200, 90, 0.12) 30%,
    rgba(255, 200, 90, 0.05) 48%,
    transparent 65%);
  animation: lg-breathe 5s ease-in-out infinite;
  animation-delay: -1.2s;
}
@keyframes lg-breathe {
  0%, 100% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.65;
  }
  50% {
    transform: translate3d(40px, -32px, 0) scale(1.32);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lg-aurora { animation: none !important; opacity: 0.75; }
}

/* ===== 顶部标签 + LIVE ===== */
.lg-head {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.lg-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.3em;
  color: rgba(244, 240, 230, 0.55);
  text-transform: uppercase;
  font-family: 'Outfit', system-ui, sans-serif;
}
.lg-label-bar {
  width: 14px;
  height: 1px;
  background: linear-gradient(90deg, rgba(212, 175, 55, 0.7), transparent);
}
.lg-label-en {
  font-family: 'SF Mono', 'JetBrains Mono', Menlo, monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: rgba(212, 175, 55, 0.5);
  font-weight: 500;
}

.lg-live {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'SF Mono', 'JetBrains Mono', Menlo, monospace;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: #4ade80;
  padding: 3px 7px;
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.22);
  border-radius: 99px;
}
.lg-live-dot {
  width: 5px;
  height: 5px;
  background: #4ade80;
  border-radius: 50%;
  box-shadow: 0 0 6px #4ade80;
  animation: lg-pulse 1.6s ease-in-out infinite;
}
@keyframes lg-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}

/* ===== 主数字（真金流光） ===== */
.lg-amount {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: 14px;
  font-family: var(--sans);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.025em;
}
.lg-amount-empty { opacity: 0.5; }

.lg-currency {
  font-size: clamp(20px, 5.5vw, 24px);
  font-weight: 500;
  color: #c9a85a;
  margin-right: 4px;
  align-self: flex-start;
  margin-top: 6px;
}

.lg-num {
  font-size: clamp(34px, 9.5vw, 46px);
  font-weight: 600;
  font-family: 'Outfit', system-ui, sans-serif;
  /* 流动金流光：v5 设计稿配色 —— 亮金 + 白色高光 + 暗金,横向扫过 */
  background: linear-gradient(
    100deg,
    #b48a3e 0%,
    #f4d577 22%,
    #fff8dc 38%,
    #ffffff 50%,
    #fff8dc 62%,
    #f4d577 78%,
    #b48a3e 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: lg-flow 4s linear infinite;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  text-shadow:
    0 0 24px rgba(255, 210, 110, 0.5),
    0 0 50px rgba(212, 175, 55, 0.22);
  /* 强制 GPU 层（Android WebView 友好） */
  transform: translate3d(0, 0, 0);
  will-change: background-position;
  -webkit-transform: translate3d(0, 0, 0);
}
.lg-num-placeholder {
  font-weight: 300;
  font-size: clamp(28px, 8vw, 40px);
  background: rgba(244, 240, 230, 0.3);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: none;
}

@keyframes lg-flow {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== 趋势行 ===== */
.lg-meta {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(244, 240, 230, 0.5);
  letter-spacing: 0.05em;
  margin-bottom: 18px;
}
.lg-meta-sep { opacity: 0.4; }
.lg-meta-trend {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
  font-family: 'SF Mono', 'JetBrains Mono', Menlo, monospace;
}
.lg-meta-trend.up { color: #4ade80; }
.lg-meta-trend.down { color: #f87171; }
.lg-meta-trend.flat { color: rgba(244, 240, 230, 0.5); }
.lg-meta-arrow {
  font-size: 8px;
  line-height: 1;
}
/* v5 流动金:右侧时间戳 (设计稿 .updated) */
.lg-meta-updated {
  margin-left: auto;
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
  font-size: 10px;
  color: rgba(244, 240, 230, 0.4);
  letter-spacing: 0.15em;
  font-weight: 500;
}

/* ===== 底部 3 列子数据 ===== */
.lg-stats {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: stretch;
  padding-top: 14px;
  border-top: 1px solid rgba(244, 240, 230, 0.08);
}
.lg-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.lg-stat-label {
  font-size: 10px;
  font-weight: 500;
  color: rgba(244, 240, 230, 0.42);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.lg-stat-value {
  font-size: 13px;
  font-weight: 600;
  color: rgba(244, 240, 230, 0.92);
  font-variant-numeric: tabular-nums;
  font-family: var(--sans);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lg-stat-value-loss {
  color: #f87171;
}
.lg-stat-value-accent {
  background: linear-gradient(90deg, #c9a85a 0%, #f4d577 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
.lg-stat-sep {
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(244, 240, 230, 0.14),
    transparent
  );
  margin: 0 6px;
}

/* ===== 极窄屏（< 360px）缩小字号 ===== */
@media (max-width: 360px) {
  .lg-card { padding: 18px 16px 14px; }
  .lg-stat-value { font-size: 12px; }
  .lg-label { font-size: 10px; letter-spacing: 0.14em; }
  .lg-label-en { display: none; }
  .lg-meta { font-size: 10px; }
}

/* ========================================================================
   变体 B：烫金浮雕 (Embossed Gold Leaf · 设计稿 v2)
   暖米黄底 + 暖纸纹 + 烫金浮雕数字 + 双层票据边框 + 银行印章
   字体:Cinzel(标签/印章) + Cormorant Garamond(数字/副标) + JetBrains Mono(序列号)
   ======================================================================== */
.lg-card.lg-v-embossedGold {
  background:
    radial-gradient(ellipse at top left, #fbf7ec 0%, #f0e9d6 70%, #e6dcc2 100%);
  color: #5a4a2a;
  border: 1px solid rgba(180, 140, 60, 0.2);
  box-shadow:
    0 2px 4px rgba(120, 90, 30, 0.04),
    0 24px 48px -12px rgba(120, 90, 30, 0.18),
    inset 0 0 0 1px rgba(180, 140, 60, 0.2);
  font-family: 'Cormorant Garamond', 'Times New Roman', serif;
}
.lg-card.lg-v-embossedGold::before {
  /* paper texture */
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='2'/><feColorMatrix values='0 0 0 0 0.55  0 0 0 0 0.42  0 0 0 0 0.2  0 0 0 0.05 0'/></filter><rect width='300' height='300' filter='url(%23p)'/></svg>");
  pointer-events: none;
  mix-blend-mode: multiply;
}
.lg-card.lg-v-embossedGold::after {
  /* outer certificate border (设计稿 v2 .border-outer) */
  content: "";
  position: absolute;
  inset: 12px;
  border: 1px solid #b48a3e;
  border-radius: 12px;
  pointer-events: none;
  z-index: 1;
}
/* inner certificate border (设计稿 v2 .border-inner) */
.lg-cert-inner-border {
  position: absolute;
  inset: 16px;
  border: 1px solid rgba(180, 138, 62, 0.5);
  border-radius: 9px;
  pointer-events: none;
  z-index: 1;
}
/* v2 副标 (设计稿 .sub) */
.lg-card.lg-v-embossedGold .lg-sub {
  position: relative;
  z-index: 2;
  font-family: 'Cormorant Garamond', 'Times New Roman', serif;
  font-style: italic;
  font-size: 14px;
  color: #8a7a55;
  margin: -8px 0 4px 0;
  letter-spacing: 0.01em;
}
/* v2 票据底部 (设计稿 .serial, 印章绝对定位) */
.lg-cert-footer {
  position: relative;
  z-index: 2;
  margin-bottom: 14px;
}
.lg-card.lg-v-embossedGold .lg-serial {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #8a6a2c;
  letter-spacing: 0.18em;
}
.lg-card.lg-v-embossedGold .lg-stamp {
  /* 绝对定位 */
  position: absolute;
  right: 30px;
  top: 150px;
  width: 48px;
  height: 48px;
  border: 2px solid #b04848;
  color: #b04848;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', 'Times New Roman', serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-align: center;
  line-height: 1.3;
  transform: rotate(-12deg);
  opacity: 0.75;
  z-index: 3;
  pointer-events: none;
}
.lg-card.lg-v-embossedGold .lg-num {
  background: linear-gradient(180deg, #b48a3e 0%, #8a5f1c 50%, #6b4514 100%);
  background-size: 100% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow:
    0 1px 0 rgba(255, 240, 200, 0.6),
    0 2px 2px rgba(120, 80, 20, 0.15);
  animation: none !important;
  will-change: auto;
  font-family: 'Cormorant Garamond', 'Times New Roman', serif;
  font-weight: 600;
  line-height: 60px;
}
.lg-card.lg-v-embossedGold .lg-currency {
  color: #8a5f1c;
  -webkit-text-fill-color: #8a5f1c;
  font-family: 'Cormorant Garamond', 'Times New Roman', serif;
  font-weight: 500;
  line-height: 54px;
}
.lg-card.lg-v-embossedGold .lg-label {
  color: rgba(90, 70, 30, 0.65);
  font-family: 'Cinzel', 'Times New Roman', serif;
  font-weight: 600;
  letter-spacing: 0.42em;
}
.lg-card.lg-v-embossedGold .lg-label-en {
  color: rgba(180, 138, 62, 0.7);
  font-family: 'JetBrains Mono', monospace;
}
.lg-card.lg-v-embossedGold .lg-label-bar {
  background: linear-gradient(90deg, rgba(180, 138, 62, 0.7), transparent);
}
.lg-card.lg-v-embossedGold .lg-live {
  background: rgba(180, 138, 62, 0.12);
  border-color: rgba(180, 138, 62, 0.35);
  font-family: 'Cinzel', 'Times New Roman', serif;
}
.lg-card.lg-v-embossedGold .lg-meta {
  color: rgba(90, 70, 30, 0.6);
  font-family: 'JetBrains Mono', monospace;
}
.lg-card.lg-v-embossedGold .lg-meta-trend.up { color: #2f6e3a; }
.lg-card.lg-v-embossedGold .lg-meta-trend.down { color: #b04848; }
.lg-card.lg-v-embossedGold .lg-meta-trend.flat { color: rgba(90, 70, 30, 0.5); }
.lg-card.lg-v-embossedGold .lg-stats {
  border-top-color: rgba(180, 138, 62, 0.22);
}
.lg-card.lg-v-embossedGold .lg-stat-label {
  color: rgba(90, 70, 30, 0.55);
}
.lg-card.lg-v-embossedGold .lg-stat-value {
  color: rgba(50, 40, 20, 0.95);
}
.lg-card.lg-v-embossedGold .lg-stat-value-loss { color: #b04848; }
.lg-card.lg-v-embossedGold .lg-stat-value-accent {
  background: linear-gradient(90deg, #b48a3e 0%, #6b4514 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
.lg-card.lg-v-embossedGold .lg-stat-sep {
  background: linear-gradient(180deg, transparent, rgba(180, 138, 62, 0.25), transparent);
}

/* ========================================================================
   变体 C：哑光金属 (Brushed Ingot · 设计稿 v3)
   拉丝钢面 + 顶部高光 + 超细字重白数字 + 金色点缀
   字体:Outfit(标签/数字,超细 200) + JetBrains Mono(底部数据) + Cinzel(足金标签)
   ======================================================================== */
.lg-card.lg-v-brushedMetal {
  background:
    linear-gradient(135deg, #4a4a52 0%, #6a6a72 25%, #8a8a92 50%, #6a6a72 75%, #3a3a42 100%);
  color: #f4f0e6;
  box-shadow:
    0 24px 48px -16px rgba(0, 0, 0, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.3);
  font-family: 'Outfit', system-ui, sans-serif;
}
.lg-card.lg-v-brushedMetal::before {
  /* brushed metal lines */
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: repeating-linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.025) 0px,
    rgba(0, 0, 0, 0.04) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
}
.lg-card.lg-v-brushedMetal::after {
  /* top highlight */
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 50%;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 100%);
  pointer-events: none;
}
.lg-card.lg-v-brushedMetal .lg-num {
  background: none;
  -webkit-text-fill-color: #fff;
  color: #fff;
  font-weight: 200;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: none !important;
  will-change: auto;
  font-family: 'Outfit', system-ui, sans-serif;
  letter-spacing: -0.025em;
}
.lg-card.lg-v-brushedMetal .lg-currency {
  color: #c9a85a;
  -webkit-text-fill-color: #c9a85a;
  font-weight: 300;
  font-family: 'Outfit', system-ui, sans-serif;
}
.lg-card.lg-v-brushedMetal .lg-label {
  color: rgba(244, 240, 230, 0.6);
  font-family: 'Outfit', system-ui, sans-serif;
  font-weight: 500;
  letter-spacing: 0.4em;
}
.lg-card.lg-v-brushedMetal .lg-label-en {
  color: rgba(201, 168, 90, 0.7);
  font-family: 'JetBrains Mono', monospace;
}
.lg-card.lg-v-brushedMetal .lg-label-bar {
  /* 设计稿 v3: 6px 金色发光圆点(替换渐变细线) */
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c9a85a;
  box-shadow: 0 0 8px #c9a85a;
}
/* v3 足金标签 (设计稿 .purity) */
.lg-card.lg-v-brushedMetal .lg-purity {
  position: absolute;
  right: 22px;
  top: 22px;
  z-index: 3;
  font-family: 'Cinzel', 'Times New Roman', serif;
  font-size: 10px;
  color: #c9a85a;
  letter-spacing: 0.3em;
  text-align: right;
  line-height: 1.6;
}
.lg-card.lg-v-brushedMetal .lg-purity strong {
  display: block;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #c9a85a;
  line-height: 1.1;
  margin-bottom: 2px;
}
.lg-card.lg-v-brushedMetal .lg-meta {
  color: rgba(244, 240, 230, 0.5);
  font-family: 'Outfit', system-ui, sans-serif;
}
.lg-card.lg-v-brushedMetal .lg-stats {
  border-top-color: rgba(244, 240, 230, 0.12);
}
.lg-card.lg-v-brushedMetal .lg-stat-label {
  color: rgba(244, 240, 230, 0.45);
  font-family: 'Outfit', system-ui, sans-serif;
}
.lg-card.lg-v-brushedMetal .lg-stat-value {
  color: rgba(244, 240, 230, 0.92);
  font-family: 'Outfit', system-ui, sans-serif;
  font-weight: 300;
}
.lg-card.lg-v-brushedMetal .lg-stat-value-loss { color: #f87171; }
.lg-card.lg-v-brushedMetal .lg-stat-value-accent {
  background: linear-gradient(90deg, #c9a85a 0%, #f4d577 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
</style>
