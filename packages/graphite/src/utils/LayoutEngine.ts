import type { Node } from '../core/Node'
import type { Edge } from '../core/Edge'

export type LayoutType = 'grid' | 'hierarchical' | 'force' | 'circular' | 'tree'

export interface LayoutOptions {
  type: LayoutType
  spacing?: number
  padding?: number
  iterations?: number
}

export class LayoutEngine {
  // 网格布局
  static gridLayout(nodes: Node[], options: LayoutOptions = { type: 'grid' }): void {
    const { spacing = 200, padding = 100 } = options
    const cols = Math.ceil(Math.sqrt(nodes.length))

    nodes.forEach((node, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      node.setPosition(col * spacing + padding, row * spacing + padding)
    })
  }

  // 层次布局（适合有向无环图）
  static hierarchicalLayout(nodes: Node[], edges: Edge[], options: LayoutOptions = { type: 'hierarchical' }): void {
    const { spacing = 200, padding = 100 } = options

    // 构建邻接表
    const outEdges = new Map<string, string[]>()
    const inDegree = new Map<string, number>()

    nodes.forEach(n => {
      outEdges.set(n.id, [])
      inDegree.set(n.id, 0)
    })

    edges.forEach(edge => {
      if (outEdges.has(edge.fromNodeId)) {
        outEdges.get(edge.fromNodeId)!.push(edge.toNodeId)
      }
      if (inDegree.has(edge.toNodeId)) {
        inDegree.set(edge.toNodeId, (inDegree.get(edge.toNodeId) || 0) + 1)
      }
    })

    // BFS 拓扑排序分层
    const layers: string[][] = []
    const visited = new Set<string>()
    const queue: string[] = []

    // 找出所有根节点（无入边）
    nodes.forEach(n => {
      if ((inDegree.get(n.id) || 0) === 0) {
        queue.push(n.id)
      }
    })

    // 处理孤立节点
    if (queue.length === 0 && nodes.length > 0) {
      queue.push(nodes[0].id)
    }

    let currentLayer = [...queue]
    queue.forEach(id => visited.add(id))

    while (currentLayer.length > 0) {
      layers.push(currentLayer)
      const nextLayer: string[] = []

      currentLayer.forEach(nodeId => {
        const neighbors = outEdges.get(nodeId) || []
        neighbors.forEach(neighborId => {
          if (!visited.has(neighborId)) {
            visited.add(neighborId)
            nextLayer.push(neighborId)
          }
        })
      })

      currentLayer = nextLayer
    }

    // 添加未被访问的节点（有环情况）
    const unvisited = nodes.filter(n => !visited.has(n.id))
    if (unvisited.length > 0) {
      layers.push(unvisited.map(n => n.id))
    }

    // 分配位置
    const nodeMap = new Map<string, Node>()
    nodes.forEach(n => nodeMap.set(n.id, n))

    const verticalSpacing = spacing * 0.8
    layers.forEach((layer, layerIndex) => {
      const layerWidth = (layer.length - 1) * spacing
      const startX = padding - layerWidth / 2 + 300 // 水平居中偏移

      layer.forEach((nodeId, nodeIndex) => {
        const node = nodeMap.get(nodeId)
        if (node) {
          node.setPosition(
            startX + nodeIndex * spacing,
            padding + layerIndex * verticalSpacing
          )
        }
      })
    })
  }

  // 力导向布局
  static forceLayout(nodes: Node[], edges: Edge[], options: LayoutOptions = { type: 'force' }): void {
    const { spacing = 150, iterations = 100 } = options

    if (nodes.length === 0) return

    const repulsion = spacing * spacing * 2
    const attraction = 0.05

    // 初始化位置（如果节点在同一位置，先打散）
    const centerX = nodes.reduce((sum, n) => sum + n.transform.x, 0) / nodes.length
    const centerY = nodes.reduce((sum, n) => sum + n.transform.y, 0) / nodes.length

    const positions = nodes.map((node, i) => ({
      x: node.transform.x || centerX + Math.cos((i / nodes.length) * Math.PI * 2) * spacing,
      y: node.transform.y || centerY + Math.sin((i / nodes.length) * Math.PI * 2) * spacing,
      vx: 0,
      vy: 0,
    }))

    const nodeIndex = new Map<string, number>()
    nodes.forEach((n, i) => nodeIndex.set(n.id, i))

    // 迭代模拟
    for (let iter = 0; iter < iterations; iter++) {
      const damping = 1 - iter / iterations * 0.9

      // 重置速度
      positions.forEach(p => { p.vx = 0; p.vy = 0 })

      // 排斥力（节点之间）
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = positions[j].x - positions[i].x
          const dy = positions[j].y - positions[i].y
          const distSq = dx * dx + dy * dy + 0.01
          const dist = Math.sqrt(distSq)
          const force = repulsion / distSq

          const fx = (dx / dist) * force
          const fy = (dy / dist) * force

          positions[i].vx -= fx
          positions[i].vy -= fy
          positions[j].vx += fx
          positions[j].vy += fy
        }
      }

