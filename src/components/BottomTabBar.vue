<template>
  <LiquidGlass
    class-name="liquid-tab-glass"
    :blur-amount="0.22"
    :saturation="168"
    :elasticity="0.12"
    :displacement-scale="52"
    :aberration-intensity="3.6"
    :corner-radius="34"
    effect="liquidGlass"
    :mode="'shader'"
    padding="0"
    :style="{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)', left: '50%', top: 'auto', zIndex: '100' }"
  >
    <div class="capsule-inner">
      <!-- 首页 -->
      <button
        class="tab-item"
        :class="{ active: modelValue === 'home' }"
        @click="$emit('update:modelValue', 'home')"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span class="tab-label">首页</span>
      </button>

      <!-- 统计 -->
      <button
        class="tab-item"
        :class="{ active: modelValue === 'stats' }"
        @click="$emit('update:modelValue', 'stats')"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <span class="tab-label">统计</span>
      </button>

      <!-- 资产 -->
      <button
        class="tab-item"
        :class="{ active: modelValue === 'assets' }"
        @click="$emit('update:modelValue', 'assets')"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
        <span class="tab-label">资产</span>
      </button>

      <!-- 我的 -->
      <button
        class="tab-item"
        :class="{ active: modelValue === 'profile' }"
        @click="$emit('update:modelValue', 'profile')"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span class="tab-label">我的</span>
      </button>

      <!-- 记账按钮 - 独立在胶囊最右侧 -->
      <div class="add-btn-divider"></div>
      <button class="add-btn" @click="ripple($event); $emit('add-click')">
        <svg class="add-btn-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>
  </LiquidGlass>
</template>

<script setup lang="ts">
import { LiquidGlass } from '@wxperia/liquid-glass-vue'

defineProps<{
  modelValue: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'add-click'): void
}>()

// 涟漪：在点击位置生成一个一次性扩散圆
function ripple(e: MouseEvent) {
  const btn = e.currentTarget as HTMLElement
  const rect = btn.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const span = document.createElement('span')
  span.className = 'add-ripple'
  span.style.width = span.style.height = size + 'px'
  span.style.left = e.clientX - rect.left - size / 2 + 'px'
  span.style.top = e.clientY - rect.top - size / 2 + 'px'
  btn.appendChild(span)
  setTimeout(() => span.remove(), 600)
}
</script>

<style>
/* 全局样式：作用于 LiquidGlass 组件内部的 .glass 元素 */
.liquid-tab-glass .glass {
  display: inline-flex !important;
  border: 1px solid rgba(255, 255, 255, 0.56);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.46), rgba(255, 255, 255, 0.18) 48%, rgba(255, 255, 255, 0.34)),
    rgba(255, 255, 255, 0.22);
  -webkit-backdrop-filter: blur(18px) saturate(168%);
  backdrop-filter: blur(18px) saturate(168%);
  box-shadow:
    0 18px 42px rgba(61, 56, 48, 0.20),
    0 6px 18px rgba(61, 56, 48, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    inset 0 -1px 0 rgba(255, 255, 255, 0.28) !important;
  isolation: isolate;
}

.liquid-tab-glass .glass__warp {
  inset: -2px !important;
  opacity: 0.95;
}

:root[data-theme="dark"] .liquid-tab-glass .glass {
  border-color: rgba(255, 255, 255, 0.20);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.07) 50%, rgba(255, 255, 255, 0.14)),
    rgba(32, 30, 28, 0.36);
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.34),
    0 6px 18px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -1px 0 rgba(255, 255, 255, 0.08) !important;
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .liquid-tab-glass .glass {
    background: rgba(255, 255, 255, 0.82);
  }
}
</style>

<style scoped>
.capsule-inner {
  display: flex;
  align-items: center;
  gap: 3px;
  width: min(calc(100vw - 28px), 430px);
  min-height: 64px;
  padding: 7px 8px 7px 12px;
  border-radius: 34px;
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.capsule-inner::before,
.capsule-inner::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}

.capsule-inner::before {
  z-index: 0;
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.78), transparent 27%),
    radial-gradient(circle at 84% 115%, rgba(255, 255, 255, 0.34), transparent 34%),
    linear-gradient(102deg, rgba(255, 255, 255, 0.12), transparent 34%, rgba(255, 255, 255, 0.26) 65%, transparent);
  mix-blend-mode: screen;
  opacity: 0.86;
}

