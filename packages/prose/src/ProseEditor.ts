import { Editor, EditorOptions } from '@tiptap/core'
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
import { Columns, Column } from './extensions/Columns'
import { Callout } from './extensions/Callout'

export interface ProseEditorOptions extends Partial<EditorOptions> {
  placeholder?: string
  editable?: boolean
}

export class ProseEditor {
  private editor: Editor | null = null

  constructor(options: ProseEditorOptions = {}) {
    const {
      placeholder = '开始输入...',
      editable = true,
      ...editorOptions
    } = options

    this.editor = new Editor({
      editable,
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
          placeholder,
        }),
        Columns,
        Column,
        Callout,
      ],
      ...editorOptions,
    })
  }

  getEditor(): Editor | null {
    return this.editor
  }

  destroy(): void {
    this.editor?.destroy()
    this.editor = null
  }

  setContent(content: string | object): void {
    this.editor?.commands.setContent(content)
  }

  getHTML(): string {
    return this.editor?.getHTML() || ''
  }

  getJSON(): object {
    return this.editor?.getJSON() || {}
  }

  getText(): string {
    return this.editor?.getText() || ''
  }

  focus(): void {
    this.editor?.commands.focus()
  }

  blur(): void {
    this.editor?.commands.blur()
  }

  setEditable(editable: boolean): void {
    this.editor?.setEditable(editable)
  }

  isEmpty(): boolean {
    return this.editor?.isEmpty || true
  }
}
