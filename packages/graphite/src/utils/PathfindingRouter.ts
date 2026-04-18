import type { Node } from '../core/Node'
import type { Point } from '../types'

interface GridCell {
  x: number
  y: number
  g: number // 从起点到当前点的实际代价
  h: number // 从当前点到终点的估计代价
  f: number // g + h
  parent: GridCell | null
}

export class PathfindingRouter {
  private gridSize: number = 20 // 网格大小
  private padding: number = 10 // 节点周围的间隙

  /**
   * 使用 A* 算法计算避开节点的路径
   */
  findPath(start: Point, end: Point, nodes: Node[]): Point[] {
    // 计算网格边界
    const bounds = this.calculateBounds(start, end, nodes)

    // 创建网格
    const grid = this.createGrid(bounds, nodes)

    // 转换起点和终点到网格坐标
    const startCell = this.worldToGrid(start, bounds)
    const endCell = this.worldToGrid(end, bounds)

    // 运行 A* 算法
    const path = this.aStar(startCell, endCell, grid, bounds)

    // 转换回世界坐标
    const worldPath = path.map(cell => this.gridToWorld(cell, bounds))

    // 简化路径（移除共线点）
    return this.simplifyPath(worldPath)
  }

  /**
   * 计算包含所有节点和起终点的边界
   */
  private calculateBounds(start: Point, end: Point, nodes: Node[]): {
    minX: number
    minY: number
    maxX: number
    maxY: number
    width: number
    height: number
  } {
    let minX = Math.min(start.x, end.x)
    let minY = Math.min(start.y, end.y)
    let maxX = Math.max(start.x, end.x)
    let maxY = Math.max(start.y, end.y)

    nodes.forEach(node => {
      const bounds = node.getBounds()
      minX = Math.min(minX, bounds.x - this.padding)
      minY = Math.min(minY, bounds.y - this.padding)
      maxX = Math.max(maxX, bounds.x + bounds.width + this.padding)
      maxY = Math.max(maxY, bounds.y + bounds.height + this.padding)
    })

    // 扩展边界
    const margin = 50
    minX -= margin
    minY -= margin
    maxX += margin
    maxY += margin

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  /**
   * 创建网格，标记障碍物
   */
  private createGrid(bounds: any, nodes: Node[]): boolean[][] {
    const cols = Math.ceil(bounds.width / this.gridSize)
    const rows = Math.ceil(bounds.height / this.gridSize)

    // 初始化网格（false = 可通行，true = 障碍物）
    const grid: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false))

    // 标记节点占据的网格为障碍物
    nodes.forEach(node => {
      const nodeBounds = node.getBounds()
      const x1 = Math.floor((nodeBounds.x - this.padding - bounds.minX) / this.gridSize)
      const y1 = Math.floor((nodeBounds.y - this.padding - bounds.minY) / this.gridSize)
      const x2 = Math.ceil((nodeBounds.x + nodeBounds.width + this.padding - bounds.minX) / this.gridSize)
      const y2 = Math.ceil((nodeBounds.y + nodeBounds.height + this.padding - bounds.minY) / this.gridSize)

      for (let y = Math.max(0, y1); y < Math.min(rows, y2); y++) {
        for (let x = Math.max(0, x1); x < Math.min(cols, x2); x++) {
          grid[y][x] = true
        }
      }
    })

    return grid
  }

  /**
   * 世界坐标转网格坐标
   */
  private worldToGrid(point: Point, bounds: any): { x: number; y: number } {
    return {
      x: Math.floor((point.x - bounds.minX) / this.gridSize),
      y: Math.floor((point.y - bounds.minY) / this.gridSize),
    }
  }

  /**
   * 网格坐标转世界坐标
   */
  private gridToWorld(cell: { x: number; y: number }, bounds: any): Point {
    return {
      x: bounds.minX + cell.x * this.gridSize + this.gridSize / 2,
      y: bounds.minY + cell.y * this.gridSize + this.gridSize / 2,
    }
  }

  /**
   * A* 算法实现
   */
  private aStar(
    start: { x: number; y: number },
    end: { x: number; y: number },
    grid: boolean[][],
    bounds: any
  ): { x: number; y: number }[] {
    const rows = grid.length
    const cols = grid[0].length

    // 检查起点和终点是否有效
    if (start.x < 0 || start.x >= cols || start.y < 0 || start.y >= rows ||
        end.x < 0 || end.x >= cols || end.y < 0 || end.y >= rows) {
      return [start, end]
    }

    const openList: GridCell[] = []
    const closedSet = new Set<string>()

    const startCell: GridCell = {
      x: start.x,
      y: start.y,
      g: 0,
      h: this.heuristic(start, end),
      f: 0,
      parent: null,
    }
    startCell.f = startCell.g + startCell.h

    openList.push(startCell)

    while (openList.length > 0) {
      // 找到 f 值最小的节点
      openList.sort((a, b) => a.f - b.f)
      const current = openList.shift()!

      // 到达终点
      if (current.x === end.x && current.y === end.y) {
        return this.reconstructPath(current)
      }

      closedSet.add(`${current.x},${current.y}`)

      // 检查相邻节点（4方向）
      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      ]

      for (const neighbor of neighbors) {
        // 检查边界
        if (neighbor.x < 0 || neighbor.x >= cols || neighbor.y < 0 || neighbor.y >= rows) {
          continue
        }

        // 检查是否已访问
        if (closedSet.has(`${neighbor.x},${neighbor.y}`)) {
          continue
        }

        // 检查是否是障碍物（除非是终点）
        if (grid[neighbor.y][neighbor.x] && !(neighbor.x === end.x && neighbor.y === end.y)) {
          continue
        }

        const g = current.g + 1
        const h = this.heuristic(neighbor, end)
        const f = g + h

        // 检查是否已在 openList 中
        const existingIndex = openList.findIndex(cell => cell.x === neighbor.x && cell.y === neighbor.y)

        if (existingIndex === -1) {
          openList.push({
            x: neighbor.x,
            y: neighbor.y,
            g,
            h,
            f,
            parent: current,
          })
        } else if (g < openList[existingIndex].g) {
          openList[existingIndex].g = g
          openList[existingIndex].f = f
          openList[existingIndex].parent = current
        }
      }
    }

    // 没有找到路径，返回直线
    return [start, end]
  }

  /**
   * 启发式函数（曼哈顿距离）
   */
  private heuristic(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
  }

  /**
   * 重建路径
   */
  private reconstructPath(endCell: GridCell): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = []
    let current: GridCell | null = endCell

    while (current) {
      path.unshift({ x: current.x, y: current.y })
      current = current.parent
    }

    return path
  }

  /**
   * 简化路径（移除共线点）
   */
  private simplifyPath(path: Point[]): Point[] {
    if (path.length <= 2) return path

    const simplified: Point[] = [path[0]]

    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1]
      const curr = path[i]
      const next = path[i + 1]

      // 检查是否共线
      const dx1 = curr.x - prev.x
      const dy1 = curr.y - prev.y
      const dx2 = next.x - curr.x
      const dy2 = next.y - curr.y

      // 如果不共线，保留这个点
      if (Math.abs(dx1 * dy2 - dy1 * dx2) > 0.01) {
        simplified.push(curr)
      }
    }

    simplified.push(path[path.length - 1])

    return simplified
  }
}
