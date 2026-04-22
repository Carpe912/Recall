import { Editor, EditorOptions } from '@tiptap/core'
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
import { Columns, Column } from './extensions/Columns'
import { Callout } from './extensions/Callout'
import { NotionDragHandle } from './extensions/NotionDragHandle'

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

    const DraggableParagraph = Paragraph.extend({ draggable: true })
    const DraggableHeading = Heading.extend({ draggable: true })
    const DraggableBlockquote = Blockquote.extend({ draggable: true })
    const DraggableBulletList = BulletList.extend({ draggable: true })
    const DraggableOrderedList = OrderedList.extend({ draggable: true })
    const DraggableListItem = ListItem.extend({ draggable: true })
    const DraggableTaskItem = TaskItem.extend({ draggable: true })

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
          placeholder,
        }),
        BubbleMenu,
        Columns,
        Column,
        Callout,
        NotionDragHandle,
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
