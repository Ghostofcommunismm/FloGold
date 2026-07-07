<template>
  <div class="cico" :class="colorClass">
    <svg viewBox="0 0 24 24" v-html="iconPath"></svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ name: string }>()

interface IconDef { path: string; cls: string }

const map: Record<string, IconDef> = {
  '全部': {
    cls: 'c-all',
    path: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>'
  },
  '餐饮': {
    cls: 'c-food',
    path: '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>'
  },
  '交通': {
    cls: 'c-trn',
    path: '<rect x="1" y="3" width="15" height="13" rx="3"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'
  },
  '购物': {
    cls: 'c-shp',
    path: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>'
  },
  '娱乐': {
    cls: 'c-ent',
    path: '<line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/>'
  },
  '健康': {
    cls: 'c-hlt',
    path: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'
  },
  '医疗': {
    cls: 'c-hlt',
    path: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'
  },
  '居家': {
    cls: 'c-home',
    path: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'
  },
  '教育': {
    cls: 'c-edu',
    path: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'
  },
  '人情': {
    cls: 'c-gift',
    path: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>'
  },
  '其他': {
    cls: 'c-other',
    path: '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'
  }
}

const fallback: IconDef = {
  cls: 'c-other',
  path: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
}

const def = computed(() => map[props.name] || fallback)
const iconPath = computed(() => def.value.path)
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
