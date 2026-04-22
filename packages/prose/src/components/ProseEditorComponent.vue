<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { onBeforeUnmount, watch } from 'vue'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import { Columns, Column } from '../extensions/Columns'
import { Callout } from '../extensions/Callout'

interface Props {
  modelValue?: string
  placeholder?: string
  editable?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'update', value: { html: string; json: object; text: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '开始输入...',
  editable: true,
})

const emit = defineEmits<Emits>()

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable,
  extensions: [
    StarterKit.configure({
      history: {
        depth: 100,
      },
      codeBlock: {
        HTMLAttributes: {
          class: 'code-block',
        },
      },
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    Highlight.configure({
      multicolor: true,
    }),
    TextStyle,
    Color,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'link',
      },
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Columns,
    Column,
    Callout,
  ],
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    emit('update:modelValue', html)
    emit('update', {
      html,
      json: editor.getJSON(),
      text: editor.getText(),
    })
  },
})

watch(() => props.modelValue, (value) => {
  if (editor.value && value !== editor.value.getHTML()) {
    editor.value.commands.setContent(value, false)
  }
})

watch(() => props.editable, (value) => {
  if (editor.value) {
    editor.value.setEditable(value)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

defineExpose({
  editor,
})
</script>

<template>
  <div class="prose-editor">
    <EditorContent :editor="editor" />
  </div>
</template>

<style scoped>
.prose-editor {
  width: 100%;
  height: 100%;
}

.prose-editor :deep(.ProseMirror) {
  outline: none;
  min-height: 200px;
  padding: 12px;
}

.prose-editor :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
</style>
