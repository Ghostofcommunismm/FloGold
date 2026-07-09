<template>
  <Teleport to="body">
    <Transition name="pos-modal">
      <div v-if="show" class="pos-modal-overlay" @click.self="handleClose">
        <!-- POS Combo (弹窗内容) -->
        <div class="pos-combo" :class="{ raise: isOpen }">
          <!-- POS Machine -->
          <div class="pos-machine">
            <div class="pos-body">
              <!-- Top: Printer Module -->
              <div class="pos-printer">
                <div class="printer-row">
                  <div class="vents">
                    <span v-for="i in 10" :key="i"></span>
                  </div>
                  <div class="printer-brand">FloGold<span class="em"> · POS</span></div>
                  <div class="led" :class="ledClass"></div>
                </div>
                <div class="printer-slot"></div>
              </div>

              <!-- LCD Screen -->
              <div class="pos-screen">
                <div class="screen-inner">
                  <div class="screen-top">
                    <span>FloGold · 联机</span>
                    <div class="signal">
                      <span></span><span></span><span></span><span></span>
                    </div>
                  </div>
                  <div class="screen-amount-row">
                    <span class="lab">{{ form.type === 'expense' ? '支出' : '收入' }}</span>
                    <span class="cur">¥</span>
                    <span class="num">{{ displayAmount }}</span>
                    <span class="cursor"></span>
                  </div>
                  <div class="screen-cat-row">
                    <span
                      v-for="cat in displayCategories"
                      :key="cat"
                      class="cat-cell"
                      :class="{ active: cat === form.category }"
                      @click="handleSelectCategory(cat)"
                    >{{ cat }}</span>
                  </div>
                  <div class="screen-info">
                    > 商户 <span>{{ form.merchant || '—' }}</span><br>
                    > 地点 <span>{{ form.location || '—' }}</span><br>
                    > 备注 <span>{{ form.note || '—' }}</span>
                  </div>
                  <div class="screen-cta" @click="handleConfirm">
                    <span>完成 → 联机打印</span>
                    <span class="arrow">→</span>
                  </div>
                </div>
              </div>

              <!-- Keypad -->
              <div class="pos-keypad">
                <button
                  v-for="key in keypadKeys"
                  :key="key"
                  class="key"
                  :class="{ fn: ['⌫', '+', '-', '00'].includes(key), go: key === 'go' }"
                  @click="handleKeyTap(key)"
                >
                  <template v-if="key === 'go'">
                    <div class="key-inner">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>完成</span>
                    </div>
                  </template>
                  <template v-else>{{ key }}</template>
                </button>
              </div>

              <div class="pos-base">FloGold<span class="em"> · 80mm THERMAL</span></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface Props {
  show: boolean
  form: {
    type: 'expense' | 'income'
    amount: string
    category: string
    subCategory?: string
    merchant?: string
    location?: string
    note?: string
  }
  categories: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  save: [form: Props['form']]
  'update:form': [form: Props['form']]
}>()

const isOpen = ref(false)
const localForm = ref({ ...props.form })

watch(() => props.form, (newForm) => {
  localForm.value = { ...newForm }
}, { deep: true })

watch(localForm, (newForm) => {
  emit('update:form', { ...newForm })
}, { deep: true })

watch(() => props.show, (show) => {
  if (show) {
    setTimeout(() => { isOpen.value = true }, 50)
  } else {
    isOpen.value = false
  }
})

onMounted(() => {
  if (props.show) {
    setTimeout(() => { isOpen.value = true }, 50)
  }
})

const keypadKeys = ['1', '2', '3', '⌫', '4', '5', '6', '+', '7', '8', '9', '-', '.', '0', '00', 'go']

const displayAmount = computed(() => localForm.value.amount || '0')
const displayCategories = computed(() => props.categories.slice(0, 5))
const ledClass = computed(() => localForm.value.amount ? 'lcd-on' : '')

function handleKeyTap(key: string) {
  if (key === 'go') {
    handleConfirm()
    return
  }
  
  let amount = localForm.value.amount
  if (key === '⌫') {
    amount = amount.slice(0, -1)
  } else if (key === '+') {
  } else if (key === '-') {
  } else if (key === '00') {
    amount += '00'
  } else if (key === '.') {
    if (!amount.includes('.')) amount += '.'
  } else {
    amount += key
  }
  
  if (amount.length <= 12) {
    localForm.value.amount = amount
  }
}

function handleSelectCategory(cat: string) {
  localForm.value.category = cat
}

function handleConfirm() {
  if (localForm.value.amount && localForm.value.category) {
    emit('save', { ...localForm.value })
  }
}

function handleClose() {
  isOpen.value = false
  setTimeout(() => emit('close'), 300)
}
</script>

<style scoped>
/* Theme tokens */
.pos-modal-overlay {
  --bg: #f5f3ee;
  --ink: #1f1d18;
  --gold: #d4a574;
  --gold-deep: #8a5f1c;
  --pos-body: #e8e2d5;
  --pos-body-2: #ddd5c4;
  --pos-key: #faf5ee;
  --pos-key-2: #e8e2d5;
  --pos-key-hi: rgba(255, 255, 255, 0.7);
  --pos-key-lo: rgba(31, 29, 24, 0.18);
  --lcd: #2a8fbc;
  --lcd-bg: #050810;
  --sans: 'Outfit', 'Noto Sans SC', system-ui, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
}

