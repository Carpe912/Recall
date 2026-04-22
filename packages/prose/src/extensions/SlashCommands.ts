import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import type { SuggestionOptions } from '@tiptap/suggestion'

export interface SlashCommandItem {
  title: string
  description: string
  icon: string
  command: (props: { editor: any; range: any }) => void
}

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range })
        },
      } as Partial<SuggestionOptions>,
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

export const slashCommandItems: SlashCommandItem[] = [
  {
    title: '标题 1',
    description: '大标题',
    icon: 'H1',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
    },
  },
  {
    title: '标题 2',
    description: '中标题',
    icon: 'H2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
    },
  },
  {
    title: '标题 3',
    description: '小标题',
    icon: 'H3',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
    },
  },
  {
    title: '无序列表',
    description: '创建无序列表',
    icon: '•',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: '有序列表',
    description: '创建有序列表',
    icon: '1.',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: '任务列表',
    description: '创建任务列表',
    icon: '☑',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: '引用块',
    description: '插入引用块',
    icon: '❝',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: '代码块',
    description: '插入代码块',
    icon: '</>',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: '分割线',
    description: '插入分割线',
    icon: '—',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: '表格',
    description: '插入表格',
    icon: '⊞',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    },
  },
  {
    title: '2 栏布局',
    description: '插入 2 栏布局',
    icon: '⫿',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setColumns(2).run()
    },
  },
  {
    title: '3 栏布局',
    description: '插入 3 栏布局',
    icon: '⫾',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setColumns(3).run()
    },
  },
  {
    title: '信息块',
    description: '插入信息提示块',
    icon: 'ℹ',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCallout('info').run()
    },
  },
  {
    title: '警告块',
    description: '插入警告提示块',
    icon: '⚠',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCallout('warning').run()
    },
  },
  {
    title: '成功块',
    description: '插入成功提示块',
    icon: '✓',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCallout('success').run()
    },
  },
  {
    title: '错误块',
    description: '插入错误提示块',
    icon: '✗',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCallout('error').run()
    },
  },
  {
    title: '笔记块',
    description: '插入笔记块',
    icon: '📝',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCallout('note').run()
    },
  },
]
