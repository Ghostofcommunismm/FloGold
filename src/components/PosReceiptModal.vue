<template>
  <Teleport to="body">
    <Transition name="pos-modal">
      <div v-if="show" class="pos-modal-overlay" @click.self="handleClose">
        <!-- POS Combo (弹窗内容 + 出纸口 + 小票，整体移动单元) -->
        <div ref="posComboRef" class="pos-combo" :class="comboClass">

          <!-- POS Machine -->
          <div ref="posMachineRef" class="pos-machine" :class="{ printing: phase === 'printing' }">
            <div class="pos-body">
              <!-- Top: Printer Module -->
              <div class="pos-printer">
                <div class="printer-row">
                  <div class="vents">
                    <span v-for="i in 10" :key="i"></span>
                  </div>
                  <div class="printer-brand">FloGold<span class="em"> · POS</span></div>
                  <div ref="ledRef" class="led" :class="ledClass"></div>
                </div>
                <div class="printer-slot"></div>
              </div>

              <!-- LCD Screen -->
              <div ref="screenRef" class="pos-screen" :class="{ connecting: phase === 'lifting' }">
                <div class="screen-inner">
                  <div class="screen-top">
                    <span ref="screenTopRef">{{ screenTopText }}</span>
                    <div class="signal">
                      <span></span><span></span><span></span><span></span>
                    </div>
                  </div>
                  <template v-if="phase === 'lifting'">
                    <!-- 联机中遮罩 -->
                    <div class="screen-connecting">
                      <div class="conn-ring"></div>
                      <div class="conn-ring r2"></div>
                      <div class="conn-text">PRINTER CONNECTING</div>
                    </div>
                  </template>
                  <template v-else>
                    <div class="screen-amount-row">
                      <span class="lab">{{ form.type === 'expense' ? '支出' : '收入' }}</span>
                      <span class="cur">¥</span>
                      <span class="num">{{ displayAmount }}</span>
                      <span v-if="phase === 'ready'" class="cursor"></span>
                    </div>
                    <div class="screen-cat-row">
                      <span
                        v-for="cat in displayCategories"
                        :key="cat"
                        class="cat-cell"
                        :class="{ active: cat === localForm.category }"
                        @click="handleSelectCategory(cat)"
                      >{{ cat }}</span>
                    </div>
                    <div class="screen-info">
                      > 商户 <span>{{ localForm.merchant || '—' }}</span><br>
                      > 地点 <span>{{ localForm.location || '—' }}</span><br>
                      > 备注 <span>{{ localForm.note || '—' }}</span>
                    </div>
                    <div class="screen-cta" @click="handleConfirm">
                      <span>完成 → 联机打印</span>
                      <span class="arrow">→</span>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Keypad -->
              <div class="pos-keypad">
                <button
                  v-for="key in keypadKeys"
                  :key="key"
                  class="key"
                  :class="{ fn: ['⌫', '+', '-'].includes(key), go: key === 'go' }"
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

          <!-- 出纸口模块 (紧贴 POS 底部，跟随 pos-combo 移动) -->
          <div ref="printerExitRef" class="printer-exit" :class="{ printing: phase === 'printing' }">
            <div class="printer-exit-body">
              <div class="printer-exit-vents">
                <span v-for="i in 6" :key="i"></span>
              </div>
              <div ref="exitLedRef" class="printer-exit-led" :class="exitLedClass"></div>
              <div class="printer-slot-exit">
                <div class="slot-glow"></div>
              </div>
            </div>
          </div>

          <!-- 联机连接线 -->
          <div ref="connLineRef" class="connection-line" :class="{ show: showConnLine }"></div>

          <!-- 联机状态 pill -->
          <div v-if="false" ref="statusPillRef" class="status-pill" :class="{ show: showConnLine }">
            <span class="blink-dot"></span>
            <span>正在联机打印…</span>
          </div>

          <!-- 小票区 -->
          <div ref="receiptWrapRef" class="receipt-wrap" :class="{ visible: receiptVisible }">
            <!-- 撕纸指示器 -->
            <div ref="tearIndicatorRef" class="tear-indicator" :class="{ show: tearIndicatorShow }">
              <div class="line"></div>
              <div ref="scissorsRef" class="scissors" :style="{ transform: scissorsX }">✂</div>
            </div>

            <!-- 纸屑 -->
            <div ref="paperBitsRef" class="paper-bits">
              <div
                v-for="bit in paperBits"
                :key="bit.id"
                class="bit"
                :class="{ fly: bit.fly }"
                :style="bit.style"
              ></div>
            </div>

            <!-- 小票内容 -->
            <div
              ref="receiptRef"
              class="receipt"
              :class="receiptClass"
              @click.stop="handleReceiptClick"
            >
              <div class="r-head">
                <div class="logo">FloGold<span class="gold"> · 记账小票</span></div>
                <div class="sub">RECEIPT · {{ receiptCode }}</div>
              </div>
              <div class="r-time">
                <span>{{ receiptDateStr }}</span>
                <span>{{ receiptTimeStr }} {{ receiptWeekday }}</span>
              </div>
              <div class="r-dot d1"></div>
              <div class="r-cat">
                <div class="ic">
                  <svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                </div>
                <div class="text">
                  <div class="lab">CATEGORY</div>
                  <div class="val">{{ localForm.category }}<template v-if="localForm.subCategory"> · {{ localForm.subCategory }}</template></div>
                </div>
              </div>
              <div class="r-amount" :class="localForm.type">
                <div><span class="cur">¥</span><span class="num">{{ cleanAmount }}</span></div>
                <span class="badge"><template v-if="localForm.type === 'expense'">支出</template><template v-else>收<br>入</template></span>
              </div>
              <div class="r-dot d2"></div>
              <div class="r-detail">
                <div class="r-detail-row"><span class="lab">商户</span><span class="val">{{ localForm.merchant || '—' }}</span></div>
                <div class="r-detail-row"><span class="lab">地点</span><span class="val">{{ localForm.location || '—' }}</span></div>
                <div class="r-detail-row"><span class="lab">备注</span><span class="val">{{ localForm.note || '—' }}</span></div>
              </div>
              <div class="r-dot d3"></div>
              <div class="r-barcode">
                <div ref="barsRef" class="bars">
                  <div
                    v-for="(h, i) in barHeights"
                    :key="i"
                    :style="{ height: h + '%', '--bar-delay': (2.0 + i * 0.015) + 's' }"
                  ></div>
                </div>
                <div class="code">*{{ cleanAmount }}·{{ receiptStamp }}*</div>
              </div>
              <div class="r-footer">
                <div class="thanks">— THANK YOU —</div>
                <div class="sub">感谢使用 FloGold · 每一笔都值得记录</div>
              </div>
              <div class="tear-edge"></div>
            </div>

            <!-- 撕纸提示 -->
            <div ref="tapHintRef" class="tap-hint" :class="{ show: tapHintShow }">
              <span class="bounce-dot"></span>
              <span>点击纸张 → 撕下小票</span>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

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

