# 自定义节点系统

自定义节点系统允许你创建具有响应式数据和自定义渲染逻辑的节点。

## 快速开始

### 1. 使用内置节点类型

系统内置了几种常用的节点类型：

```typescript
import { GraphiteEditor } from '@recall/graphite'

const editor = new GraphiteEditor(canvas)

// 创建表格节点
const tableNode = editor.createCustomNode({
  x: 100,
  y: 100,
  nodeType: 'table',
  data: {
    headers: ['姓名', '年龄', '城市'],
    rows: [
      ['张三', '25', '北京'],
      ['李四', '30', '上海']
    ]
  }
})

// 创建进度条节点
const progressNode = editor.createCustomNode({
  x: 300,
  y: 100,
  nodeType: 'progress',
  data: {
    label: '项目进度',
    value: 75,
    max: 100
  }
})

// 创建卡片节点
const cardNode = editor.createCustomNode({
  x: 500,
  y: 100,
  nodeType: 'card',
  data: {
    title: '销售额',
    subtitle: '本月',
    value: '¥128,000',
    icon: '💰'
  }
})
```

### 2. 更新节点数据（响应式）

节点数据是响应式的，修改数据会自动触发重绘：

```typescript
// 更新表格数据
editor.updateCustomNodeData(tableNode.id, {
  rows: [
    ['张三', '25', '北京'],
    ['李四', '30', '上海'],
    ['王五', '28', '深圳']  // 新增一行
  ]
})

// 更新进度
editor.updateCustomNodeData(progressNode.id, {
  value: 90  // 进度自动更新
})

// 或者直接修改节点数据
if (progressNode instanceof CustomNode) {
  progressNode.data.value = 90  // 自动触发重绘
}
```

### 3. 注册自定义节点类型

你可以注册自己的节点类型：

```typescript
import type { NodeTypeDefinition } from '@recall/graphite'

// 定义一个时钟节点
const clockNodeType: NodeTypeDefinition = {
  name: 'clock',
  defaultSize: { width: 150, height: 150 },
  defaultData: {
    time: new Date().toLocaleTimeString()
  },
  render: ({ ctx, bounds, data }) => {
    const { time } = data
    
    // 绘制圆形背景
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2
    const radius = Math.min(bounds.width, bounds.height) / 2 - 10
    
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 绘制时间文字
    ctx.fillStyle = '#333'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(time, centerX, centerY)
  }
}

// 注册节点类型
editor.registerNodeType(clockNodeType)

// 创建时钟节点
const clockNode = editor.createCustomNode({
  x: 100,
  y: 100,
  nodeType: 'clock'
})

// 每秒更新时间
setInterval(() => {
  editor.updateCustomNodeData(clockNode.id, {
    time: new Date().toLocaleTimeString()
  })
}, 1000)
```

### 4. 高级示例：交互式图表节点

```typescript
// 柱状图节点
const chartNodeType: NodeTypeDefinition = {
  name: 'bar-chart',
  defaultSize: { width: 300, height: 200 },
  defaultData: {
    title: '月度销售',
    data: [
      { label: '1月', value: 120 },
      { label: '2月', value: 150 },
      { label: '3月', value: 180 },
      { label: '4月', value: 200 }
    ],
    maxValue: 250
  },
  render: ({ ctx, bounds, data }) => {
    const { title, data: chartData, maxValue } = data
    const padding = 20
    const titleHeight = 30
    const chartHeight = bounds.height - titleHeight - padding * 2
    const barWidth = (bounds.width - padding * 2) / chartData.length - 10
    
    // 背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
    
    // 边框
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    
    // 标题
    ctx.fillStyle = '#333'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(title, bounds.x + bounds.width / 2, bounds.y + padding)
    
    // 绘制柱状图
    chartData.forEach((item: any, index: number) => {
      const x = bounds.x + padding + index * (barWidth + 10)
      const barHeight = (item.value / maxValue) * chartHeight
      const y = bounds.y + titleHeight + padding + (chartHeight - barHeight)
      
      // 柱子渐变
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
      gradient.addColorStop(0, '#667eea')
      gradient.addColorStop(1, '#764ba2')
      ctx.fillStyle = gradient
      ctx.fillRect(x, y, barWidth, barHeight)
      
      // 数值
      ctx.fillStyle = '#333'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(item.value), x + barWidth / 2, y - 5)
      
      // 标签
      ctx.fillText(item.label, x + barWidth / 2, bounds.y + bounds.height - padding + 5)
    })
  }
}

editor.registerNodeType(chartNodeType)

// 创建图表
const chartNode = editor.createCustomNode({
  x: 100,
  y: 100,
  nodeType: 'bar-chart'
})

// 模拟数据更新
setTimeout(() => {
  editor.updateCustomNodeData(chartNode.id, {
    data: [
      { label: '1月', value: 120 },
      { label: '2月', value: 150 },
      { label: '3月', value: 180 },
      { label: '4月', value: 200 },
      { label: '5月', value: 220 }  // 新增数据
    ]
  })
}, 2000)
```

### 5. 监听数据变化

```typescript
import { CustomNode } from '@recall/graphite'

const node = editor.createCustomNode({
  x: 100,
  y: 100,
  nodeType: 'progress',
  data: { value: 0 }
})

if (node instanceof CustomNode) {
  // 监听数据变化
  node.onDataChange((change) => {
    console.log(`属性 ${String(change.property)} 从 ${change.oldValue} 变为 ${change.value}`)
  })
  
  // 修改数据会触发回调
  node.data.value = 50  // 输出: 属性 value 从 0 变为 50
}
```

## API 参考

### GraphiteEditor

#### `createCustomNode(data: CustomNodeData): CustomNode`
创建自定义节点

#### `registerNodeType(definition: NodeTypeDefinition): void`
注册节点类型

#### `getRegisteredNodeTypes(): NodeTypeDefinition[]`
获取所有已注册的节点类型

#### `updateCustomNodeData(nodeId: string, data: Record<string, any>): void`
更新自定义节点数据

### CustomNode

#### `data: Record<string, any>`
响应式数据对象，修改会自动触发重绘

#### `updateData(newData: Partial<Record<string, any>>): void`
批量更新数据

#### `onDataChange(callback: Function): void`
监听数据变化

#### `setRenderFunction(fn: CustomRenderFunction): void`
设置自定义渲染函数

### NodeTypeDefinition

```typescript
interface NodeTypeDefinition {
  name: string                    // 节点类型名称
  render: CustomRenderFunction    // 渲染函数
  defaultData?: Record<string, any>  // 默认数据
  defaultSize?: { width: number; height: number }  // 默认尺寸
}
```

### RenderContext

```typescript
interface RenderContext {
  ctx: CanvasRenderingContext2D   // Canvas 上下文
  bounds: Rect                     // 节点边界
  data: Record<string, any>        // 节点数据
  isSelected: boolean              // 是否被选中
}
```

## 最佳实践

1. **保持渲染函数纯净**：渲染函数应该只依赖传入的数据，不要访问外部状态
2. **使用响应式数据**：通过修改 `node.data` 来更新节点，而不是直接调用渲染
3. **性能优化**：避免在渲染函数中进行复杂计算，可以在数据更新时预计算
4. **类型安全**：使用 TypeScript 定义数据结构，确保类型安全

## 内置节点类型

- `table`: 表格节点
- `progress`: 进度条节点
- `card`: 卡片节点

更多示例请参考源码中的 `NodeRegistry.ts`。