[data-theme="dark"] .pos-modal-overlay {
  --bg: #1a1815;
  --ink: #f5f3ee;
  --pos-body: #1a1815;
  --pos-body-2: #252220;
  --pos-key: #3a3530;
  --pos-key-2: #2a2520;
}

/* Overlay */
.pos-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 16px 24px;
}

[data-theme="light"] .pos-modal-overlay {
  background: rgba(31, 29, 24, 0.4);
}

/* POS Combo (from HTML demo) */
.pos-combo {
  width: 100%;
  max-width: 380px;
  transform: translateY(calc(100% + 24px));
  transition: transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 -10px 30px rgba(0,0,0,0.4));
}

.pos-combo.raise {
  transform: translateY(0);
}

/* POS Machine (from HTML demo) */
.pos-machine {
  position: relative;
  height: 450px;
  width: 100%;
}

.pos-body {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #a0a0a0 0%, #fff 40%, #d8d8d8 100%);
  border-radius: 22px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.12),
    inset 0 -1px 0 rgba(0,0,0,0.5),
    0 4px 14px rgba(0,0,0,0.3);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1;
}

[data-theme="dark"] .pos-body {
  background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 40%, #1a1a1a 100%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.05),
    inset 0 -1px 0 rgba(0,0,0,0.5),
    0 4px 14px rgba(0,0,0,0.5);
}

/* Printer Module (from HTML demo) */
.pos-printer {
  height: 56px;
  background: linear-gradient(180deg, #d8d8d8 0%, #fff 100%);
  border-bottom: 1px solid rgba(31,29,24,0.18);
  position: relative;
  display: flex;
  flex-direction: column;
}

[data-theme="dark"] .pos-printer {
  background: linear-gradient(180deg, #3a3630 0%, #2a2620 100%);
  border-bottom: 1px solid rgba(0,0,0,0.5);
}

.printer-row {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
}

.vents {
  display: flex;
  gap: 2px;
  align-items: center;
  height: 12px;
}

.vents span {
  width: 1.5px;
  height: 100%;
  background: rgba(31,29,24,0.35);
  border-radius: 1px;
}

[data-theme="dark"] .vents span {
  background: rgba(255,255,255,0.3);
}

.printer-brand {
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: rgba(31,29,24,0.50);
  text-transform: uppercase;
}

[data-theme="dark"] .printer-brand {
  color: rgba(255,255,255,0.5);
}

.printer-brand .em {
  color: var(--gold-deep);
}

.led {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: rgba(31,29,24,0.30);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.30);
  transition: all 0.3s;
}

[data-theme="dark"] .led {
  background: rgba(255,255,255,0.2);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.15);
}

.led.lcd-on {
  background: var(--lcd);
  box-shadow: 0 0 8px var(--lcd), inset 0 1px 0 rgba(255,255,255,0.3);
  animation: lcdPulse 2s infinite;
}

@keyframes lcdPulse {
  0%, 100% { box-shadow: 0 0 6px var(--lcd); }
  50% { box-shadow: 0 0 12px var(--lcd); }
}

.printer-slot {
  height: 8px;
  background: #050505;
  position: relative;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.05);
}

.printer-slot::before {
  content: '';
  position: absolute;
  top: 1px; left: 12px; right: 12px;
  height: 5px;
  background: #020202;
  border-radius: 3px;
  box-shadow: inset 0 1px 2px rgba(0,0,0,1);
}

.printer-slot::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  max-width: 180px;
  height: 2px;
  background: #050505;
  box-shadow: 0 1px 0 rgba(255,255,255,0.04);
}

/* LCD Screen (from HTML demo) */
.pos-screen {
  flex: 1;
  margin: 8px 10px;
  border-radius: 8px;
  background: var(--lcd-bg);
  box-shadow:
    inset 0 0 0 1px rgba(0,0,0,0.5),
    inset 0 1px 4px rgba(0,0,0,0.6),
    0 1px 0 rgba(255,255,255,0.06);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pos-screen::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(0deg,
      transparent 0,
      transparent 2px,
      rgba(106, 184, 227, 0.03) 2px,
      rgba(106, 184, 227, 0.03) 3px);
  pointer-events: none;
  z-index: 2;
}

.screen-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  color: var(--lcd);
  font-family: var(--mono);
  position: relative;
  z-index: 1;
}

.screen-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 8px;
  letter-spacing: 0.12em;
  color: rgba(106, 184, 227, 0.7);
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(106, 184, 227, 0.15);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.screen-top .signal {
  display: flex;
  gap: 1px;
  align-items: flex-end;
}

.screen-top .signal span {
  width: 2px;
  background: var(--lcd);
}

