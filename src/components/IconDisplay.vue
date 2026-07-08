<template>
  <component :is="iconComponent" :size="size" :stroke-width="strokeWidth" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import * as LucideIcons from '@lucide/vue'

const props = withDefaults(defineProps<{
  icon: string
  size?: number
  strokeWidth?: number
}>(), {
  size: 24,
  strokeWidth: 2
})

const iconComponent = computed(() => {
  const name = props.icon
  // Try exact match first
  const exact = (LucideIcons as Record<string, any>)[name]
  if (exact) return exact
  // Try with "Icon" suffix (some icons have both forms)
  const withSuffix = (LucideIcons as Record<string, any>)[name + 'Icon']
  if (withSuffix) return withSuffix
  // Fallback to Package icon
  return LucideIcons.Package
})
</script>
