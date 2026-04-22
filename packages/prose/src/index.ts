export { default as ProseEditor } from './components/ProseEditor.vue'
export { default as ProseEditorComponent } from './components/ProseEditorComponent.vue'
export { default as Toolbar } from './components/Toolbar.vue'
export { default as BubbleMenu } from './components/BubbleMenu.vue'
export { default as SlashMenu } from './components/SlashMenu.vue'
export { ProseEditor as ProseEditorClass } from './ProseEditor'
export type { ProseEditorOptions } from './ProseEditor'
export { Columns, Column } from './extensions/Columns'
export { Callout } from './extensions/Callout'
export { SlashCommands, slashCommandItems } from './extensions/SlashCommands'
export type { SlashCommandItem } from './extensions/SlashCommands'

// Import styles
import './styles/editor.css'
import 'tippy.js/dist/tippy.css'