.capsule-inner::after {
  z-index: 1;
  padding: 1px;
  background:
    linear-gradient(94deg, rgba(78, 183, 255, 0.34), rgba(255, 255, 255, 0.58) 46%, rgba(255, 86, 139, 0.34)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.54), rgba(255, 255, 255, 0.08));
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  filter: blur(0.2px);
  mix-blend-mode: screen;
  opacity: 0.76;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1 1 0;
  min-width: 0;
  min-height: 48px;
  padding: 7px 4px;
  border: none;
  border-radius: 20px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--sans);
  touch-action: manipulation;
  z-index: 2;
  transition:
    color 0.25s ease,
    opacity 0.2s ease,
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.tab-item::before {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 17px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.60), rgba(255, 255, 255, 0.22)),
    rgba(255, 255, 255, 0.22);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.68),
    inset 0 -1px 0 rgba(255, 255, 255, 0.22),
    0 6px 18px rgba(212, 165, 116, 0.14);
  opacity: 0;
  transform: scale(0.84);
  transition:
    opacity 0.22s ease,
    transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
  z-index: 0;
}

.tab-item svg,
.tab-label {
  position: relative;
  z-index: 1;
}

.tab-item.active {
  color: var(--accent-dark);
  font-weight: 600;
}

.tab-item.active::before {
  opacity: 1;
  transform: scale(1);
}

.tab-item.active svg {
  stroke: var(--accent);
  filter:
    drop-shadow(-0.5px 0 rgba(78, 183, 255, 0.24))
    drop-shadow(0.5px 0 rgba(255, 86, 139, 0.22));
}

.tab-item:active {
  opacity: 0.7;
  transform: scale(0.94);
}

.tab-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1.15;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-item.active .tab-label {
  font-weight: 700;
}

/* 分隔线 */
.add-btn-divider {
  width: 1px;
  height: 28px;
  background:
    linear-gradient(
      to bottom,
      transparent,
      rgba(255, 255, 255, 0.58) 18%,
      rgba(174, 168, 155, 0.26) 50%,
      rgba(255, 255, 255, 0.42) 82%,
      transparent
    );
  margin: 0 5px;
  border-radius: 1px;
  z-index: 2;
}

/* 记账按钮 */
.add-btn {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  border: none;
  background:
    radial-gradient(circle at 32% 18%, rgba(255, 255, 255, 0.58), transparent 32%),
    linear-gradient(145deg, #e7bd8d, var(--accent) 48%, #bc8555);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow:
    0 8px 22px rgba(212, 165, 116, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.46),
    inset 0 -1px 0 rgba(103, 66, 33, 0.22);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  z-index: 2;
  touch-action: manipulation;
}

.add-btn::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 25px;
  border: 1.5px solid var(--accent);
  opacity: 0;
  animation: addPulse 2.8s ease-out 1s infinite;
  z-index: 0;
}

.add-btn::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.48), transparent 42%),
    linear-gradient(315deg, rgba(255, 96, 128, 0.18), rgba(92, 196, 255, 0.14));
  mix-blend-mode: screen;
  opacity: 0.75;
  pointer-events: none;
  z-index: 1;
}

.add-btn-icon {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 2;
}

.add-btn:hover {
  box-shadow: 0 6px 20px rgba(212, 165, 116, 0.55);
  transform: scale(1.06);
}
.add-btn:hover .add-btn-icon {
  transform: rotate(90deg);
}

.add-btn:active {
  box-shadow: 0 6px 20px rgba(212, 165, 116, 0.55);
  transform: scale(0.92);
}
.add-btn:active .add-btn-icon {
  transform: rotate(90deg) scale(0.85);
}

@keyframes addPulse {
  0%   { transform: scale(0.9); opacity: 0.55; }
  70%  { transform: scale(1.25); opacity: 0; }
  100% { transform: scale(1.25); opacity: 0; }
}

.add-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: scale(0);
  animation: addRipple 0.6s ease-out;
  pointer-events: none;
  z-index: 1;
}
@keyframes addRipple {
  to { transform: scale(2.4); opacity: 0; }
}

:root[data-theme="dark"] .capsule-inner::before {
  opacity: 0.42;
}

:root[data-theme="dark"] .tab-item::before {
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.06)),
    rgba(255, 255, 255, 0.08);
}

@media (hover: hover) {
  .tab-item:hover {
    transform: translateY(-1px);
  }
}

@media (max-width: 360px) {
  .capsule-inner {
    width: calc(100vw - 20px);
    padding-inline: 8px 7px;
  }

  .tab-item {
    min-height: 46px;
  }

  .add-btn-divider {
    margin: 0 3px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab-item,
  .tab-item::before,
  .add-btn,
  .add-btn-icon {
    transition: none;
  }

  .add-btn::before {
    animation: none;
  }
}
</style>