// ========== 弹窗开关 ==========
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
    resetPhase()
    setTimeout(() => { isOpen.value = true }, 50)
    // POS 弹出动画 (~700ms) 完成后才可交互
    setTimeout(() => { phase.value = 'ready' }, 800)
  } else {
    isOpen.value = false
  }
})

onMounted(() => {
  if (props.show) {
    setTimeout(() => { isOpen.value = true }, 50)
    setTimeout(() => { phase.value = 'ready' }, 800)
  }
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  clearAllTimers()
})

// 物理键盘输入（仅在 ready 阶段响应）
function onKeydown(e: KeyboardEvent) {
  if (!props.show) return
  if (phase.value !== 'ready') {
    // Escape 在非动画阶段也可关闭
    if (e.key === 'Escape' && (phase.value === 'idle' || phase.value === 'ready')) {
      handleClose()
    }
    return
  }
  if (e.key >= '0' && e.key <= '9') {
    handleKeyTap(e.key)
  } else if (e.key === '.') {
    handleKeyTap('.')
  } else if (e.key === 'Backspace') {
    handleKeyTap('⌫')
  } else if (e.key === '00' || (e.key === '0' && e.shiftKey)) {
    handleKeyTap('00')
  } else if (e.key === 'Enter') {
    handleConfirm()
  } else if (e.key === 'Escape') {
    handleClose()
  }
}

