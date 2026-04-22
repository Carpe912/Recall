<script setup lang="ts">
import { EditorContent, useEditor, BubbleMenu as TiptapBubbleMenu, VueRenderer } from '@tiptap/vue-3'
import { onBeforeUnmount, watch } from 'vue'
import StarterKit from '@tiptap/starter-kit'
import Paragraph from '@tiptap/extension-paragraph'
import Heading from '@tiptap/extension-heading'
import Blockquote from '@tiptap/extension-blockquote'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
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
import BubbleMenu from '@tiptap/extension-bubble-menu'
import { Columns, Column } from '../extensions/Columns'
import { Callout } from '../extensions/Callout'
import { SlashCommands, slashCommandItems } from '../extensions/SlashCommands'
import { NotionDragHandle } from '../extensions/NotionDragHandle'
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
  placeholder: '开始输入...',
  editable: true,
})

const emit = defineEmits<Emits>()

const DraggableParagraph = Paragraph.extend({ draggable: true })
const DraggableHeading = Heading.extend({ draggable: true })
const DraggableBlockquote = Blockquote.extend({ draggable: true })
const DraggableBulletList = BulletList.extend({ draggable: true })
const DraggableOrderedList = OrderedList.extend({ draggable: true })
const DraggableListItem = ListItem.extend({ draggable: true })
const DraggableTaskItem = TaskItem.extend({ draggable: true })

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
      paragraph: false,
      heading: false,
      blockquote: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
    }),
    DraggableParagraph,
    DraggableHeading,
    DraggableBlockquote,
    DraggableBulletList,
    DraggableOrderedList,
    DraggableListItem,
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
    DraggableTaskItem.configure({
      nested: true,
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    BubbleMenu,
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
        items: ({ query }: { query: string }) => {
          return slashCommandItems.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
          )
        },
        render: () => {
          let component: VueRenderer
          let popup: TippyInstance[]

          return {
            onStart: (props: any) => {
              component = new VueRenderer(SlashMenu, {
                props,
                editor: props.editor,
              })

              if (!props.clientRect) {
                return
              }

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              })
            },

            onUpdate(props: any) {
              component.updateProps(props)

              if (!props.clientRect) {
                return
              }

              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              })
            },

            onKeyDown(props: any) {
              if (props.event.key === 'Escape') {
                popup[0].hide()
                return true
              }

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
    <TiptapBubbleMenu
      v-if="editor"
      :editor="editor"
      :tippy-options="{ duration: 100 }"
      :should-show="({ editor, from, to }) => {
        return from !== to && !editor.isActive('codeBlock')
      }"
    >
      <BubbleMenuComponent :editor="editor" />
    </TiptapBubbleMenu>
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
  padding: 16px 16px 16px 44px;
}

.prose-editor :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
</style>
