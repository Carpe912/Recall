import type { CustomRenderFunction } from './CustomNode'

export interface EditableConfig {
  enabled: boolean
  field: string       // 要编辑的数据字段名
  multiline?: boolean // 是否支持多行
  offsetX?: number   // 字段 x 偏移（像素，相对于节点左上角）
  offsetY?: number   // 字段 y 偏移（像素，相对于节点左上角）
  width?: number     // 输入框宽度（像素，不填则用节点宽度）
  height?: number    // 输入框高度（像素）
  fontSize?: number  // 与 canvas 渲染一致的字号（px，不含 zoom）
  fontWeight?: string // 与 canvas 渲染一致的字重，如 'bold' 或 'normal'
  textAlign?: string  // 与 canvas 渲染一致的对齐方式，如 'left'、'center'
}

export interface NodeTypeDefinition {
  name: string
  render: CustomRenderFunction
  defaultData?: Record<string, any>
  defaultSize?: { width: number; height: number }
  editable?: EditableConfig  // 编辑配置
}

/**
 * 节点类型注册表
 * 管理所有自定义节点类型
 */
export class NodeRegistry {
  private static instance: NodeRegistry
  private nodeTypes: Map<string, NodeTypeDefinition> = new Map()

  private constructor() {
    // 注册一些内置节点类型
    this.registerBuiltInTypes()
  }

  static getInstance(): NodeRegistry {
    if (!NodeRegistry.instance) {
      NodeRegistry.instance = new NodeRegistry()
    }
    return NodeRegistry.instance
  }

  /**
   * 注册节点类型
   */
  register(definition: NodeTypeDefinition): void {
    this.nodeTypes.set(definition.name, definition)
  }

  /**
   * 获取节点类型定义
   */
  get(name: string): NodeTypeDefinition | undefined {
    return this.nodeTypes.get(name)
  }

  /**
   * 获取所有节点类型
   */
  getAll(): NodeTypeDefinition[] {
    return Array.from(this.nodeTypes.values())
  }

  /**
   * 注销节点类型
   */
  unregister(name: string): void {
    this.nodeTypes.delete(name)
  }

  /**
   * 注册内置节点类型
   */
  private registerBuiltInTypes(): void {
    // 表格节点 - 不可编辑
    this.register({
      name: 'table',
      defaultSize: { width: 200, height: 150 },
      defaultData: {
        headers: ['列1', '列2'],
        rows: [
          ['数据1', '数据2'],
          ['数据3', '数据4']
        ]
      },
      editable: { enabled: false, field: '' },
      render: ({ ctx, bounds, data }) => {
        const { headers = [], rows = [] } = data
        const padding = 10
        const headerHeight = 30
        const rowHeight = 25

        // 背景
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)

        // 边框
        ctx.strokeStyle = '#e0e0e0'
        ctx.lineWidth = 1
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

        // 表头
        ctx.fillStyle = '#f5f5f5'
        ctx.fillRect(bounds.x, bounds.y, bounds.width, headerHeight)

        ctx.fillStyle = '#333'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'

        const colWidth = bounds.width / headers.length
        headers.forEach((header: string, i: number) => {
          ctx.fillText(
            header,
            bounds.x + i * colWidth + padding,
            bounds.y + headerHeight / 2
          )
        })

        // 表头分隔线
        ctx.beginPath()
        ctx.moveTo(bounds.x, bounds.y + headerHeight)
        ctx.lineTo(bounds.x + bounds.width, bounds.y + headerHeight)
        ctx.stroke()

        // 数据行
        ctx.fillStyle = '#666'
        ctx.font = '11px sans-serif'
        rows.forEach((row: any[], rowIndex: number) => {
          const y = bounds.y + headerHeight + rowIndex * rowHeight
          row.forEach((cell: any, colIndex: number) => {
            ctx.fillText(
              String(cell),
              bounds.x + colIndex * colWidth + padding,
              y + rowHeight / 2
            )
          })
        })
      }
    })

