<script setup lang="ts">
import { EditorContent, useEditor, BubbleMenu as TiptapBubbleMenu, VueRenderer } from '@tiptap/vue-3'
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
import { NotionDragHandle } from '../extensions/NotionDragHandle'
import { Columns, Column } from '../extensions/Columns'
import { Callout } from '../extensions/Callout'
import { SlashCommands, slashCommandItems } from '../extensions/SlashCommands'
import BubbleMenuComponent from './BubbleMenu.vue'
import SlashMenu from './SlashMenu.vue'
import tippy from 'tippy.js'
import type { Instance as TippyInstance } from 'tippy.js'

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
  placeholder: "输入 '/' 插入内容...",
  editable: true,
})

const emit = defineEmits<Emits>()

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable,
  extensions: [
    StarterKit.configure({
      history: { depth: 100 },
      codeBlock: { HTMLAttributes: { class: 'code-block' } },
    }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    Highlight.configure({ multicolor: true }),
    TextStyle,
    Color,
    Link.configure({ openOnClick: false }),
    Image.configure({ inline: true, allowBase64: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({ placeholder: props.placeholder }),
    Columns,
    Column,
    Callout,
    NotionDragHandle,
    SlashCommands.configure({
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range })
        },
        items: ({ query }: { query: string }) =>
          slashCommandItems.filter(
            item =>
              item.title.toLowerCase().includes(query.toLowerCase()) ||
              item.description.toLowerCase().includes(query.toLowerCase()),
          ),
        render: () => {
          let component: VueRenderer
          let popup: TippyInstance[]

          return {
            onStart: (props: any) => {
              component = new VueRenderer(SlashMenu, { props, editor: props.editor })
              if (!props.clientRect) return
              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                theme: 'prose-slash',
                arrow: false,
                offset: [0, 6],
              })
            },
            onUpdate(props: any) {
              component.updateProps(props)
              if (!props.clientRect) return
              popup[0].setProps({ getReferenceClientRect: props.clientRect })
            },
            onKeyDown(props: any) {
              if (props.event.key === 'Escape') { popup[0].hide(); return true }
              return (component.ref as any)?.onKeyDown(props.event)
            },
            onExit() {
              popup[0].destroy()
              component.destroy()
            },
          }
        },
      },
    }),
  ],
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    emit('update:modelValue', html)
    emit('update', { html, json: editor.getJSON(), text: editor.getText() })
  },
})

watch(() => props.modelValue, (value) => {
  if (editor.value && value !== editor.value.getHTML()) {
    editor.value.commands.setContent(value, false)
  }
})

watch(() => props.editable, (value) => {
  editor.value?.setEditable(value)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

defineExpose({ editor })

// Only show bubble menu for text selections, not node selections (e.g. drag handle click)
const shouldShowBubble = ({ editor }: any) => {
  const { selection } = editor.state
  if (selection.empty) return false
  if (editor.isActive('codeBlock')) return false
  // NodeSelection has a `.node` property; TextSelection does not
  return !selection.node
}
</script>

<template>
  <div class="prose-editor">
    <EditorContent :editor="editor" />
    <TiptapBubbleMenu
      v-if="editor"
      :editor="editor"
      :tippy-options="{ duration: 100, placement: 'top', theme: 'prose-bubble', arrow: false, offset: [0, 8] }"
      :should-show="shouldShowBubble"
    >
      <BubbleMenuComponent :editor="editor" />
    </TiptapBubbleMenu>
  </div>
</template>

<style scoped>
.prose-editor {
  width: 100%;
  height: 100%;
  position: relative;
}

.prose-editor :deep(.ProseMirror) {
  outline: none;
  min-height: 300px;
  /* left padding makes room for the drag handle */
  padding: 4px 48px 4px 48px;
}

.prose-editor :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
</style>
