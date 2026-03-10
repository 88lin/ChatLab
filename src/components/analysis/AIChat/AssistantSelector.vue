<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAssistantStore } from '@/stores/assistant'
import AssistantCard from './AssistantCard.vue'

const { t } = useI18n()

const props = defineProps<{
  chatType: 'group' | 'private'
  locale: string
}>()

const emit = defineEmits<{
  select: [id: string]
  configure: [id: string]
  market: []
}>()

const assistantStore = useAssistantStore()
const { filteredAssistants, isLoaded } = storeToRefs(assistantStore)

watch(
  () => [props.chatType, props.locale],
  ([chatType, locale]) => {
    assistantStore.setFilterContext(chatType as 'group' | 'private', locale as string)
  },
  { immediate: true }
)

onMounted(async () => {
  if (!isLoaded.value) {
    await assistantStore.loadAssistants()
  }
  assistantStore.migrateOldPromptPresets()
})

function handleSelect(id: string) {
  emit('select', id)
}

function handleConfigure(id: string) {
  emit('configure', id)
}
</script>

<template>
  <div class="flex h-full flex-col items-center p-8">
    <div class="flex w-full max-w-4xl flex-col" style="max-height: 100%">
      <!-- 标题 -->
      <div class="mb-8 shrink-0 text-center">
        <h2 class="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">{{ t('ai.assistant.selector.title') }}</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('ai.assistant.selector.subtitle') }}</p>
      </div>

      <!-- 无可用助手提示 -->
      <div v-if="filteredAssistants.length === 0" class="py-8 text-center text-sm text-gray-400">
        {{ t('ai.assistant.selector.noAssistants') }}
      </div>

      <!-- 助手卡片可滚动区域 -->
      <div class="max-h-[40vh] overflow-y-auto pr-1">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AssistantCard
            v-for="assistant in filteredAssistants"
            :key="assistant.id"
            :assistant="assistant"
            @select="handleSelect"
            @configure="handleConfigure"
          />
        </div>
      </div>

      <!-- 管理助手入口 -->
      <div class="mt-6 shrink-0 text-center">
        <button
          class="inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-primary-500 dark:text-gray-500 dark:hover:text-primary-400"
          @click="emit('market')"
        >
          <UIcon name="i-heroicons-cog-6-tooth" class="h-4 w-4" />
          <span>{{ t('ai.assistant.selector.manage') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
