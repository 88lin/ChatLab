<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SQLResult } from './types'

// Props
const props = defineProps<{
  result: SQLResult | null
  error: string | null
}>()

// Emits
const emit = defineEmits<{
  copyCSV: []
}>()

// 表格排序
const sortColumn = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// 排序后的行数据
const sortedRows = computed(() => {
  if (!props.result || !sortColumn.value) {
    return props.result?.rows || []
  }

  const columnIndex = props.result.columns.indexOf(sortColumn.value)
  if (columnIndex === -1) return props.result.rows

  return [...props.result.rows].sort((a, b) => {
    const aVal = a[columnIndex]
    const bVal = b[columnIndex]

    if (aVal === null) return 1
    if (bVal === null) return -1

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal
    }

    const comparison = String(aVal).localeCompare(String(bVal))
    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

// 处理列排序
function handleSort(column: string) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

// 格式化单元格值
function formatCellValue(value: any): string {
  if (value === null) return 'NULL'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// 复制结果到剪贴板（CSV 格式）
async function copyAsCSV() {
  if (!props.result) return

  const header = props.result.columns.join(',')
  const rows = props.result.rows.map((row) =>
    row.map((cell) => (cell === null ? '' : `"${String(cell).replace(/"/g, '""')}"`)).join(',')
  )

  const csv = [header, ...rows].join('\n')

  try {
    await navigator.clipboard.writeText(csv)
    emit('copyCSV')
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 重置排序状态（供父组件调用）
function resetSort() {
  sortColumn.value = null
  sortDirection.value = 'asc'
}

defineExpose({ resetSort })
</script>

<template>
  <div class="flex flex-1 flex-col overflow-hidden">
    <!-- 错误提示 -->
    <div v-if="error" class="border-b border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
      <div class="flex items-start gap-2">
        <UIcon name="i-heroicons-exclamation-circle" class="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-red-800 dark:text-red-200">查询错误</p>
          <p class="mt-1 break-all font-mono text-xs text-red-600 dark:text-red-400">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- 结果统计栏 -->
    <div
      v-if="result"
      class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-800 dark:bg-gray-900"
    >
      <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span>
          <UIcon name="i-heroicons-table-cells" class="mr-1 inline h-4 w-4" />
          {{ result.rowCount }} 行
          <span v-if="result.limited" class="text-yellow-600 dark:text-yellow-400">（已截断至 1000 行）</span>
        </span>
        <span>
          <UIcon name="i-heroicons-clock" class="mr-1 inline h-4 w-4" />
          {{ result.duration }} ms
        </span>
      </div>
      <UButton variant="ghost" size="xs" @click="copyAsCSV">
        <UIcon name="i-heroicons-clipboard-document" class="mr-1 h-4 w-4" />
        复制 CSV
      </UButton>
    </div>

    <!-- 结果表格 -->
    <div v-if="result && result.rows.length > 0" class="flex-1 overflow-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="sticky top-0 bg-gray-100 dark:bg-gray-800">
          <tr>
            <th
              v-for="(column, index) in result.columns"
              :key="index"
              class="cursor-pointer whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
              @click="handleSort(column)"
            >
              <div class="flex items-center gap-1">
                <span>{{ column }}</span>
                <UIcon
                  v-if="sortColumn === column"
                  :name="sortDirection === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                  class="h-3 w-3"
                />
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
          <tr v-for="(row, rowIndex) in sortedRows" :key="rowIndex" class="hover:bg-gray-50 dark:hover:bg-gray-800">
            <td
              v-for="(cell, cellIndex) in row"
              :key="cellIndex"
              class="max-w-xs truncate whitespace-nowrap px-4 py-2 font-mono text-sm text-gray-700 dark:text-gray-300"
              :class="{ 'text-gray-400 italic': cell === null }"
              :title="formatCellValue(cell)"
            >
              {{ formatCellValue(cell) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 空结果 -->
    <div
      v-else-if="result && result.rows.length === 0"
      class="flex flex-1 items-center justify-center text-gray-500 dark:text-gray-400"
    >
      <div class="text-center">
        <UIcon name="i-heroicons-inbox" class="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p class="mt-2 text-sm">查询结果为空</p>
      </div>
    </div>

    <!-- 初始状态 -->
    <div v-else-if="!error" class="flex flex-1 items-center justify-center text-gray-500 dark:text-gray-400">
      <div class="text-center">
        <UIcon name="i-heroicons-command-line" class="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p class="mt-2 text-sm">输入 SQL 语句并运行查看结果</p>
        <p class="mt-1 text-xs text-gray-400">仅支持 SELECT 查询，结果最多返回 1000 行</p>
      </div>
    </div>
  </div>
</template>

