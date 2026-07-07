import { ref, watch, onMounted, type Ref, onScopeDispose } from 'vue'
import type { Directive } from 'vue'
import { useReducedMotion } from 'motion-v'

/**
 * 动效工具集合 —— 暖色拟物记账 App 专用
 * 美学：精致克制（spring 缓动为主，错峰入场，无炫技）
 */

// 统一的 spring 预设，保证全 App 动效手感一致
export const springs = {
  // 通用柔顺 spring（按钮、卡片悬浮）
  soft: { type: 'spring' as const, stiffness: 320, damping: 30, mass: 0.8 },
  // 轻盈弹跳（小图标、徽章、tag）
  pop: { type: 'spring' as const, stiffness: 420, damping: 22, mass: 0.6 },
  // 大块位移/页面切换（更稳，少过冲）
  steady: { type: 'spring' as const, stiffness: 220, damping: 32, mass: 1 },
  // 强调退出（FAB 旋转、删除）
  snap: { type: 'spring' as const, stiffness: 500, damping: 28, mass: 0.5 },
} as const

// 统一错峰入场延迟（毫秒），用于 stagger
export const STAGGER_STEP = 55


/**
 * 数字滚动 count-up
 * 跟随 source 变化平滑过渡到目标值（flush:sync 保证增删数据时也滚动）
 */
export function useCountUp(
  source: Ref<number>,
  opts: { duration?: number; decimals?: number; immediate?: boolean; from?: number } = {},
) {
  const { duration = 800, decimals = 2, immediate = false, from: fromOpt } = opts
  // immediate 模式：初始从 fromOpt(默认 0) 开始，挂载后滚到 source
  const display = ref(immediate ? (fromOpt ?? 0) : source.value)

  let raf = 0
  let from = display.value
  let start = 0

  function tick(now: number) {
    const t = Math.min(1, (now - start) / duration)
    // easeOutExpo：前快后慢，金融数字观感自然
    const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
    display.value = from + (source.value - from) * eased
    if (t < 1) {
      raf = requestAnimationFrame(tick)
    } else {
      display.value = source.value
    }
  }

  function run(target: number) {
    cancelAnimationFrame(raf)
    // 目标与当前显示值相同则无需动画（避免无谓 raf）
    if (Math.abs(target - display.value) < 0.005) {
      display.value = target
      return
    }
    from = display.value
    start = performance.now()
    raf = requestAnimationFrame(tick)
  }

  // flush:'sync' 保证 source 变化立即触发动画，
  // 不受组件渲染节流 / 弹窗过渡影响（新增/删除记账时也能可靠滚动）
  watch(
    source,
    (target) => run(target),
    { flush: 'sync' },
  )

  // immediate：挂载后从 fromOpt 滚到当前值
  if (immediate) {
    onMounted(() => run(source.value))
  }

  onScopeDispose(() => cancelAnimationFrame(raf))

  // 格式化助手：保留小数 + 千分位
  function format(min: number = decimals, max: number = decimals) {
    return display.value.toLocaleString('zh-CN', {
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    })
  }

  return { display, format }
}

/**
 * 滚动揭示 —— IntersectionObserver
 * 元素进入视口时触发一次性入场动画
 * 自动降级（reduced-motion / 不支持 IO 时直接可见）
 */
export function useReveal<T extends HTMLElement = HTMLElement>(
  opts: { threshold?: number; rootMargin?: string; once?: boolean } = {},
) {
  const { threshold = 0.12, rootMargin = '0px 0px -8% 0px', once = true } = opts
  const el = ref<T | null>(null)
  const shown = ref(false)
  const reduced = useReducedMotion()

  let observer: IntersectionObserver | null = null

  function setup() {
    if (!el.value) return
    if (reduced.value || typeof IntersectionObserver === 'undefined') {
      shown.value = true
      return
    }
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            shown.value = true
            if (once && observer) {
              observer.disconnect()
              observer = null
            }
          } else if (!once) {
            shown.value = false
          }
        }
      },
      { threshold, rootMargin },
    )
    observer.observe(el.value)
  }

  onMounted(setup)
  onScopeDispose(() => observer?.disconnect())

  return { el, shown }
}

/**
 * 滚动揭示指令 v-reveal
 * 元素进入视口时添加 .reveal-in 类触发 CSS 过渡
 * 用法: <section v-reveal class="reveal">...</section>
 */
export const vReveal: Directive<HTMLElement> = {
  mounted(el, binding) {
    const reduced = useReducedMotion()
    const once = binding.modifiers.repeat ? false : true
    el.classList.add('reveal-prepare')

    if (reduced.value || typeof IntersectionObserver === 'undefined') {
      el.classList.add('reveal-in')
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add('reveal-in')
            if (once) io.disconnect()
          } else if (!once) {
            el.classList.remove('reveal-in')
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    // 存储以便卸载时清理
    ;(el as any).__revealIO = io
  },
  unmounted(el) {
    const io = (el as any).__revealIO as IntersectionObserver | undefined
    io?.disconnect()
  },
}
