// 基础类型定义

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Transform {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
}

export interface PortDefinition {
  /** Unique identifier within the node */
  id: string
  /** Normalized X offset from node center: -0.5 = left edge, 0.5 = right edge */
  dx: number
  /** Normalized Y offset from node center: -0.5 = top edge, 0.5 = bottom edge */
  dy: number
  /** Connection type: 'input' | 'output' | 'both' */
  type?: 'input' | 'output' | 'both'
  /** Optional display label */
  label?: string
}

export interface NodeData {
  id?: string
  x: number
  y: number
  width: number
  height: number
  content: string
  shape?: 'rectangle' | 'circle' | 'diamond' | 'triangle'
  style?: NodeStyle
  ports?: PortDefinition[]
}

export interface NodeStyle {
  fill?: string
  stroke?: string
  strokeWidth?: number
  borderRadius?: number
  fontSize?: number
  fontColor?: string
  fontFamily?: string
  shadowBlur?: number
  shadowColor?: string
  shadowOffsetX?: number
  shadowOffsetY?: number
  opacity?: number
  shape?: 'rectangle' | 'circle' | 'diamond' | 'triangle'
  /** Gradient border: two colors for a linear gradient stroke, e.g. ['#ff0000', '#0000ff'] */
  strokeGradient?: [string, string]
}

export interface EdgeData {
  id?: string
  from: string
  to: string
  label?: string
  waypoints?: Point[]
  style?: EdgeStyle
}

/**
 * Preset dash patterns for edges.
 * 'solid'     — no dash (default)
 * 'dashed'    — standard dash  [8, 4]
 * 'dotted'    — dots           [2, 4]
 * 'long-dash' — long dash      [16, 6]
 * 'dot-dash'  — dot-dash       [8, 4, 2, 4]
 */
export type DashPreset = 'solid' | 'dashed' | 'dotted' | 'long-dash' | 'dot-dash'

export interface EdgeStyle {
  stroke?: string
  strokeWidth?: number
  strokeDasharray?: string
  /** Named dash preset (takes priority over strokeDasharray when set) */
  dashPreset?: DashPreset
  arrowType?: 'arrow' | 'circle' | 'diamond' | 'none'
  arrowSize?: number
  opacity?: number
  lineStyle?: 'straight' | 'curved' | 'orthogonal'
  useSmartRouting?: boolean
}

export interface PortData {
  id: string
  nodeId: string
  position: 'top' | 'right' | 'bottom' | 'left'
  type: 'input' | 'output' | 'both'
}

export type EventCallback = (...args: any[]) => void

export interface IGraphicObject {
  id: string
  type: string
  transform: Transform
  visible: boolean

  draw(ctx: CanvasRenderingContext2D): void
  hitTest(x: number, y: number): boolean
  getBounds(): Rect
  clone(): IGraphicObject
}

export interface ICommand {
  execute(): void
  undo(): void
}

export interface LayoutOptions {
  nodeSpacing?: number
  rankSpacing?: number
  animate?: boolean
}
