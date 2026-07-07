<template>
  <section class="bcard">
    <div class="bcard-top">
      <div class="bcard-chip"></div>
      <div class="bcard-contactless"><span></span><span></span><span></span></div>
    </div>
    <div class="bcard-brand">WEALTH FINANCE</div>
    <div class="blbl">本月余额</div>
    <div class="bamt">
      <span class="cur">¥</span>{{ animatedBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
    </div>
    <div class="bstats">
      <div class="scard">
        <div class="slbl">
          <svg class="si-i" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          收入
        </div>
        <div class="sval inc">¥{{ totalIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
      </div>
      <div class="scard">
        <div class="slbl">
          <svg class="si-e" viewBox="0 0 24 24"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
          支出
        </div>
        <div class="sval exp">¥{{ totalExpense.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
      </div>
    </div>
    <div class="bcard-num">•••• •••• •••• 8826</div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  animatedBalance: number
  totalIncome: number
  totalExpense: number
}>()
</script>

<style scoped>
/* Balance Card — Platinum Bank Card */
.bcard {
  background:
    linear-gradient(145deg, rgba(255, 255, 255, .6) 0%, transparent 30%, transparent 70%, rgba(255, 255, 255, .3) 100%),
    linear-gradient(160deg, #2C2926 0%, #3A3530 20%, #2F2B26 40%, #342F2A 60%, #28241F 80%, #1E1B17 100%);
  border: 1px solid rgba(184, 134, 11, .25);
  border-radius: 20px;
  padding: 24px 24px 20px;
  position: relative;
  overflow: hidden;
  margin-bottom: 28px;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, .15),
    0 4px 12px rgba(0, 0, 0, .1),
    inset 0 1px 0 rgba(255, 255, 255, .12),
    inset 0 -1px 0 rgba(0, 0, 0, .2);
}

/* Holographic shimmer — platinum rainbow tint */
.bcard::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg,
    transparent 15%,
    rgba(184, 134, 11, .04) 30%,
    rgba(212, 168, 83, .1) 38%,
    rgba(180, 200, 220, .08) 44%,
    rgba(184, 134, 11, .06) 52%,
    transparent 65%
  );
  pointer-events: none;
  animation: cardShimmer 4s ease-in-out infinite alternate;
}

@keyframes cardShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Brushed metal texture */
.bcard::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: .06;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    90deg, transparent, transparent 1px, rgba(255, 255, 255, .4) 1px, rgba(255, 255, 255, .4) 2px
  );
  background-size: 3px 3px;
}

/* Card chip */
.bcard-chip {
  width: 42px;
  height: 32px;
  border-radius: 6px;
  background: linear-gradient(145deg, #E0C060, #D4A843, #C49A30, #D4A843);
  box-shadow: 0 1px 3px rgba(0, 0, 0, .3), inset 0 1px 0 rgba(255, 255, 255, .4);
  position: relative;
  flex-shrink: 0;
}

.bcard-chip::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 20px;
  border: 1.5px solid rgba(139, 105, 20, .5);
  border-radius: 3px;
}

.bcard-chip::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 20px;
  border: 1px solid rgba(139, 105, 20, .35);
  border-radius: 2px;
}

/* Card top row */
.bcard-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.bcard-brand {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: rgba(212, 168, 83, .6);
  letter-spacing: .12em;
  text-transform: uppercase;
  position: relative;
  z-index: 1;
}

.bcard-contactless {
  display: flex;
  gap: 2px;
  opacity: .4;
}

.bcard-contactless span {
  display: block;
  width: 3px;
  height: 16px;
  background: #D4A843;
  border-radius: 2px;
  transform: rotate(-30deg);
}

.blbl {
  font-size: 12px;
  font-weight: 500;
  color: rgba(212, 168, 83, .7);
  letter-spacing: .06em;
  text-transform: uppercase;
  margin-bottom: 6px;
  position: relative;
  z-index: 1;
}

.bamt {
  font-family: 'DM Sans', 'Noto Sans SC', sans-serif;
  font-size: 40px;
  font-weight: 700;
  color: #F5F2EC;
  letter-spacing: -.03em;
  line-height: 1.1;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, .3);
  font-variant-numeric: tabular-nums;
}

.bamt .cur {
  font-size: 22px;
  font-weight: 500;
  margin-right: 2px;
  background: linear-gradient(180deg, #F0D080, #D4A843);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.bstats {
  display: flex;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.scard {
  flex: 1;
  background: rgba(255, 255, 255, .06);
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 14px;
  padding: 12px 14px;
  transition: all .2s;
  cursor: pointer;
}

.scard:hover {
  background: rgba(255, 255, 255, .1);
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, .12);
}

.slbl {
  font-size: 10px;
  font-weight: 500;
  color: rgba(255, 255, 255, .35);
  letter-spacing: .03em;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.slbl svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.slbl .si-i { stroke: #5AE89C; }
.slbl .si-e { stroke: #F06B7E; }

.sval {
  font-family: 'DM Sans', sans-serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -.02em;
  color: rgba(255, 255, 255, .9);
  font-variant-numeric: tabular-nums;
}

.sval.inc { color: #5AE89C; }
.sval.exp { color: #F06B7E; }

/* Card number watermark */
.bcard-num {
  position: absolute;
  bottom: 18px;
  right: 24px;
  font-family: 'DM Sans', monospace;
  font-size: 13px;
  font-weight: 400;
  color: rgba(212, 168, 83, .1);
  letter-spacing: .15em;
  z-index: 0;
}
</style>
