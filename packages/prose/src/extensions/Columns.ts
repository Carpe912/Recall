import { Node, mergeAttributes } from '@tiptap/core'
import type { Command } from '@tiptap/core'

export interface ColumnsOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columns: {
      setColumns: (count?: number) => ReturnType
    }
  }
}

export const Columns = Node.create<ColumnsOptions>({
  name: 'columns',

  group: 'block',

  content: 'column+',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="columns"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'columns',
        class: 'columns-container',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setColumns:
        (count: number = 2): Command =>
        ({ commands }) => {
          const columns = []
          for (let i = 0; i < count; i++) {
            columns.push({
              type: 'column',
              content: [{ type: 'paragraph' }],
            })
          }
          return commands.insertContent({
            type: this.name,
            content: columns,
          })
        },
    }
  },
})

export interface ColumnOptions {
  HTMLAttributes: Record<string, any>
}

export const Column = Node.create<ColumnOptions>({
  name: 'column',

  content: 'block+',

  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="column"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'column',
        class: 'column',
      }),
      0,
    ]
  },
})