    // 进度条节点 - 可编辑标签
    this.register({
      name: 'progress',
      defaultSize: { width: 200, height: 60 },
      defaultData: {
        label: '进度',
        value: 60,
        max: 100
      },
      editable: { enabled: true, field: 'label', multiline: false, offsetX: 15, offsetY: 15, width: 160, height: 18, fontSize: 13, fontWeight: 'normal' },
      render: ({ ctx, bounds, data }) => {
        const { label = '进度', value = 60, max = 100 } = data
        const padding = 15
        const barHeight = 20

        // 背景
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)

        // 边框
        ctx.strokeStyle = '#e0e0e0'
        ctx.lineWidth = 1
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

        // 标签
        ctx.fillStyle = '#333'
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(label, bounds.x + padding, bounds.y + padding)

        // 进度条背景
        const barY = bounds.y + padding + 20
        const barWidth = bounds.width - padding * 2
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(bounds.x + padding, barY, barWidth, barHeight)

        // 进度条
        const progress = Math.min(Math.max(value / max, 0), 1)
        const gradient = ctx.createLinearGradient(
          bounds.x + padding,
          barY,
          bounds.x + padding + barWidth * progress,
          barY
        )
        gradient.addColorStop(0, '#667eea')
        gradient.addColorStop(1, '#764ba2')
        ctx.fillStyle = gradient
        ctx.fillRect(bounds.x + padding, barY, barWidth * progress, barHeight)

        // 百分比文字
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(
          `${Math.round(progress * 100)}%`,
          bounds.x + padding + (barWidth * progress) / 2,
          barY + barHeight / 2
        )
      }
    })

    // 卡片节点 - 可编辑标题
    this.register({
      name: 'card',
      defaultSize: { width: 180, height: 120 },
      defaultData: {
        title: '标题',
        subtitle: '副标题',
        value: '100',
        icon: '📊'
      },
      editable: { enabled: true, field: 'title', multiline: false, offsetX: 15, offsetY: 60, width: 150, height: 18, fontSize: 14, fontWeight: 'bold' },
      render: ({ ctx, bounds, data }) => {
        const { title = '标题', subtitle = '副标题', value = '100', icon = '📊' } = data
        const padding = 15

        // 背景渐变
        const gradient = ctx.createLinearGradient(
          bounds.x,
          bounds.y,
          bounds.x,
          bounds.y + bounds.height
        )
        gradient.addColorStop(0, '#667eea')
        gradient.addColorStop(1, '#764ba2')
        ctx.fillStyle = gradient
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)

        // 圆角效果（简化版）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 1
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

        // 图标
        ctx.font = '32px sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.fillText(icon, bounds.x + padding, bounds.y + padding)

        // 标题
        ctx.font = 'bold 14px sans-serif'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(title, bounds.x + padding, bounds.y + padding + 45)

        // 副标题
        ctx.font = '11px sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.fillText(subtitle, bounds.x + padding, bounds.y + padding + 65)

        // 数值
        ctx.font = 'bold 20px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(value, bounds.x + bounds.width - padding, bounds.y + bounds.height - padding - 5)
      }
    })

    // 仪表盘节点 - 可编辑标签
    this.register({
      name: 'gauge',
      defaultSize: { width: 180, height: 180 },
      defaultData: {
        label: '速度',
        value: 65,
        max: 100,
        unit: 'km/h'
      },
      editable: { enabled: true, field: 'label', multiline: false, offsetX: 0, offsetY: 153, width: 180, height: 18, fontSize: 13, fontWeight: 'normal', textAlign: 'center' },
      render: ({ ctx, bounds, data }) => {
        const { label = '速度', value = 65, max = 100, unit = 'km/h' } = data
        const centerX = bounds.x + bounds.width / 2
        const centerY = bounds.y + bounds.height / 2 + 20
        const radius = Math.min(bounds.width, bounds.height) / 2 - 30
        const startAngle = Math.PI * 0.75
        const endAngle = Math.PI * 2.25

        // 背景
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
        ctx.strokeStyle = '#e0e0e0'
        ctx.lineWidth = 1
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

        // 绘制刻度背景弧
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, startAngle, endAngle)
        ctx.strokeStyle = '#f0f0f0'
        ctx.lineWidth = 20
        ctx.stroke()

        // 绘制进度弧
        const progress = Math.min(Math.max(value / max, 0), 1)
        const currentAngle = startAngle + (endAngle - startAngle) * progress
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, startAngle, currentAngle)
        const gradient = ctx.createLinearGradient(
          centerX - radius, centerY,
          centerX + radius, centerY
        )
        gradient.addColorStop(0, '#667eea')
        gradient.addColorStop(1, '#764ba2')
        ctx.strokeStyle = gradient
        ctx.lineWidth = 20
        ctx.lineCap = 'round'
        ctx.stroke()

        // 绘制指针
        const needleAngle = startAngle + (endAngle - startAngle) * progress
        const needleLength = radius - 10
        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.lineTo(
          centerX + Math.cos(needleAngle) * needleLength,
          centerY + Math.sin(needleAngle) * needleLength
        )
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.stroke()

        // 中心圆点
        ctx.beginPath()
        ctx.arc(centerX, centerY, 6, 0, Math.PI * 2)
        ctx.fillStyle = '#333'
        ctx.fill()

        // 数值
        ctx.fillStyle = '#333'
        ctx.font = 'bold 24px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(Math.round(value)), centerX, centerY - 30)

        // 单位
        ctx.font = '12px sans-serif'
        ctx.fillStyle = '#666'
        ctx.fillText(unit, centerX, centerY - 10)

        // 标签
        ctx.font = '13px sans-serif'
        ctx.fillText(label, centerX, bounds.y + bounds.height - 20)
      }
    })

    // 用户卡片节点 - 可编辑姓名
    this.register({
      name: 'user-card',
      defaultSize: { width: 200, height: 140 },
      defaultData: {
        name: '张三',
        role: '产品经理',
        avatar: '👤',
        email: 'zhangsan@example.com',
        status: 'online'
      },
      editable: { enabled: true, field: 'name', multiline: false, offsetX: 85, offsetY: 27, width: 110, height: 20, fontSize: 16, fontWeight: 'bold' },
      render: ({ ctx, bounds, data }) => {
        const { name = '张三', role = '产品经理', avatar = '👤', email = '', status = 'online' } = data
        const padding = 15

        // 背景
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)

        // 边框
        ctx.strokeStyle = '#e0e0e0'
        ctx.lineWidth = 1
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

        // 头像背景圆
        const avatarX = bounds.x + padding + 30
        const avatarY = bounds.y + padding + 30
        const avatarRadius = 30

        ctx.beginPath()
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2)
        ctx.fillStyle = '#f0f0f0'
        ctx.fill()

        // 头像
        ctx.font = '32px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#666'
        ctx.fillText(avatar, avatarX, avatarY)

        // 状态指示器
        const statusX = avatarX + avatarRadius - 8
        const statusY = avatarY + avatarRadius - 8
        ctx.beginPath()
        ctx.arc(statusX, statusY, 6, 0, Math.PI * 2)
        ctx.fillStyle = status === 'online' ? '#52c41a' : '#d9d9d9'
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()

        // 姓名
        ctx.font = 'bold 16px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillStyle = '#333'
        ctx.fillText(name, bounds.x + padding + 70, bounds.y + padding + 20)

        // 角色
        ctx.font = '12px sans-serif'
        ctx.fillStyle = '#999'
        ctx.fillText(role, bounds.x + padding + 70, bounds.y + padding + 40)

        // 邮箱
        ctx.font = '11px sans-serif'
        ctx.fillStyle = '#666'
        ctx.fillText(email, bounds.x + padding, bounds.y + bounds.height - padding - 20)

        // 分隔线
        ctx.beginPath()
        ctx.moveTo(bounds.x + padding, bounds.y + bounds.height - padding - 35)
        ctx.lineTo(bounds.x + bounds.width - padding, bounds.y + bounds.height - padding - 35)
        ctx.strokeStyle = '#f0f0f0'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    })

    // 图片卡片节点 - 可编辑标题
    this.register({
      name: 'image-card',
      defaultSize: { width: 200, height: 180 },
      defaultData: {
        title: '图片标题',
        description: '这是一段描述文字',
        imageUrl: '🖼️',
        tags: ['标签1', '标签2']
      },
      editable: { enabled: true, field: 'title', multiline: false, offsetX: 12, offsetY: 110, width: 176, height: 18, fontSize: 14, fontWeight: 'bold' },
      render: ({ ctx, bounds, data }) => {
        const { title = '图片标题', description = '这是一段描述文字', imageUrl = '🖼️', tags = ['标签1', '标签2'] } = data
        const padding = 12
        const imageHeight = 100

        // 背景
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)

        // 边框
        ctx.strokeStyle = '#e0e0e0'
        ctx.lineWidth = 1
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

        // 图片区域背景
        ctx.fillStyle = '#f5f5f5'
        ctx.fillRect(bounds.x, bounds.y, bounds.width, imageHeight)

        // 图片占位符（emoji）
        ctx.font = '48px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#999'
        ctx.fillText(imageUrl, bounds.x + bounds.width / 2, bounds.y + imageHeight / 2)

        // 标题
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillStyle = '#333'
        ctx.fillText(title, bounds.x + padding, bounds.y + imageHeight + padding + 5)

        // 描述
        ctx.font = '11px sans-serif'
        ctx.fillStyle = '#666'
        const maxWidth = bounds.width - padding * 2
        ctx.fillText(description, bounds.x + padding, bounds.y + imageHeight + padding + 25, maxWidth)

        // 标签
        let tagX = bounds.x + padding
        const tagY = bounds.y + bounds.height - padding - 15
        ctx.font = '10px sans-serif'
        tags.forEach((tag: string) => {
          const tagWidth = ctx.measureText(tag).width + 12

          // 标签背景
          ctx.fillStyle = '#f0f0f0'
          ctx.fillRect(tagX, tagY, tagWidth, 18)

          // 标签文字
          ctx.fillStyle = '#666'
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.fillText(tag, tagX + 6, tagY + 9)

          tagX += tagWidth + 6
        })
      }
    })

    // 时间轴节点 - 可编辑标题
    this.register({
      name: 'timeline',
      defaultSize: { width: 220, height: 200 },
      defaultData: {
        title: '项目进度',
        events: [
          { time: '09:00', label: '项目启动', status: 'completed' },
          { time: '10:30', label: '需求评审', status: 'completed' },
          { time: '14:00', label: '开发中', status: 'active' },
          { time: '16:00', label: '测试', status: 'pending' }
        ]
      },
      editable: { enabled: true, field: 'title', multiline: false, offsetX: 15, offsetY: 15, width: 190, height: 18, fontSize: 14, fontWeight: 'bold' },
      render: ({ ctx, bounds, data }) => {
        const { title = '项目进度', events = [] } = data
        const padding = 15
        const lineX = bounds.x + padding + 8

        // 背景
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)

        // 边框
        ctx.strokeStyle = '#e0e0e0'
        ctx.lineWidth = 1
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

        // 标题
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillStyle = '#333'
        ctx.fillText(title, bounds.x + padding, bounds.y + padding)

        // 时间轴线
        const startY = bounds.y + padding + 30
        const eventHeight = 35
        const totalHeight = events.length * eventHeight

        ctx.beginPath()
        ctx.moveTo(lineX, startY)
        ctx.lineTo(lineX, startY + totalHeight - 10)
        ctx.strokeStyle = '#e0e0e0'
        ctx.lineWidth = 2
        ctx.stroke()

        // 事件
        events.forEach((event: any, index: number) => {
          const y = startY + index * eventHeight

          // 圆点
          ctx.beginPath()
          ctx.arc(lineX, y, 6, 0, Math.PI * 2)

          if (event.status === 'completed') {
            ctx.fillStyle = '#52c41a'
          } else if (event.status === 'active') {
            ctx.fillStyle = '#1890ff'
          } else {
            ctx.fillStyle = '#d9d9d9'
          }
          ctx.fill()

          // 时间
          ctx.font = '11px sans-serif'
          ctx.textAlign = 'left'
          ctx.fillStyle = '#999'
          ctx.fillText(event.time, lineX + 15, y - 8)

          // 标签
          ctx.font = '12px sans-serif'
          ctx.fillStyle = '#333'
          ctx.fillText(event.label, lineX + 15, y + 8)
        })
      }
    })

    // 统计卡片节点 - 可编辑标签
    this.register({
      name: 'stat-card',
      defaultSize: { width: 180, height: 120 },
      defaultData: {
        label: '总销售额',
        value: '¥128,000',
        change: '+12.5%',
        trend: 'up',
        icon: '💰'
      },
      editable: { enabled: true, field: 'label', multiline: false, offsetX: 15, offsetY: 69, width: 150, height: 16, fontSize: 12, fontWeight: 'normal' },
      render: ({ ctx, bounds, data }) => {
        const { label = '总销售额', value = '¥128,000', change = '+12.5%', trend = 'up', icon = '💰' } = data
        const padding = 15

        // 背景
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)

        // 边框
        ctx.strokeStyle = '#e0e0e0'
        ctx.lineWidth = 1
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

        // 图标背景
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(bounds.x + padding, bounds.y + padding, 40, 40)

        // 图标
        ctx.font = '24px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#666'
        ctx.fillText(icon, bounds.x + padding + 20, bounds.y + padding + 20)

        // 标签
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillStyle = '#999'
        ctx.fillText(label, bounds.x + padding, bounds.y + padding + 60)

        // 数值
        ctx.font = 'bold 20px sans-serif'
        ctx.fillStyle = '#333'
        ctx.fillText(value, bounds.x + padding, bounds.y + padding + 80)

        // 变化趋势
        const changeColor = trend === 'up' ? '#52c41a' : trend === 'down' ? '#ff4d4f' : '#999'
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillStyle = changeColor
        ctx.fillText(change, bounds.x + bounds.width - padding, bounds.y + padding + 80)

        // 趋势箭头
        const arrowX = bounds.x + bounds.width - padding - ctx.measureText(change).width - 15
        const arrowY = bounds.y + padding + 75
        ctx.beginPath()
        if (trend === 'up') {
          ctx.moveTo(arrowX, arrowY + 5)
          ctx.lineTo(arrowX + 5, arrowY)
          ctx.lineTo(arrowX + 10, arrowY + 5)
        } else if (trend === 'down') {
          ctx.moveTo(arrowX, arrowY)
          ctx.lineTo(arrowX + 5, arrowY + 5)
          ctx.lineTo(arrowX + 10, arrowY)
        }
        ctx.strokeStyle = changeColor
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()
      }
    })
  }
}