.screen-top .signal span:nth-child(1) { height: 3px; }
.screen-top .signal span:nth-child(2) { height: 5px; }
.screen-top .signal span:nth-child(3) { height: 7px; opacity: 0.5; }
.screen-top .signal span:nth-child(4) { height: 9px; opacity: 0.3; }

.screen-amount-row {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-bottom: 4px;
}

.screen-amount-row .lab {
  font-size: 8px;
  color: rgba(106, 184, 227, 0.5);
  letter-spacing: 0.15em;
  align-self: flex-start;
  margin-top: 6px;
}

.screen-amount-row .cur {
  font-size: 14px;
  color: rgba(106, 184, 227, 0.7);
}

.screen-amount-row .num {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--lcd);
  text-shadow: 0 0 8px rgba(106, 184, 227, 0.5);
  font-feature-settings: 'tnum';
}

.screen-amount-row .cursor {
  display: inline-block;
  width: 1.5px;
  height: 22px;
  background: var(--lcd);
  vertical-align: middle;
  animation: blink 1s infinite;
  box-shadow: 0 0 6px var(--lcd);
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.screen-cat-row {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
  font-size: 8px;
  color: rgba(106, 184, 227, 0.65);
  letter-spacing: 0.05em;
}

.screen-cat-row .cat-cell {
  padding: 2px 5px;
  background: rgba(106, 184, 227, 0.10);
  border-radius: 3px;
  border: 1px solid rgba(106, 184, 227, 0.15);
  cursor: pointer;
}

.screen-cat-row .cat-cell.active {
  background: var(--lcd);
  color: var(--lcd-bg);
  font-weight: 700;
  box-shadow: 0 0 6px rgba(106, 184, 227, 0.4);
}

.screen-info {
  font-size: 8px;
  color: rgba(106, 184, 227, 0.55);
  letter-spacing: 0.05em;
  margin-bottom: auto;
  line-height: 1.4;
}

.screen-info span {
  color: rgba(106, 184, 227, 0.85);
}

.screen-cta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: rgba(106, 184, 227, 0.10);
  border: 1px solid rgba(106, 184, 227, 0.25);
  border-radius: 5px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin-top: auto;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--lcd);
}

.screen-cta:hover {
  background: var(--lcd);
  color: var(--lcd-bg);
  box-shadow: 0 0 8px rgba(106, 184, 227, 0.5);
}

.screen-cta:active {
  transform: scale(0.96);
}

.screen-cta .arrow {
  animation: arrowRight 1.5s infinite;
}

@keyframes arrowRight {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(2px); }
}

/* Keypad (from HTML demo) */
.pos-keypad {
  height: 130px;
  padding: 8px 10px 10px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.key {
  background: linear-gradient(180deg, var(--pos-key) 0%, var(--pos-key-2) 100%);
  border: 1px solid rgba(31,29,24,0.18);
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 var(--pos-key-hi),
    inset 0 -1px 0 var(--pos-key-lo),
    0 2px 0 var(--pos-key-lo);
  transition: all 0.08s;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

[data-theme="dark"] .key {
  border-color: rgba(255,255,255,0.1);
  color: var(--ink);
}

.key:active {
  transform: translateY(1px);
  box-shadow:
    inset 0 1px 0 var(--pos-key-hi),
    inset 0 0 1px var(--pos-key-lo);
  background: linear-gradient(180deg, var(--pos-key-2) 0%, var(--pos-key) 100%);
}

.key.fn {
  font-size: 11px;
  font-family: var(--sans);
  color: var(--gold-deep);
  background: linear-gradient(180deg, #d4cbb5 0%, #c4b89a 100%);
}

[data-theme="dark"] .key.fn {
  background: linear-gradient(180deg, #3a3530 0%, #2a2520 100%);
  color: var(--gold);
}

.key.go {
  background: linear-gradient(180deg, var(--gold) 0%, var(--gold-deep) 100%);
  color: #fff;
  font-size: 11px;
  font-family: var(--sans);
  font-weight: 700;
  letter-spacing: 0.06em;
  border-color: rgba(0,0,0,0.5);
  grid-column: 4;
  grid-row: 3 / span 2;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.25),
    inset 0 -1px 0 rgba(0,0,0,0.3),
    0 2px 0 rgba(0,0,0,0.4);
}

.key.go:active {
  background: linear-gradient(180deg, var(--gold-deep) 0%, var(--gold) 100%);
}

.key.go .key-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 8px;
}

.key.go .key-inner svg {
  width: 14px; height: 14px;
}

/* Base strip */
.pos-base {
  height: 18px;
  background: linear-gradient(180deg, transparent 0%, rgba(31,29,24,0.18) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 0.3em;
  color: rgba(31,29,24,0.40);
}

[data-theme="dark"] .pos-base {
  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%);
  color: rgba(255,255,255,0.4);
}

.pos-base .em {
  color: var(--gold-deep);
}

/* Transition */
.pos-modal-enter-active,
.pos-modal-leave-active {
  transition: opacity 0.3s ease;
}

.pos-modal-enter-from,
.pos-modal-leave-to {
  opacity: 0;
}
</style>