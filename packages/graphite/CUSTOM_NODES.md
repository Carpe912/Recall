# 自定义节点系统

自定义节点系统允许你创建具有响应式数据和自定义 Canvas 渲染逻辑的节点。

---

## 快速开始

### 1. 使用内置节点类型

```typescript
import { GraphiteEditor } from '@recall/graphite'

const editor = new GraphiteEditor(canvas)

// 表格节点
const tableNode = editor.createCustomNode({
  x: 100, y: 100,
  nodeType: 'table',
  data: {
    headers: ['姓名', '年龄', '城市'],
    rows: [
      ['张三', '25', '北京'],
      ['李四', '30', '上海']
    ]
  }
})

// 进度条节点
const progressNode = editor.createCustomNode({
  x: 300, y: 100,
  nodeType: 'progress',
  data: { label: '项目进度', value: 75, max: 100 }
})

// 卡片节点
const cardNode = editor.createCustomNode({
  x: 500, y: 100,
  nodeType: 'card',
  data: { title: '销售额', subtitle: '本月', value: '¥128,000', icon: '💰' }
})
```

### 2. 更新节点数据（响应式）

节点数据是响应式的，修改后自动触发重绘：

```typescript
// 通过编辑器 API 更新
editor.updateCustomNodeData(progressNode.id, { value: 90 })

// 或直接修改 Proxy 数据（同样触发重绘）
import { CustomNode } from '@recall/graphite'
if (progressNode instanceof CustomNode) {
  progressNode.data.value = 90
}
```

### 3. 注册自定义节点类型

```typescript
import type { NodeTypeDefinition } from '@recall/graphite'

const clockNodeType: NodeTypeDefinition = {
  name: 'clock',
  defaultSize: { width: 150, height: 150 },
  defaultData: { time: new Date().toLocaleTimeString() },
  render: ({ ctx, bounds, data }) => {
    const cx = bounds.x + bounds.width / 2
    const cy = bounds.y + bounds.height / 2
    const r  = Math.min(bounds.width, bounds.height) / 2 - 10

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#333'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(data.time, cx, cy)
  }
}

editor.registerNodeType(clockNodeType)

const clockNode = editor.createCustomNode({ x: 100, y: 100, nodeType: 'clock' })

setInterval(() => {
  editor.updateCustomNodeData(clockNode.id, { time: new Date().toLocaleTimeString() })
}, 1000)
```

### 4. 配置可编辑字段

双击节点可进入文字编辑模式。通过 `editable` 配置哪个 data 字段可编辑：

```typescript
const myNodeType: NodeTypeDefinition = {
  name: 'my-node',
  defaultSize: { width: 200, height: 80 },
  defaultData: { label: '节点标题', value: 0 },
  editable: {
    enabled: true,
    field: 'label',         // 编辑 data.label
    multiline: false,       // 单行
    offsetX: 12,            // 相对节点左上角的偏移
    offsetY: 10,
    width: 176,             // 输入框宽度
    height: 20,             // 输入框高度
    fontSize: 14,           // 必须与 canvas 渲染字体一致
    fontWeight: 'bold',
    textAlign: 'left'
  },
  render: ({ ctx, bounds, data }) => {
    ctx.fillStyle = '#fff'
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
    ctx.fillStyle = '#333'
    ctx.font = `bold 14px sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(data.label, bounds.x + 12, bounds.y + 10)
  }
}
```

### 5. 配置端口（Ports）

自定义节点也支持可配置连接点：

```typescript
import type { PortDefinition } from '@recall/graphite'

// 只有左侧 input、右侧 output
const ports: PortDefinition[] = [
  { id: 'in',  dx: -0.5, dy: 0, type: 'input',  label: '输入' },
  { id: 'out', dx:  0.5, dy: 0, type: 'output', label: '输出' },
]

editor.setNodePorts(myNode.id, ports)
```

### 6. 监听数据变化

```typescript
import { CustomNode } from '@recall/graphite'

const node = editor.createCustomNode({
  x: 100, y: 100, nodeType: 'progress', data: { value: 0 }
})

