<template>
  <div class="cico" :class="colorClass">
    <component :is="iconComponent" :size="24" :stroke-width="1.6" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  LayoutGrid, Utensils, Car, ShoppingBag, Gamepad2,
  Heart, Home, BookOpen, Gift, Package,
  Coffee, Apple, IceCream, Pizza, Wine,
  Bike, Train, Bus, Plane, CarTaxiFront,
  ShoppingCart, Store, Tag, Shirt, Watch,
  Banknote, Wallet, TrendingUp, PiggyBank, Landmark,
  Film, Music, Tv, Ticket, Guitar,
  HeartPulse, Pill, Stethoscope, Activity, Hospital,
  Building2, Lamp, Bed, Bath, Key,
  GraduationCap, Pencil, Notebook, Lightbulb,
  CircleDollarSign, CreditCard, Coins
} from '../utils/icons'

const props = defineProps<{ name: string }>()

interface IconDef {
  component: any
  cls: string
}

const map: Record<string, IconDef> = {
  '全部': { cls: 'c-all', component: LayoutGrid },
  '餐饮': { cls: 'c-food', component: Utensils },
  '交通': { cls: 'c-trn', component: Car },
  '购物': { cls: 'c-shp', component: ShoppingBag },
  '娱乐': { cls: 'c-ent', component: Gamepad2 },
  '健康': { cls: 'c-hlt', component: Heart },
  '医疗': { cls: 'c-hlt', component: HeartPulse },
  '居家': { cls: 'c-home', component: Home },
  '教育': { cls: 'c-edu', component: BookOpen },
  '人情': { cls: 'c-gift', component: Gift },
  '其他': { cls: 'c-other', component: Package }
}

const fallback: IconDef = {
  cls: 'c-other',
  component: Package
}

const def = computed(() => map[props.name] || fallback)
const iconComponent = computed(() => def.value.component)
const colorClass = computed(() => def.value.cls)
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