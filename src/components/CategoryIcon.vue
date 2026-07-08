<template>
  <div class="cico" :class="colorClass">
    <IconDisplay :icon="resolvedIcon" :size="24" :stroke-width="1.6" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IconDisplay from './IconDisplay.vue'
import { getLucideIconName } from '../utils/emojiToLucide'

const props = defineProps<{ icon: string }>()

/**
 * lucide 图标名 → 配色 class
 * 视觉风格与原 CategoryIcon 一致（薄色背景 + 主色描边），
 * 统一通过 lucide 图标库渲染（兼容 emoji 入参，内部走 getLucideIconName 归一化）。
 */
const colorMap: Record<string, string> = {
  LayoutGrid: 'c-all',
  Utensils: 'c-food',
  Car: 'c-trn',
  ShoppingBag: 'c-shp',
  Gamepad2: 'c-ent',
  Heart: 'c-hlt',
  HeartPulse: 'c-hlt',
  Pill: 'c-hlt',
  Stethoscope: 'c-hlt',
  Home: 'c-home',
  BookOpen: 'c-edu',
  Gift: 'c-gift',
  Package: 'c-other',
}

const resolvedIcon = computed(() => getLucideIconName(props.icon))
const colorClass = computed(() => colorMap[resolvedIcon.value] || 'c-other')
</script>

<style scoped>
.cico {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
  position: relative;
}

.cico svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* 全部 — 金色渐变 */
.c-all {
  background: linear-gradient(145deg, #d4a843, #b8860b, #8b6914);
}
.c-all svg { stroke: #fff; }

/* 餐饮 — 橙色 */
.c-food { background: rgba(230, 140, 40, 0.1); }
.c-food svg { stroke: #d08c28; }

/* 交通 — 蓝色 */
.c-trn { background: rgba(70, 150, 230, 0.1); }
.c-trn svg { stroke: #4696e6; }

/* 购物 — 粉色 */
.c-shp { background: rgba(190, 100, 180, 0.1); }
.c-shp svg { stroke: #be64b4; }

/* 娱乐 — 紫色 */
.c-ent { background: rgba(110, 100, 210, 0.1); }
.c-ent svg { stroke: #6e64d2; }

/* 健康/医疗 — 绿色 */
.c-hlt { background: rgba(45, 143, 94, 0.1); }
.c-hlt svg { stroke: #2d8f5e; }

/* 居家 — 青色 */
.c-home { background: rgba(45, 143, 142, 0.1); }
.c-home svg { stroke: #2d8f8e; }

/* 教育 — 靛蓝 */
.c-edu { background: rgba(80, 96, 208, 0.1); }
.c-edu svg { stroke: #5060d0; }

/* 人情 — 红色 */
.c-gift { background: rgba(209, 69, 91, 0.1); }
.c-gift svg { stroke: #d1455b; }

/* 其他 — 灰色 */
.c-other { background: rgba(112, 108, 100, 0.1); }
.c-other svg { stroke: #706c64; }
</style>