if (node instanceof CustomNode) {
  node.onDataChange((change) => {
    console.log(`${String(change.property)}: ${change.oldValue} → ${change.value}`)
  })

  node.data.value = 50  // 触发回调 + 自动重绘
}
```

---

## 高级示例：柱状图节点

```typescript
const chartNodeType: NodeTypeDefinition = {
  name: 'bar-chart',
  defaultSize: { width: 300, height: 200 },
  defaultData: {
    title: '月度销售',
    data: [
      { label: '1月', value: 120 },
      { label: '2月', value: 150 },
      { label: '3月', value: 180 },
    ],
    maxValue: 250
  },
  render: ({ ctx, bounds, data }) => {
    const { title, data: bars, maxValue } = data
    const padding = 20
    const titleH = 30
    const chartH = bounds.height - titleH - padding * 2
    const barW   = (bounds.width - padding * 2) / bars.length - 10

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

    ctx.fillStyle = '#333'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(title, bounds.x + bounds.width / 2, bounds.y + padding)

    bars.forEach((item: any, i: number) => {
      const x  = bounds.x + padding + i * (barW + 10)
      const bh = (item.value / maxValue) * chartH
      const y  = bounds.y + titleH + padding + (chartH - bh)

      const grad = ctx.createLinearGradient(x, y, x, y + bh)
      grad.addColorStop(0, '#667eea')
      grad.addColorStop(1, '#764ba2')
      ctx.fillStyle = grad
      ctx.fillRect(x, y, barW, bh)

      ctx.fillStyle = '#333'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(item.value), x + barW / 2, y - 14)
      ctx.fillText(item.label, x + barW / 2, bounds.y + bounds.height - padding + 5)
    })
  }
}

editor.registerNodeType(chartNodeType)
const chartNode = editor.createCustomNode({ x: 100, y: 100, nodeType: 'bar-chart' })
```

---

## 内置节点类型

| 类型 | 描述 |
|------|------|
| `table` | 数据表格（表头 + 行） |
| `progress` | 进度条（label + value/max） |
| `card` | 渐变卡片（icon / title / subtitle / value） |
| `gauge` | 圆形仪表盘 |
| `user-card` | 用户卡片（头像 + 状态） |
| `image-card` | 图片卡片（标题 / 描述 / 标签） |
| `timeline` | 时间线事件 |
| `stat-card` | 统计卡片（趋势指示） |

---

## API 参考

### GraphiteEditor

| 方法 | 说明 |
|------|------|
| `createCustomNode(data)` | 创建自定义节点 |
| `registerNodeType(def)` | 注册节点类型 |
| `getRegisteredNodeTypes()` | 获取所有已注册类型 |
| `updateCustomNodeData(id, data)` | 更新节点数据 |
| `setNodePorts(id, ports)` | 设置节点端口 |
| `resetNodePorts(id)` | 重置为默认 4 端口 |

### CustomNode

| 成员 | 类型 | 说明 |
|------|------|------|
| `data` | `Record<string, any>` | 响应式数据（修改自动重绘） |
| `ports` | `PortDefinition[]` | 当前端口配置 |
| `updateData(partial)` | method | 批量更新数据 |
| `onDataChange(cb)` | method | 监听数据变化 |
| `setRenderFunction(fn)` | method | 替换渲染函数 |

### NodeTypeDefinition

```typescript
interface NodeTypeDefinition {
  name: string                         // 节点类型名称（唯一）
  render: CustomRenderFunction         // 渲染函数
  defaultData?: Record<string, any>    // 默认数据
  defaultSize?: { width: number; height: number }
  editable?: {
    enabled: boolean
    field: string           // data 中的字段名
    multiline?: boolean
    offsetX?: number        // 相对节点左上角（世界单位）
    offsetY?: number
    width?: number
    height?: number
    fontSize?: number
    fontWeight?: string
    textAlign?: string
  }
}
```

### RenderContext

```typescript
interface RenderContext {
  ctx: CanvasRenderingContext2D
  bounds: Rect                    // { x, y, width, height }（世界坐标）
  data: Record<string, any>       // 节点当前数据
  isSelected: boolean
}
```

---

## 最佳实践

1. **渲染函数保持纯净**：只依赖 `bounds` 和 `data`，不访问外部状态
2. **使用响应式数据**：通过修改 `node.data` 更新节点，不要手动调用重绘
3. **预计算复杂值**：在 `onDataChange` 中预处理数据，渲染函数只负责绘制
4. **端口类型声明**：声明 `input / output / both` 以配合 ConnectionValidator 的端口类型规则
5. **序列化兼容**：`exportToJSON` / `importFromJSON` 自动保存和恢复 `nodeType` + `data`，无需额外处理