// ========== 状态机 ==========
// idle → (show) → ready → lifting → printing → complete → tearing → (close)
type Phase = 'idle' | 'ready' | 'lifting' | 'printing' | 'complete' | 'tearing'
const phase = ref<Phase>('idle')

// 各元素显隐状态
const receiptVisible = ref(false)
const showConnLine = ref(false)
const tearIndicatorShow = ref(false)
const tapHintShow = ref(false)
const scissorsX = ref('translateX(0)')

// 条形码
const barHeights = ref<number[]>([])
const barsReady = ref(false)
const BAR_COUNT = 40

// 纸屑
interface PaperBit { id: number; style: Record<string, string>; fly: boolean }
let bitIdSeq = 0
const paperBits = ref<PaperBit[]>([])

// 计时器收集（便于清理）
const timers: number[] = []
function pushTimeout(fn: () => void, ms: number): number {
  const id = window.setTimeout(fn, ms)
  timers.push(id)
  return id
}
function clearAllTimers() {
  timers.forEach(id => clearTimeout(id))
  timers.length = 0
}

// ========== 计算属性 ==========
const keypadKeys = ['1', '2', '3', '⌫', '4', '5', '6', '+', '7', '8', '9', '-', '.', '0', 'go']

const displayAmount = computed(() => localForm.value.amount || '0')
const displayCategories = computed(() => props.categories.slice(0, 5))

const ledClass = computed(() => {
  if (phase.value === 'printing') return 'printing'
  if (phase.value === 'complete') return 'complete'
  if (phase.value === 'tearing') return ''
  return localForm.value.amount ? 'lcd-on' : ''
})

const exitLedClass = computed(() => {
  if (phase.value === 'printing') return 'printing'
  if (phase.value === 'complete') return 'complete'
  return ''
})

const comboClass = computed(() => {
  if (phase.value === 'lifting' || phase.value === 'printing' || phase.value === 'complete' || phase.value === 'tearing') {
    return { lifted: true, raise: false }
  }
  return { raise: isOpen.value }
})

const receiptClass = computed(() => ({
  // complete 阶段需保持 printing 的 clip-path（完全显示），否则会退回默认裁剪导致小票收回
  printing: phase.value === 'printing' || phase.value === 'complete',
  tearing: phase.value === 'tearing'
}))

const screenTopText = computed(() => {
  return phase.value === 'lifting' ? 'CONNECTING' : 'FloGold · 联机'
})

// 小票动态数据
function pad2(n: number) { return n < 10 ? '0' + n : '' + n }

const now = computed(() => {
  const d = new Date()
  return d
})

const receiptStamp = computed(() => {
  const d = now.value
  return '' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate())
    + pad2(d.getHours()) + pad2(d.getMinutes())
})

const receiptCode = computed(() => 'FG' + receiptStamp.value)

