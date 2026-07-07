<template>
  <section class="bcard">
    <!-- 顶部：余额标题 + 眼睛(显示/隐藏) -->
    <div class="bcard-top">
      <div class="blbl">本月余额</div>
      <button
        class="bcard-eye"
        :class="{ off: !balanceVisible }"
        @click="balanceVisible = !balanceVisible"
        :aria-label="balanceVisible ? '隐藏余额' : '显示余额'"
      >
        <svg v-if="balanceVisible" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      </button>
    </div>

    <!-- 余额数字 + 趋势 -->
    <div class="bcard-balance-row">
      <div class="bamt">
        <span v-if="balanceVisible" class="cur">¥</span>
        <span v-if="balanceVisible">{{ animatedBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
        <span v-else class="bamt-hidden">••••••</span>
      </div>
      <div v-if="balanceVisible && monthExpensePrev > 0" class="btrend" :class="trendCls">
        <span class="btrend-arrow">{{ trendArrow }}</span>
        <span class="btrend-pct">{{ Math.abs(trendPct).toFixed(1) }}%</span>
        <span class="btrend-cap">较上月</span>
      </div>
    </div>

    <!-- 预算进度条(可选) -->
    <div v-if="budgetLimit > 0 && balanceVisible" class="bcard-budget">
      <div class="bb-track">
        <div
          class="bb-fill"
          :class="{ over: budgetUsage > 100 }"
          :style="{ width: Math.min(budgetUsage, 100) + '%' }"
        ></div>
      </div>
      <div class="bb-meta">
        <span class="bb-cap">月度预算</span>
        <span class="bb-used">
          ¥{{ monthExpense.toFixed(0) }} / ¥{{ budgetLimit.toFixed(0) }}
        </span>
        <span class="bb-pct" :class="{ over: budgetUsage > 100 }">
          {{ budgetUsage > 100 ? '超支 ' + Math.round(budgetUsage - 100) + '%' : '已花 ' + budgetUsage.toFixed(0) + '%' }}
        </span>
      </div>
    </div>

    <!-- 收入支出 -->
    <div class="bstats">
      <div class="scard in">
        <div class="slbl">
          <svg class="si-i" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          收入
        </div>
        <div class="sval">¥{{ totalIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
      </div>
      <div class="scard out">
        <div class="slbl">
          <svg class="si-e" viewBox="0 0 24 24"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
          支出
        </div>
        <div class="sval">¥{{ totalExpense.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  animatedBalance: number
  totalIncome: number
  totalExpense: number
  monthExpense: number
  monthExpensePrev: number
  budgetLimit: number
}>()

// 余额可见性切换(用户偏好,默认显示)
const balanceVisible = ref(true)

// 余额 vs 上月支出趋势 — 用"已花"代表日常节奏(支出 vs 支出 才合理)，
// 但用户更关心"净结余变化"，所以改用本月余额与上月余额对比;
// 这里先用 monthExpensePrev 与 monthExpense 比较，作为近似"对比"的轻量信号。
const trendPct = computed(() => {
  if (props.monthExpensePrev <= 0) return 0
  // 支出口径：本月少 = 节流好(下箭头 = 好);本月多 = 破费(上箭头 = 警示)
  // 我们用克制版规则: 支出环比上升视为「↑」红色提示，下降为「↓」绿色
  return ((props.monthExpense - props.monthExpensePrev) / props.monthExpensePrev) * 100
})
const trendCls = computed(() => {
  if (trendPct.value < -0.1) return 'good'
  if (trendPct.value > 0.1) return 'bad'
  return 'flat'
})
const trendArrow = computed(() => {
  if (trendPct.value > 0.1) return '↑'
  if (trendPct.value < -0.1) return '↓'
  return '—'
})

// 预算使用率(%)
const budgetUsage = computed(() => {
  if (props.budgetLimit <= 0) return 0
  return (props.monthExpense / props.budgetLimit) * 100
})
</script>

<style scoped>
/* ========== 克制版: 以浅暖底 + 淡金边 替代原来高饱和的黄铜金属 ==========
   思路：金色仅作 1 处强调(顶部右侧眼睛 hover)，其余收敛到中性卡其 */
.bcard {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(250, 245, 240, 0.88) 100%);
  border-radius: 20px;
  padding: 14px 18px 14px;
  position: relative;
  overflow: hidden;
  margin-bottom: 14px;
  border: 1px solid rgba(212, 165, 116, 0.18);
  box-shadow:
    0 4px 18px rgba(174, 168, 155, 0.10),
    0 1px 2px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

/* 底部淡金光晕: 仅在卡片底部一道很弱的暖色光, 不抢戏 */
.bcard::before {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 38%;
  background: linear-gradient(180deg, transparent, rgba(212, 165, 116, 0.07));
  pointer-events: none;
  z-index: 0;
}

/* 顶部行 */
.bcard-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  position: relative;
  z-index: 1;
}

/* 标签 */
.blbl {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* 眼睛按钮 */
.bcard-eye {
  width: 28px;
  height: 28px;
  border-radius: 14px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.2s, background 0.2s, transform 0.2s;
}
.bcard-eye:hover {
  color: var(--accent);
  background: var(--accent-light);
  transform: scale(1.06);
}
.bcard-eye.off {
  color: var(--text-muted);
}

/* 余额 + 趋势 行 */
.bcard-balance-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}

.bamt {
  font-family: 'DM Sans', 'Outfit', sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}
.bamt .cur {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-right: 2px;
}
.bamt-hidden {
  font-size: 28px;
  letter-spacing: 0.18em;
  color: var(--text-muted);
}

/* 趋势小标签 */
.btrend {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  padding: 4px 9px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
  flex-shrink: 0;
}
.btrend.good { background: rgba(139, 168, 136, 0.14); color: var(--income); }
.btrend.bad  { background: rgba(201, 123, 123, 0.14); color: var(--expense); }
.btrend.flat { background: rgba(174, 168, 155, 0.14); color: var(--text-secondary); }
.btrend-arrow { font-size: 12px; }
.btrend-cap { color: inherit; opacity: 0.72; font-weight: 500; margin-left: 1px; }

/* 预算进度条 */
.bcard-budget {
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}
.bb-track {
  height: 6px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-bottom: 6px;
}
.bb-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--income);
  transition: width 0.7s cubic-bezier(0.34, 1.4, 0.64, 1), background 0.3s;
  position: relative;
  overflow: hidden;
}
.bb-fill.over { background: var(--expense); }
.bb-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  transform: translateX(-120%);
  animation: bbShimmer 2.6s ease-in-out 0.6s infinite;
}
@keyframes bbShimmer {
  0%   { transform: translateX(-120%); }
  55%  { transform: translateX(120%); }
  100% { transform: translateX(120%); }
}
.bb-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
.bb-cap { font-weight: 600; }
.bb-used { color: var(--text-secondary); }
.bb-pct { margin-left: auto; font-weight: 700; color: var(--income); }
.bb-pct.over { color: var(--expense); }

/* 收入支出容器 */
.bstats {
  display: flex;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.scard {
  flex: 1;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 1px 3px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.scard:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 3px 8px rgba(0, 0, 0, 0.05);
}

.slbl {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.04em;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.slbl svg {
  width: 13px;
  height: 13px;
  fill: none;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.slbl .si-i { stroke: var(--income); }
.slbl .si-e { stroke: var(--expense); }

.sval {
  font-family: 'DM Sans', 'Outfit', sans-serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}

.scard.in .sval { color: var(--income); }
.scard.out .sval { color: var(--expense); }

/* 深色模式 */
:root[data-theme="dark"] .bcard {
  background:
    linear-gradient(180deg, rgba(45, 41, 37, 0.7) 0%, rgba(40, 36, 32, 0.55) 100%);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 4px 18px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
:root[data-theme="dark"] .bcard::before {
  background: linear-gradient(180deg, transparent, rgba(212, 165, 116, 0.10));
}
:root[data-theme="dark"] .scard {
  background: rgba(255, 255, 255, 0.04);
}
:root[data-theme="dark"] .bb-track { background: rgba(255, 255, 255, 0.08); }

@media (prefers-reduced-motion: reduce) {
  .bb-fill { transition: width 0.7s ease; }
  .bb-fill::after { animation: none; }
}
</style>
