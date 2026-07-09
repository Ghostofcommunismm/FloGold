<template>
  <component 
    v-if="isLucideIcon" 
    :is="iconComponent" 
    :size="size" 
    :stroke-width="strokeWidth"
    :color="color"
  />
  <span v-else class="emoji-icon">{{ icon }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import * as lucideIcons from '../utils/icons'

interface Props {
  icon: string // 可以是emoji或Lucide图标名称
  size?: number
  strokeWidth?: number
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  strokeWidth: 1.6,
  color: 'currentColor'
})

// 判断是否为emoji（包含Unicode emoji字符）
const isLucideIcon = computed(() => {
  // 如果是Lucide图标名称（纯英文字母）
  if (/^[A-Z][a-zA-Z0-9]*$/.test(props.icon)) {
    return true
  }
  // 如果是emoji（包含Unicode字符）
  return false
})

// 获取Lucide图标组件
const iconComponent = computed(() => {
  if (isLucideIcon.value && lucideIcons[props.icon]) {
    return lucideIcons[props.icon]
  }
  return lucideIcons.Package // 默认图标
})
</script>

<style scoped>
.emoji-icon {
  font-size: inherit;
  line-height: 1;
}
</style>