const receiptDateStr = computed(() => {
  const d = now.value
  return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`
})

const receiptTimeStr = computed(() => {
  const d = now.value
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
})

const receiptWeekday = computed(() => {
  const w = now.value.getDay()
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][w]
})

// 金额展示（去掉末尾运算符）
const cleanAmount = computed(() => {
  let a = localForm.value.amount || '0'
  const last = a.slice(-1)
  if (last === '+' || last === '-' || last === '.') a = a.slice(0, -1)
  return a || '0'
})

function barAnim(i: number) {
  return `barcodeGrow 0.4s ${2.0 + i * 0.015}s cubic-bezier(0.5,0,0.5,1) forwards`
}

// ========== 键盘 / 分类 ==========
function handleKeyTap(key: string) {
  if (phase.value !== 'ready') return
  if (key === 'go') {
    handleConfirm()
    return
  }

  let amount = localForm.value.amount
  if (key === '⌫') {
    amount = amount.slice(0, -1)
  } else if (key === '+') {
  } else if (key === '-') {
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
  if (phase.value !== 'ready') return
  localForm.value.category = cat
}

// ========== 核心流程：上滑 → 联机 → 打印 → 完成 ==========
function startLiftFlow() {
  if (phase.value !== 'ready') return
  phase.value = 'lifting'

  // POS 上滑到顶部（CSS .lifted 接管 transform）
  // 0.8s 后显示连接线 + 状态 pill
  pushTimeout(() => {
    showConnLine.value = true
  }, 800)

  // 1.5s 后到达顶部，开始打印
  pushTimeout(() => {
    phase.value = 'printing'

    // 显示小票容器
    receiptVisible.value = true

    // 生成条形码（下一帧触发动画）
    nextTick(() => {
      genBars()
    })

    // 3.5s 后打印完成
    pushTimeout(() => {
      phase.value = 'complete'
      // 撕纸提示淡入
      pushTimeout(() => { tapHintShow.value = true }, 300)
    }, 3500)
  }, 1500)
}

function genBars() {
  const heights: number[] = []
  for (let i = 0; i < BAR_COUNT; i++) {
    heights.push(35 + Math.abs(Math.sin(i * 1.7)) * 60)
  }
  barHeights.value = heights
}

// ========== 撕纸流程 ==========
function triggerTear() {
  if (phase.value !== 'complete') return
  phase.value = 'tearing'
  tapHintShow.value = false

  // 撕纸指示器：剪刀横扫 + 虚线展开
  tearIndicatorShow.value = true
  nextTick(() => {
    scissorsX.value = 'translateX(260px)'
  })

  // 生成纸屑
  spawnPaperBits()

  // 0.4s 后小票执行 tearing 动画（坠落）
  pushTimeout(() => {
    phase.value = 'tearing'
  }, 400)

  // 1.2s 后 POS 回落，隐藏连接线/pill/出纸口状态
  pushTimeout(() => {
    showConnLine.value = false
    tearIndicatorShow.value = false
    scissorsX.value = 'translateX(0)'
  }, 1200)

  // 1.9s 后彻底重置并关闭弹窗
  pushTimeout(() => {
    receiptVisible.value = false
    barsReady.value = false
    barHeights.value = []
    paperBits.value = []
    phase.value = 'idle'
    // 通知父组件关闭弹窗
    emit('close')
  }, 1900)
}

function spawnPaperBits() {
  const bits: PaperBit[] = []
  for (let i = 0; i < 14; i++) {
    const tx = (Math.random() - 0.5) * 80
    const ty = 20 + Math.random() * 30
    const r = (Math.random() - 0.5) * 360
    bits.push({
      id: bitIdSeq++,
      style: {
        left: (Math.random() * 100) + '%',
        top: '0',
        '--tx': tx + 'px',
        '--ty': ty + 'px',
        '--r': r + 'deg'
      } as Record<string, string>,
      fly: false
    })
  }
  paperBits.value = bits
  // 逐个触发飞散
  bits.forEach((b) => {
    const delay = 200 + Math.random() * 100
    pushTimeout(() => {
      const target = paperBits.value.find(x => x.id === b.id)
      if (target) target.fly = true
    }, delay)
  })
}

function handleReceiptClick() {
  if (phase.value !== 'complete') return
  triggerTear()
}

function resetPhase() {
  clearAllTimers()
  phase.value = 'idle'
  receiptVisible.value = false
  showConnLine.value = false
  tearIndicatorShow.value = false
  tapHintShow.value = false
  scissorsX.value = 'translateX(0)'
  barsReady.value = false
  barHeights.value = []
  paperBits.value = []
}

// ========== 确认 / 关闭 ==========
function handleConfirm() {
  if (phase.value !== 'ready') return
  if (!localForm.value.amount || !localForm.value.category) return
  // 先保存数据（保证落库），再启动上滑打印流程
  emit('save', { ...localForm.value })
  startLiftFlow()
}

function handleClose() {
  // 打印流程进行中禁止点击遮罩关闭
  if (phase.value === 'lifting' || phase.value === 'printing' || phase.value === 'complete' || phase.value === 'tearing') return
  isOpen.value = false
  resetPhase()
  setTimeout(() => emit('close'), 300)
}
</script>

<style scoped>
/* Theme tokens */
.pos-modal-overlay {
  --bg: #f5f3ee;
  --ink: #1f1d18;
  --ink-2: #5a5751;
  --ink-3: #9a958b;
  --gold: #d4a574;
  --gold-deep: #8a5f1c;
  --gold-soft: #faf5f0;
  --pos-body: #e8e2d5;
  --pos-body-2: #ddd5c4;
  --pos-key: #faf5ee;
  --pos-key-2: #e8e2d5;
  --pos-key-hi: rgba(255, 255, 255, 0.7);
  --pos-key-lo: rgba(31, 29, 24, 0.18);
  --lcd: #2a8fbc;
  --lcd-bg: #050810;
  --paper: #ffffff;
  --paper-ink: #1f1d18;
  --paper-ink-soft: rgba(31, 29, 24, 0.5);
  --paper-line: rgba(31, 29, 24, 0.18);
  --exp: #d96b3f;
  --exp-2: #b85a32;
  --inc: #4d8a64;
  --inc-2: #2e6644;
  --sans: 'Outfit', 'Noto Sans SC', system-ui, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
}

[data-theme="dark"] .pos-modal-overlay {
  --bg: #1a1815;
  --ink: #f5f3ee;
  --ink-2: #aaa7a0;
  --ink-3: #7a7770;
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

/* ============ POS Combo (移动单元) ============ */
.pos-combo {
  position: relative;
  width: 100%;
  max-width: 380px;
  transform: translateY(calc(100% + 24px));
  transition: transform 0.7s cubic-bezier(.12,.64,.21,1.08);
  filter: drop-shadow(0 -10px 30px rgba(0,0,0,0.4));
}

.pos-combo.raise {
  transform: translateY(0);
}

/* 上滑到顶部：POS 顶部移至 overlay 顶部（留 16px 间距）
   公式：当前顶部位置(100vh - 450 - 24) → 目标 16，故 translateY = 16 - (100vh - 474) = 490 - 100vh */
.pos-combo.lifted {
  transform: translateY(calc(45px - 100vh));
  transition: transform 0.85s cubic-bezier(.22,.61,.36,1);
}

/* ============ POS Machine ============ */
.pos-machine {
  position: relative;
  height: 520px;
  width: 100%;
  z-index: 6;
}

.pos-machine.printing {
  animation: printerShake 0.08s infinite;
}

@keyframes printerShake {
  0%, 100% { transform: translateX(-0.5px); }
  50% { transform: translateX(0.5px); }
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

/* Printer Module */
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

.led.printing {
  background: var(--exp);
  box-shadow: 0 0 10px var(--exp);
  animation: ledBlink 0.5s infinite;
}

.led.complete {
  background: var(--inc);
  box-shadow: 0 0 10px var(--inc);
}

@keyframes ledBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
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

/* LCD Screen */
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

.pos-screen.connecting {
  filter: brightness(0.6);
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

.screen-top span {
  transition: color 0.3s;
}

.screen-connecting {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.conn-ring {
  width: 36px; height: 36px;
  border: 2px solid rgba(212, 165, 116, 0.25);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.conn-ring.r2 {
  position: absolute;
  width: 50px; height: 50px;
  border: 1px solid rgba(212, 165, 116, 0.12);
  border-bottom-color: rgba(212, 165, 116, 0.5);
  animation: spin 1.6s linear infinite reverse;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.conn-text {
  font-size: 8px;
  letter-spacing: 0.2em;
  color: var(--gold);
  font-weight: 700;
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

/* Keypad */
.pos-keypad {
  height: 150px;
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

/* ============ 出纸口模块 ============ */
.printer-exit {
  position: absolute;
  left: 0; right: 0;
  top: 495px;
  height: 58px;
  z-index: 5;
}

.printer-exit.printing {
  animation: printerShake 0.08s infinite;
}

.printer-exit-body {
  width: calc(100% - 40px);
  margin: 0 20px;
  height: 100%;
  background: linear-gradient(180deg, #c5c5c5 0%, #e9e9e9 100%);
  border-radius: 10px;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.40),
    inset 0 -1px 0 rgba(31,29,24,0.18),
    0 2px 6px rgba(31,29,24,0.20);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

[data-theme="dark"] .printer-exit-body {
  background: linear-gradient(180deg, #3a3630 0%, #2a2620 100%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.08),
    inset 0 -1px 0 rgba(0,0,0,0.4),
    0 2px 6px rgba(0,0,0,0.4);
}

.printer-exit-body::before {
  content: 'PRINTER · 出纸口';
  position: absolute;
  top: 4px; left: 50%;
  transform: translateX(-50%);
  font-family: var(--mono);
  font-size: 7px;
  letter-spacing: 0.2em;
  color: rgba(255,255,255,0.30);
  font-weight: 600;
}

.printer-exit-led {
  position: absolute;
  top: 30px; right: 8px;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #444;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.15);
  transition: all 0.3s;
}

.printer-exit-led.printing {
  background: var(--exp);
  box-shadow: 0 0 6px var(--exp);
  animation: ledBlink 0.5s infinite;
}

.printer-exit-led.complete {
  background: var(--inc);
  box-shadow: 0 0 6px var(--inc);
}

.printer-exit-vents {
  position: absolute;
  top: 30px; left: 8px;
  display: flex;
  gap: 1.5px;
}

.printer-exit-vents span {
  width: 1px; height: 7px;
  background: rgba(0,0,0,0.6);
  border-radius: 0.5px;
}

[data-theme="dark"] .printer-exit-vents span {
  background: rgba(255,255,255,0.3);
}

.printer-slot-exit {
  width: 92%;
  height: 8px;
  background: #050505;
  border-radius: 4px;
  box-shadow:
    inset 0 2px 3px rgba(0,0,0,0.9),
    0 1px 0 rgba(255,255,255,0.05);
  position: relative;
  margin-top: 8px;
}

.printer-slot-exit::before {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 160px;
  height: 2px;
  background: #050505;
  box-shadow:
    inset 0 1px 1px rgba(0,0,0,0.9),
    0 1px 0 rgba(255,255,255,0.04);
}

.printer-slot-exit::after {
  content: '';
  position: absolute;
  top: 0;
  left: 4px; right: 4px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent);
}

.slot-glow {
  position: absolute;
  top: 1px; left: 8px; right: 8px;
  height: 5px;
  background: linear-gradient(180deg, rgba(106,184,227,0.15) 0%, transparent 100%);
  border-radius: 3px;
}

/* ============ 联机连接线 & 状态 pill ============ */
.connection-line {
  position: absolute;
  top: 455px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 0;
  background: linear-gradient(180deg, var(--gold) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 4;
}

.connection-line.show {
  height: 50px;
  opacity: 0.4;
  transition: height 0.4s, opacity 0.2s;
}

.status-pill {
  display: none;
  position: absolute;
  top: 458px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 10px;
  background: rgba(15, 25, 35, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid var(--lcd);
  border-radius: 99px;
  font-family: var(--mono);
  font-size: 9px;
  color: var(--lcd);
  letter-spacing: 0.12em;
  font-weight: 600;
  box-shadow: 0 0 12px rgba(106, 184, 227, 0.3);
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 11;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-pill.show { opacity: 1; }

.status-pill .blink-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--lcd);
  animation: pulse 0.7s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* ============ 小票 ============ */
.receipt-wrap {
  position: absolute;
  top: 480px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 40px);
  max-width: 300px;
  z-index: 8;
  perspective: 800px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s 0.6s;
}

.receipt-wrap.visible {
  opacity: 1;
  pointer-events: auto;
}

.receipt {
  background: var(--paper);
  position: relative;
  padding: 14px 16px 12px;
  color: var(--paper-ink);
  box-shadow:
    0 8px 24px rgba(0,0,0,0.18),
    inset 0 0 0 1px rgba(255,255,255,0.4),
    -5px 0 12px rgba(0,0,0,0.08),
    5px 0 12px rgba(0,0,0,0.08);
  font-family: var(--mono);
  transform-origin: 50% 0%;
  will-change: transform, clip-path, opacity;
  clip-path: inset(0 0 100% 0);
  transition:
    clip-path 3.2s cubic-bezier(0.55, 0.085, 0.45, 0.95),
    transform 0.7s cubic-bezier(0.5, 0, 0.5, 1),
    opacity 0.5s ease-out,
    box-shadow 0.5s ease-out;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(31, 29, 24, 0.03) 0.5px, transparent 1px),
    radial-gradient(circle at 75% 75%, rgba(31, 29, 24, 0.03) 0.5px, transparent 1px);
  background-size: 4px 4px;
  cursor: pointer;
}

.receipt.printing {
  clip-path: inset(0 0 0% 0);
}

.receipt.tearing {
  clip-path: inset(0 0 0 0);
  transform: translateY(80px) rotate(-4deg) scale(0.95);
  opacity: 0;
  box-shadow:
    0 30px 50px rgba(0,0,0,0.20),
    -8px 4px 20px rgba(0,0,0,0.15),
    8px 4px 20px rgba(0,0,0,0.15);
}

.tear-edge {
  position: relative;
  height: 8px;
  margin: 4px -16px 0;
  background: var(--paper);
  -webkit-mask: radial-gradient(circle at 4px 4px, #000 4px, transparent 5px) 0 0 / 8px 8px repeat-x;
  mask: radial-gradient(circle at 4px 4px, #000 4px, transparent 5px) 0 0 / 8px 8px repeat-x;
  transform: scaleY(-1);
}

/* Receipt content */
.r-head {
  text-align: center;
  padding: 0 0 6px;
  opacity: 0;
  animation: fadeIn 0.3s 0.1s forwards;
}
.r-head .logo {
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}
.r-head .logo .gold { color: var(--gold-deep); }
.r-head .sub {
  font-size: 7px;
  letter-spacing: 0.12em;
  color: var(--paper-ink-soft);
  margin-top: 1px;
}

.r-time {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  color: var(--paper-ink-soft);
  padding: 3px 0 4px;
  letter-spacing: 0.04em;
  opacity: 0;
  animation: fadeIn 0.3s 0.3s forwards;
}

.r-dot {
  height: 1px;
  background: repeating-linear-gradient(90deg, var(--paper-line) 0, var(--paper-line) 3px, transparent 3px, transparent 6px);
  margin: 5px 0;
  opacity: 0;
  animation: fadeIn 0.3s forwards;
}
.r-dot.d1 { animation-delay: 0.5s; }
.r-dot.d2 { animation-delay: 1.4s; }
.r-dot.d3 { animation-delay: 2.0s; }

.r-cat {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0 6px;
  opacity: 0;
  animation: fadeIn 0.4s 0.7s forwards;
}
.r-cat .ic {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: rgba(0,0,0,0.05);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.r-cat .ic svg {
  width: 12px; height: 12px;
  stroke: #1f1d18; fill: none; stroke-width: 2;
}
.r-cat .text .lab {
  font-size: 7px;
  letter-spacing: 0.18em;
  color: var(--paper-ink-soft);
  text-transform: uppercase;
}
.r-cat .text .val {
  font-family: var(--sans);
  font-size: 11px;
  font-weight: 700;
}

.r-amount {
  text-align: center;
  padding: 8px 0 5px;
  opacity: 0;
  animation: rAmountIn 0.6s 1.0s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes rAmountIn {
  0% { opacity: 0; transform: scale(0.7); }
  100% { opacity: 1; transform: scale(1); }
}
.r-amount > div {
  display: flex;
  justify-content: center;
  align-items: center;
}
.r-amount .cur {
  font-size: 14px;
  color: var(--paper-ink-soft);
  margin-right: 2px;
}
.r-amount .num {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--exp-2);
  line-height: 1;
}
.r-amount.income .num { color: var(--inc-2); }
.r-amount .badge {
  display: inline-block;
  margin-top: 3px;
  padding: 3px 7px;
  background: var(--exp-2);
  color: #fff;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.15;
  text-align: center;
  border-radius: 99px;
  font-family: var(--sans);
}
.r-amount.income .badge { background: var(--inc-2); }

.r-detail {
  opacity: 0;
  animation: fadeIn 0.4s 1.6s forwards;
}
.r-detail-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  font-size: 9.5px;
}
.r-detail-row .lab { color: var(--paper-ink-soft); }
.r-detail-row .val {
  font-weight: 600;
  color: var(--paper-ink);
  max-width: 60%;
  text-align: right;
  font-family: var(--sans);
}

.r-barcode {
  padding: 5px 0 4px;
  opacity: 0;
  animation: fadeIn 0.4s 2.2s forwards;
}
.r-barcode .bars {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 1px;
  height: 22px;
}
.r-barcode .bars div {
  width: 1.4px;
  background: var(--paper-ink);
  transform-origin: bottom;
  transform: scaleY(0);
  animation: barcodeGrow 0.4s var(--bar-delay, 2s) cubic-bezier(0.5, 0, 0.5, 1) forwards;
}
@keyframes barcodeGrow { 0% { transform: scaleY(0); } 100% { transform: scaleY(1); } }
.r-barcode .code {
  text-align: center;
  font-size: 7px;
  letter-spacing: 0.3em;
  color: var(--paper-ink-soft);
  margin-top: 3px;
}

.r-footer {
  text-align: center;
  padding: 4px 0 2px;
  opacity: 0;
  animation: fadeIn 0.4s 2.7s forwards;
}
.r-footer .thanks {
  font-family: var(--sans);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
}
.r-footer .sub {
  font-size: 7px;
  letter-spacing: 0.1em;
  color: var(--paper-ink-soft);
  margin-top: 2px;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* 撕纸指示器 */
.tear-indicator {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 14px;
  pointer-events: none;
  z-index: 20;
  opacity: 0;
  transition: opacity 0.2s;
}
.tear-indicator.show { opacity: 1; }
.tear-indicator .line {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: repeating-linear-gradient(90deg,
    var(--gold) 0, var(--gold) 4px,
    transparent 4px, transparent 8px);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.5s cubic-bezier(0.5, 0, 0.5, 1);
}
.tear-indicator.show .line { transform: scaleX(1); }
.tear-indicator .scissors {
  position: absolute;
  top: -10px; left: 0;
  font-size: 14px;
  transform: translateX(0);
  transition: transform 0.4s cubic-bezier(0.5, 0, 0.5, 1);
  color: var(--gold);
}

/* 纸屑 */
.paper-bits {
  position: absolute;
  top: 0; left: 0; right: 0;
  pointer-events: none;
  z-index: 21;
}
.bit {
  position: absolute;
  width: 3px; height: 3px;
  background: var(--paper);
  border-radius: 1px;
  opacity: 0;
}
.bit.fly {
  animation: bitFly 0.8s forwards;
}
@keyframes bitFly {
  0% { opacity: 0.9; transform: translate(0, 0) rotate(0); }
  100% { opacity: 0; transform: translate(var(--tx), var(--ty)) rotate(var(--r)); }
}

/* 撕纸提示 */
.tap-hint {
  position: absolute;
  bottom: -36px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: var(--ink-2);
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
  white-space: nowrap;
}
.tap-hint.show { opacity: 1; }
.tap-hint .bounce-dot {
  width: 4px; height: 4px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 6px var(--gold);
  animation: bounceDot 1.4s infinite;
}
@keyframes bounceDot {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-3px); }
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