      // 吸引力（边连接的节点之间）
      edges.forEach(edge => {
        const fromIdx = nodeIndex.get(edge.fromNodeId)
        const toIdx = nodeIndex.get(edge.toNodeId)
        if (fromIdx === undefined || toIdx === undefined) return

        const dx = positions[toIdx].x - positions[fromIdx].x
        const dy = positions[toIdx].y - positions[fromIdx].y
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01
        const force = (dist - spacing) * attraction

        const fx = (dx / dist) * force
        const fy = (dy / dist) * force

        positions[fromIdx].vx += fx
        positions[fromIdx].vy += fy
        positions[toIdx].vx -= fx
        positions[toIdx].vy -= fy
      })

      // 中心引力（防止图形漂移）
      positions.forEach(p => {
        p.vx += (centerX - p.x) * 0.005
        p.vy += (centerY - p.y) * 0.005
      })

      // 应用速度
      positions.forEach(p => {
        p.x += p.vx * damping
        p.y += p.vy * damping
      })
    }

    // 更新节点位置
    nodes.forEach((node, i) => {
      node.setPosition(positions[i].x, positions[i].y)
    })
  }

  // 环形布局
  static circularLayout(nodes: Node[], options: LayoutOptions = { type: 'circular' }): void {
    const { spacing = 200 } = options

    if (nodes.length === 0) return

    const radius = Math.max((nodes.length * spacing) / (2 * Math.PI), spacing)
    const centerX = 400
    const centerY = 300

    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2
      node.setPosition(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      )
    })
  }

  // 树形布局（基于层次布局的变体，更适合树结构）
  static treeLayout(nodes: Node[], edges: Edge[], options: LayoutOptions = { type: 'tree' }): void {
    const { spacing = 180, padding = 80 } = options

    if (nodes.length === 0) return

    // 找根节点（无入边）
    const inDegree = new Map<string, number>()
    const children = new Map<string, string[]>()

    nodes.forEach(n => {
      inDegree.set(n.id, 0)
      children.set(n.id, [])
    })

    edges.forEach(edge => {
      if (inDegree.has(edge.toNodeId)) {
        inDegree.set(edge.toNodeId, (inDegree.get(edge.toNodeId) || 0) + 1)
      }
      if (children.has(edge.fromNodeId)) {
        children.get(edge.fromNodeId)!.push(edge.toNodeId)
      }
    })

    const roots = nodes.filter(n => (inDegree.get(n.id) || 0) === 0)
    if (roots.length === 0 && nodes.length > 0) roots.push(nodes[0])

    const nodeMap = new Map<string, Node>()
    nodes.forEach(n => nodeMap.set(n.id, n))

    // DFS 计算子树宽度
    const subtreeWidth = new Map<string, number>()
    const visited = new Set<string>()

    function calcWidth(nodeId: string): number {
      if (visited.has(nodeId)) return 1
      visited.add(nodeId)

      const nodeChildren = children.get(nodeId) || []
      if (nodeChildren.length === 0) {
        subtreeWidth.set(nodeId, 1)
        return 1
      }

      const totalWidth = nodeChildren.reduce((sum, childId) => sum + calcWidth(childId), 0)
      subtreeWidth.set(nodeId, totalWidth)
      return totalWidth
    }

    roots.forEach(r => calcWidth(r.id))

    // DFS 分配位置
    function assignPositions(nodeId: string, depth: number, xOffset: number): void {
      const node = nodeMap.get(nodeId)
      if (!node) return

      const nodeChildren = children.get(nodeId) || []
      const width = subtreeWidth.get(nodeId) || 1
      const centerX = xOffset + (width * spacing) / 2

      node.setPosition(centerX, padding + depth * spacing)

      let childXOffset = xOffset
      nodeChildren.forEach(childId => {
        const childWidth = subtreeWidth.get(childId) || 1
        assignPositions(childId, depth + 1, childXOffset)
        childXOffset += childWidth * spacing
      })
    }

    let rootXOffset = padding
    roots.forEach(root => {
      assignPositions(root.id, 0, rootXOffset)
      const width = subtreeWidth.get(root.id) || 1
      rootXOffset += width * spacing
    })
  }

  // 统一入口
  static layout(nodes: Node[], edges: Edge[], options: LayoutOptions): void {
    switch (options.type) {
      case 'grid':
        this.gridLayout(nodes, options)
        break
      case 'hierarchical':
        this.hierarchicalLayout(nodes, edges, options)
        break
      case 'force':
        this.forceLayout(nodes, edges, options)
        break
      case 'circular':
        this.circularLayout(nodes, options)
        break
      case 'tree':
        this.treeLayout(nodes, edges, options)
        break
    }
  }
}
