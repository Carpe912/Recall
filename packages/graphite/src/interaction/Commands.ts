import type { ICommand, Point } from '../types'
import type { Node } from '../core/Node'
import type { Edge } from '../core/Edge'

// 移动命令
export class MoveCommand implements ICommand {
  private nodes: Node[]
  private oldPositions: Point[]
  private newPositions: Point[]

  constructor(nodes: Node[], dx: number, dy: number) {
    this.nodes = nodes
    this.oldPositions = nodes.map(node => ({
      x: node.transform.x,
      y: node.transform.y,
    }))
    this.newPositions = nodes.map(node => ({
      x: node.transform.x + dx,
      y: node.transform.y + dy,
    }))
  }

  execute(): void {
    this.nodes.forEach((node, i) => {
      node.setPosition(this.newPositions[i].x, this.newPositions[i].y)
    })
  }

  undo(): void {
    this.nodes.forEach((node, i) => {
      node.setPosition(this.oldPositions[i].x, this.oldPositions[i].y)
    })
  }
}

// 创建节点命令
export class CreateNodeCommand implements ICommand {
  private node: Node
  private nodes: Node[]

  constructor(node: Node, nodes: Node[]) {
    this.node = node
    this.nodes = nodes
  }

  execute(): void {
    if (!this.nodes.includes(this.node)) {
      this.nodes.push(this.node)
    }
  }

  undo(): void {
    const index = this.nodes.indexOf(this.node)
    if (index !== -1) {
      this.nodes.splice(index, 1)
    }
  }
}

// 删除节点命令
export class DeleteNodeCommand implements ICommand {
  private node: Node
  private nodes: Node[]
  private index: number

  constructor(node: Node, nodes: Node[]) {
    this.node = node
    this.nodes = nodes
    this.index = nodes.indexOf(node)
  }

  execute(): void {
    const index = this.nodes.indexOf(this.node)
    if (index !== -1) {
      this.nodes.splice(index, 1)
    }
  }

  undo(): void {
    this.nodes.splice(this.index, 0, this.node)
  }
}

// 创建边命令
export class CreateEdgeCommand implements ICommand {
  private edge: Edge
  private edges: Edge[]

  constructor(edge: Edge, edges: Edge[]) {
    this.edge = edge
    this.edges = edges
  }

  execute(): void {
    if (!this.edges.includes(this.edge)) {
      this.edges.push(this.edge)
    }
  }

  undo(): void {
    const index = this.edges.indexOf(this.edge)
    if (index !== -1) {
      this.edges.splice(index, 1)
    }
  }
}

// 删除边命令
export class DeleteEdgeCommand implements ICommand {
  private edge: Edge
  private edges: Edge[]
  private index: number

  constructor(edge: Edge, edges: Edge[]) {
    this.edge = edge
    this.edges = edges
    this.index = edges.indexOf(edge)
  }

  execute(): void {
    const index = this.edges.indexOf(this.edge)
    if (index !== -1) {
      this.edges.splice(index, 1)
    }
  }

  undo(): void {
    this.edges.splice(this.index, 0, this.edge)
  }
}
