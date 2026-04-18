import type { Node } from '../core/Node'

export class AlignmentManager {
  // 左对齐
  static alignLeft(nodes: Node[]): void {
    if (nodes.length < 2) return
    const minX = Math.min(...nodes.map(n => n.transform.x - n.width / 2))
    nodes.forEach(node => {
      node.setPosition(minX + node.width / 2, node.transform.y)
    })
  }

  // 水平居中对齐
  static alignCenterHorizontal(nodes: Node[]): void {
    if (nodes.length < 2) return
    const avgX = nodes.reduce((sum, n) => sum + n.transform.x, 0) / nodes.length
    nodes.forEach(node => {
      node.setPosition(avgX, node.transform.y)
    })
  }

  // 右对齐
  static alignRight(nodes: Node[]): void {
    if (nodes.length < 2) return
    const maxX = Math.max(...nodes.map(n => n.transform.x + n.width / 2))
    nodes.forEach(node => {
      node.setPosition(maxX - node.width / 2, node.transform.y)
    })
  }

  // 顶部对齐
  static alignTop(nodes: Node[]): void {
    if (nodes.length < 2) return
    const minY = Math.min(...nodes.map(n => n.transform.y - n.height / 2))
    nodes.forEach(node => {
      node.setPosition(node.transform.x, minY + node.height / 2)
    })
  }

  // 垂直居中对齐
  static alignCenterVertical(nodes: Node[]): void {
    if (nodes.length < 2) return
    const avgY = nodes.reduce((sum, n) => sum + n.transform.y, 0) / nodes.length
    nodes.forEach(node => {
      node.setPosition(node.transform.x, avgY)
    })
  }

  // 底部对齐
  static alignBottom(nodes: Node[]): void {
    if (nodes.length < 2) return
    const maxY = Math.max(...nodes.map(n => n.transform.y + n.height / 2))
    nodes.forEach(node => {
      node.setPosition(node.transform.x, maxY - node.height / 2)
    })
  }

  // 水平分布
  static distributeHorizontally(nodes: Node[]): void {
    if (nodes.length < 3) return

    // 按 x 坐标排序
    const sorted = [...nodes].sort((a, b) => a.transform.x - b.transform.x)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const totalSpace = last.transform.x - first.transform.x
    const spacing = totalSpace / (sorted.length - 1)

    sorted.forEach((node, index) => {
      if (index > 0 && index < sorted.length - 1) {
        node.setPosition(first.transform.x + spacing * index, node.transform.y)
      }
    })
  }

  // 垂直分布
  static distributeVertically(nodes: Node[]): void {
    if (nodes.length < 3) return

    // 按 y 坐标排序
    const sorted = [...nodes].sort((a, b) => a.transform.y - b.transform.y)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const totalSpace = last.transform.y - first.transform.y
    const spacing = totalSpace / (sorted.length - 1)

    sorted.forEach((node, index) => {
      if (index > 0 && index < sorted.length - 1) {
        node.setPosition(node.transform.x, first.transform.y + spacing * index)
      }
    })
  }
}
