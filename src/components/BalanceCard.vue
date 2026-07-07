<template>
  <section class="bcard">
    <!-- 顶部：余额标题 + 芯片 -->
    <div class="bcard-top">
      <div class="blbl">本月余额</div>
      <div class="bcard-chip"></div>
    </div>
    <!-- 余额数字 -->
    <div class="bamt">
      <span class="cur">¥</span>{{ animatedBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
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
defineProps<{
  animatedBalance: number
  totalIncome: number
  totalExpense: number
}>()
</script>

<style scoped>
/* ========== 黄铜浮雕优化版（方案1：提高对比度） ========== */

/* 黄铜金属卡片主体 - 更亮背景 */
.bcard {
  background:
    linear-gradient(145deg, rgba(255, 255, 255, .12) 0%, transparent 40%, rgba(0, 0, 0, .08) 100%),
    linear-gradient(160deg, #E8D4B0 0%, #DCC4A0 15%, #C9B896 35%, #B8A67C 55%, #E8D4B0 75%, #DCC4A0 100%);
  border-radius: 20px;
  padding: 16px 24px 18px;
  position: relative;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow:
    0 8px 32px rgba(139, 105, 20, .30),
    0 3px 10px rgba(0, 0, 0, .20),
    inset 0 1px 0 rgba(255, 255, 255, .4),
    inset 0 -1px 0 rgba(139, 105, 20, .25);
}

/* 刷纹金属纹理 - 减淡 */
.bcard::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(255, 255, 255, .08) 2px,
      rgba(255, 255, 255, .08) 4px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(0, 0, 0, .02) 3px,
      rgba(0, 0, 0, .02) 6px
    );
  opacity: .10;
  pointer-events: none;
  z-index: 0;
}

/* 光泽反射效果 - 增强 */
.bcard::after {
  content: '';
  position: absolute;
  top: -30%;
  left: -30%;
  width: 160%;
  height: 160%;
  background: radial-gradient(ellipse at 35% 25%, rgba(255, 255, 255, .20) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* 顶部行 - 余额标题 + 芯片 */
.bcard-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

/* 余额标签 - 深色文字 */
.blbl {
  font-size: 13px;
  font-weight: 600;
  color: #3A2E1C;
  letter-spacing: .08em;
  text-transform: uppercase;
  text-shadow: 0 1px 0 rgba(255, 255, 255, .35);
  position: relative;
  z-index: 1;
}

/* 芯片（增强对比） */
.bcard-chip {
  width: 38px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(145deg, #F0E0C8, #D8C8A8, #C8B090, #D8C8A8);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, .35),
    inset 0 1px 0 rgba(255, 255, 255, .6),
    inset 0 -1px 0 rgba(139, 105, 20, .35);
  position: relative;
}

/* 芯片内部方框图案 */
.bcard-chip::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 18px;
  border: 2px solid rgba(90, 74, 40, .5);
  border-radius: 3px;
}

/* 芯片内部竖线分隔 */
.bcard-chip::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 18px;
  border: 1px solid rgba(90, 74, 40, .25);
  border-radius: 1px;
}

/* 余额数字 - 深色文字 */
.bamt {
  font-family: 'DM Sans', 'Outfit', sans-serif;
  font-size: 36px;
  font-weight: 700;
  color: #1A1510;
  letter-spacing: -.02em;
  line-height: 1.2;
  margin-bottom: 14px;
  position: relative;
  z-index: 1;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, .25),
    0 2px 6px rgba(0, 0, 0, .12);
  font-variant-numeric: tabular-nums;
}

.bamt .cur {
  font-size: 18px;
  font-weight: 600;
  color: #5A4A28;
  margin-right: 2px;
}

/* 收入支出容器 */
.bstats {
  display: flex;
  gap: 10px;
  position: relative;
  z-index: 1;
}

/* 收入支出卡片 - 更亮的半透明白色背景 */
.scard {
  flex: 1;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, .25);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, .25),
    inset 0 -2px 0 rgba(139, 105, 20, .15),
    0 2px 6px rgba(139, 105, 20, .12);
  transition: transform .2s, box-shadow .2s;
  cursor: pointer;
}

.scard:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, .3),
    inset 0 -2px 0 rgba(139, 105, 20, .18),
    0 4px 12px rgba(139, 105, 20, .18);
}

/* 标签 - 深色文字 */
.slbl {
  font-size: 11px;
  font-weight: 600;
  color: #3A2E1C;
  letter-spacing: .05em;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.slbl svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.slbl .si-i { stroke: #3A9E7C; }
.slbl .si-e { stroke: #C85A6E; }

/* 数值 - 深色文字 */
.sval {
  font-family: 'DM Sans', 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -.02em;
  font-variant-numeric: tabular-nums;
  color: #1A1510;
}

.scard.in .sval { color: #3A9E7C; }
.scard.out .sval { color: #C85A6E; }
</style>