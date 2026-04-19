// 主编辑器
export { GraphiteEditor } from './GraphiteEditor'

// 核心对象
export { Node } from './core/Node'
export { Edge } from './core/Edge'
export { Group } from './core/Group'
export { Port } from './core/Port'
export { GraphicObject } from './core/GraphicObject'
export { CustomNode } from './core/CustomNode'
export { NodeRegistry } from './core/NodeRegistry'

// 渲染系统
export { Renderer } from './renderer/Renderer'
export { Camera } from './renderer/Camera'

// 交互系统
export { SelectionManager } from './interaction/SelectionManager'
export { DragManager } from './interaction/DragManager'
export { CommandManager, CompoundCommand } from './interaction/CommandManager'

// 工具
export { EventEmitter } from './utils/EventEmitter'
export { Animator } from './utils/Animator'
export { LayoutEngine } from './utils/LayoutEngine'
export * from './utils/geometry'

// 协作
export { CollaborationProvider } from './collaboration/CollaborationProvider'
export type { CollaborationOptions } from './collaboration/CollaborationProvider'

// 类型
export type {
  Point,
  Rect,
  Transform,
  NodeData,
  NodeStyle,
  EdgeData,
  EdgeStyle,
  DashPreset,
  PortData,
  PortDefinition,
  IGraphicObject,
  ICommand,
  LayoutOptions,
} from './types'
export type { LayoutOptions as LayoutEngineOptions } from './utils/LayoutEngine'
export type { CustomNodeData, RenderContext, CustomRenderFunction } from './core/CustomNode'
export type { NodeTypeDefinition, EditableConfig } from './core/NodeRegistry'
