<script setup lang="ts">
import { computed } from 'vue'

export interface RankItem {
  id: string
  name: string
  value: number
  percentage: number
}

interface Props {
  members: RankItem[]
  showAvatar?: boolean
  rankLimit?: number // 限制显示数量，0 表示不限制
  unit?: string // 单位名称，默认"条"
}

const props = withDefaults(defineProps<Props>(), {
  showAvatar: false,
  rankLimit: 0,
  unit: '条',
})

const displayMembers = computed(() => {
  return props.rankLimit > 0 ? props.members.slice(0, props.rankLimit) : props.members
})

// 获取相对于第一名的百分比
function getRelativePercentage(index: number): number {
  if (displayMembers.value.length === 0) return 0
  const maxValue = displayMembers.value[0].value
  if (maxValue === 0) return 0
  return Math.round((displayMembers.value[index].value / maxValue) * 100)
}

// 获取排名样式
function getRankStyle(index: number): string {
  if (index === 0) return 'bg-linear-to-r from-amber-400 to-orange-500 text-white'
  if (index === 1) return 'bg-linear-to-r from-gray-300 to-gray-400 text-white'
  if (index === 2) return 'bg-linear-to-r from-amber-600 to-amber-700 text-white'
  return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
}

// 获取进度条颜色
function getBarColor(index: number): string {
  const colors = [
    'from-amber-400 to-orange-500',
    'from-gray-300 to-gray-400',
    'from-amber-600 to-amber-700',
    'from-pink-400 to-pink-600',
    'from-pink-300 to-rose-500',
    'from-cyan-400 to-blue-500',
    'from-green-400 to-emerald-500',
    'from-rose-400 to-pink-500',
  ]
  return colors[index % colors.length]
}
</script>

<template>
  <div class="divide-y divide-gray-100 dark:divide-gray-800">
    <div
      v-for="(member, index) in displayMembers"
      :key="member.id"
      class="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
    >
      <!-- 排名 -->
      <div
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        :class="getRankStyle(index)"
      >
        {{ index + 1 }}
      </div>

      <!-- 头像占位 -->
      <div
        v-if="showAvatar"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-pink-100 to-rose-100 text-sm font-medium text-pink-600 dark:from-pink-900/30 dark:to-rose-900/30 dark:text-pink-400"
      >
        {{ member.name.slice(0, 1) }}
      </div>

      <!-- 名字 -->
      <div class="w-32 shrink-0">
        <p class="truncate font-medium text-gray-900 dark:text-white">
          {{ member.name }}
        </p>
      </div>

      <!-- 进度条 -->
      <div class="flex flex-1 items-center">
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            class="h-full rounded-full bg-linear-to-r transition-all"
            :class="getBarColor(index)"
            :style="{ width: `${getRelativePercentage(index)}%` }"
          />
        </div>
      </div>

      <!-- 数值和百分比 -->
      <div class="flex shrink-0 items-baseline gap-2">
        <span class="text-lg font-bold text-gray-900 dark:text-white">{{ member.value }}</span>
        <span class="text-sm text-gray-500">{{ unit }} ({{ member.percentage }}%)</span>
      </div>
    </div>
  </div>
</template>
