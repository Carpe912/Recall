<script setup lang="ts">
import { ref } from 'vue'
import ProseEditorComponent from './ProseEditorComponent.vue'
import Toolbar from './Toolbar.vue'

interface Props {
  modelValue?: string
  placeholder?: string
  editable?: boolean
  showToolbar?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'update', value: { html: string; json: object; text: string }): void
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '开始输入...',
  editable: true,
  showToolbar: true,
})

const emit = defineEmits<Emits>()

const editorRef = ref<InstanceType<typeof ProseEditorComponent>>()

const handleUpdate = (value: { html: string; json: object; text: string }) => {
  emit('update', value)
}

defineExpose({
  editor: editorRef,
})
</script>

<template>
  <div class="prose-wrapper">
    <Toolbar v-if="showToolbar" :editor="editorRef?.editor" />
    <ProseEditorComponent
      ref="editorRef"
      :model-value="modelValue"
      :placeholder="placeholder"
      :editable="editable"
      @update:model-value="(val) => emit('update:modelValue', val)"
      @update="handleUpdate"
    />
  </div>
</template>

<style scoped>
.prose-wrapper {
  display: flex;
  flex-direction: column;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}
</style>
