import { Node, mergeAttributes } from '@tiptap/core'
import type { Command } from '@tiptap/core'

export interface CalloutOptions {
  HTMLAttributes: Record<string, any>
  types: string[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (type?: string) => ReturnType
      toggleCallout: (type?: string) => ReturnType
    }
  }
}

export const Callout = Node.create<CalloutOptions>({
  name: 'callout',

  group: 'block',

  content: 'block+',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      types: ['info', 'warning', 'success', 'error', 'note'],
    }
  },

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-callout-type'),
        renderHTML: (attributes) => {
          return {
            'data-callout-type': attributes.type,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'callout',
        class: `callout callout-${HTMLAttributes['data-callout-type'] || 'info'}`,
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setCallout:
        (type: string = 'info'): Command =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { type },
            content: [{ type: 'paragraph' }],
          })
        },
      toggleCallout:
        (type: string = 'info'): Command =>
        ({ commands }) => {
          return commands.toggleWrap(this.name, { type })
        },
    }
  },
})
