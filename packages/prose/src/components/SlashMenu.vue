<template>
  <div class="slash-menu" v-if="items.length > 0">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="slash-menu-item"
      :class="{ 'is-selected': index === selectedIndex }"
      @click="selectItem(index)"
    >
      <div class="slash-menu-icon">{{ item.icon }}</div>
      <div class="slash-menu-content">
        <div class="slash-menu-title">{{ item.title }}</div>
        <div class="slash-menu-description">{{ item.description }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SlashCommandItem } from '../extensions/SlashCommands'

const props = defineProps<{
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
}>()

const selectedIndex = ref(0)

watch(() => props.items, () => {
  selectedIndex.value = 0
})

const selectItem = (index: number) => {
  const item = props.items[index]
  if (item) {
    props.command(item)
  }
}

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedIndex.value = ((selectedIndex.value + props.items.length - 1) % props.items.length)
    return true
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedIndex.value = ((selectedIndex.value + 1) % props.items.length)
    return true
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    selectItem(selectedIndex.value)
    return true
  }

  return false
}

defineExpose({ onKeyDown })
</script>

<style scoped>
.slash-menu {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 4px;
  max-height: 400px;
  overflow-y: auto;
  min-width: 280px;
}

.slash-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.slash-menu-item:hover,
.slash-menu-item.is-selected {
  background: #f5f5f5;
}

.slash-menu-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #495057;
  flex-shrink: 0;
}

.slash-menu-content {
  flex: 1;
  min-width: 0;
}

.slash-menu-title {
  font-size: 14px;
  font-weight: 500;
  color: #212529;
  margin-bottom: 2px;
}

.slash-menu-description {
  font-size: 12px;
  color: #6c757d;
}
</style>
