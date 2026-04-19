<template>
  <div class="playground">
    <div class="main-content">
      <canvas ref="canvasRef" class="canvas"></canvas>

      <!-- 右侧样式面板 -->
      <div class="sidebar" v-if="selectedNodes.length > 0 || selectedEdges.length > 0">
        <!-- 节点样式 -->
        <div v-if="selectedNodes.length > 0">
          <h3>节点样式</h3>
          <div class="style-control">
            <label>填充颜色</label>
            <input type="color" v-model="nodeStyle.fill" @input="updateSelectedNodesStyle">
          </div>
          <div class="style-control">
            <label>边框颜色</label>
            <input type="color" v-model="nodeStyle.stroke" @input="updateSelectedNodesStyle">
          </div>
          <div class="style-control">
            <label>边框宽度</label>
            <input type="range" min="0" max="10" v-model.number="nodeStyle.strokeWidth" @input="updateSelectedNodesStyle">
            <span>{{ nodeStyle.strokeWidth }}px</span>
          </div>
          <div class="style-control">
            <label>圆角</label>
            <input type="range" min="0" max="50" v-model.number="nodeStyle.borderRadius" @input="updateSelectedNodesStyle">
            <span>{{ nodeStyle.borderRadius }}px</span>
          </div>
          <div class="style-control">
            <label>阴影模糊</label>
            <input type="range" min="0" max="30" v-model.number="nodeStyle.shadowBlur" @input="updateSelectedNodesStyle">
            <span>{{ nodeStyle.shadowBlur }}px</span>
          </div>
          <div class="style-control">
            <label>透明度</label>
            <input type="range" min="0" max="1" step="0.1" v-model.number="nodeStyle.opacity" @input="updateSelectedNodesStyle">
            <span>{{ nodeStyle.opacity }}</span>
          </div>
        </div>

        <!-- 连线样式 -->
        <div v-if="selectedEdges.length > 0">
          <h3>连线样式</h3>
          <div class="style-control">
            <label>线条颜色</label>
            <input type="color" v-model="edgeStyle.stroke" @input="updateSelectedEdgesStyle">
          </div>
          <div class="style-control">
            <label>线条宽度</label>
            <input type="range" min="1" max="10" v-model.number="edgeStyle.strokeWidth" @input="updateSelectedEdgesStyle">
            <span>{{ edgeStyle.strokeWidth }}px</span>
          </div>
          <div class="style-control">
            <label>透明度</label>
            <input type="range" min="0" max="1" step="0.1" v-model.number="edgeStyle.opacity" @input="updateSelectedEdgesStyle">
            <span>{{ edgeStyle.opacity }}</span>
          </div>
          <div class="style-control">
            <label>连线类型</label>
            <select v-model="edgeStyle.lineStyle" @change="updateSelectedEdgesStyle" class="style-select">
              <option value="straight">直线</option>
              <option value="curved">曲线</option>
              <option value="orthogonal">折线</option>
            </select>
          </div>
          <div class="style-control" v-if="edgeStyle.lineStyle === 'orthogonal'">
            <label>智能路由</label>
            <div class="checkbox-wrapper">
              <input type="checkbox" v-model="edgeStyle.useSmartRouting" @change="updateSelectedEdgesStyle">
              <span>启用</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 左侧形状面板 -->
      <div class="shapes-panel" :class="{ collapsed: shapesPanelCollapsed }" :style="{ width: shapesPanelWidth + 'px' }">
        <div class="panel-header">
          <span>形状</span>
          <button class="collapse-btn" @click="shapesPanelCollapsed = !shapesPanelCollapsed">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline :points="shapesPanelCollapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6'"/>
            </svg>
          </button>
        </div>
        <div class="shapes-content" v-show="!shapesPanelCollapsed">
          <div class="shape-category">
            <div class="category-title">基础形状</div>
            <div class="shape-item" draggable="true" @dragstart="onShapeDragStart($event, 'rectangle')">
              <svg width="40" height="40" viewBox="0 0 40 40">
                <rect x="5" y="10" width="30" height="20" rx="2" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>
              </svg>
              <span>矩形</span>
            </div>
            <div class="shape-item" draggable="true" @dragstart="onShapeDragStart($event, 'circle')">
              <svg width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="12" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>
              </svg>
              <span>圆形</span>
            </div>
            <div class="shape-item" draggable="true" @dragstart="onShapeDragStart($event, 'diamond')">
              <svg width="40" height="40" viewBox="0 0 40 40">
                <path d="M 20 8 L 32 20 L 20 32 L 8 20 Z" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>
              </svg>
              <span>菱形</span>
            </div>
            <div class="shape-item" draggable="true" @dragstart="onShapeDragStart($event, 'triangle')">
              <svg width="40" height="40" viewBox="0 0 40 40">
                <path d="M 20 8 L 32 28 L 8 28 Z" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>
              </svg>
              <span>三角形</span>
            </div>
          </div>
          <div class="shape-category">
            <div class="category-title">连线样式</div>
            <div class="edge-style-item" @click="setEdgeLineStyle('straight')" :class="{ active: edgeLineStyle === 'straight' }">
              <svg width="60" height="30" viewBox="0 0 60 30">
                <line x1="5" y1="15" x2="55" y2="15" stroke="#666" stroke-width="2"/>
              </svg>
              <span>直线</span>
            </div>
            <div class="edge-style-item" @click="setEdgeLineStyle('curved')" :class="{ active: edgeLineStyle === 'curved' }">
              <svg width="60" height="30" viewBox="0 0 60 30">
                <path d="M 5 15 Q 30 5 55 15" fill="none" stroke="#666" stroke-width="2"/>
              </svg>
              <span>曲线</span>
            </div>
            <div class="edge-style-item" @click="setEdgeLineStyle('orthogonal')" :class="{ active: edgeLineStyle === 'orthogonal' }">
              <svg width="60" height="30" viewBox="0 0 60 30">
                <path d="M 5 15 L 30 15 L 30 10 L 55 10" fill="none" stroke="#666" stroke-width="2"/>
              </svg>
              <span>折线</span>
            </div>
          </div>
          <div class="shape-category" v-if="edgeLineStyle === 'orthogonal'">
            <div class="category-title">智能路由</div>
            <button class="toggle-btn" @click="toggleSmartRouting" :class="{ active: useSmartRouting }">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
              <span>{{ useSmartRouting ? '已启用' : '已禁用' }}</span>
            </button>
          </div>
        </div>
        <div class="resize-handle" @mousedown="startResizePanel"></div>
      </div>

      <div class="floating-toolbar">

        <!-- 铅笔工具 -->
        <button class="icon-btn" @click="togglePencilMode" :class="{ active: isPencilMode }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
            <path d="M2 2l7.586 7.586"/>
            <circle cx="11" cy="11" r="2"/>
          </svg>
          <div class="btn-tip">铅笔工具（自由绘制）</div>
        </button>

        <div class="toolbar-sep"></div>

        <!-- 撤销 / 重做 -->
        <button class="icon-btn" @click="undo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9h13a5 5 0 0 1 0 10H7"/>
            <polyline points="3 5 3 9 7 9"/>
          </svg>
          <div class="btn-tip">撤销 <kbd>Ctrl Z</kbd></div>
        </button>
        <button class="icon-btn" @click="redo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 9H8a5 5 0 0 0 0 10h9"/>
            <polyline points="21 5 21 9 17 9"/>
          </svg>
          <div class="btn-tip">重做 <kbd>Ctrl ⇧ Z</kbd></div>
        </button>

        <div class="toolbar-sep"></div>

        <!-- 自动布局 -->
        <select v-model="layoutType" @change="autoLayout" class="layout-select">
          <option value="hierarchical">层次</option>
          <option value="tree">树形</option>
          <option value="force">力导向</option>
          <option value="circular">环形</option>
          <option value="grid">网格</option>
        </select>
        <button class="icon-btn" @click="autoLayout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="8" y="2" width="8" height="5" rx="1"/>
            <rect x="2" y="17" width="8" height="5" rx="1"/>
            <rect x="14" y="17" width="8" height="5" rx="1"/>
            <line x1="12" y1="7" x2="12" y2="13"/>
            <line x1="12" y1="13" x2="6" y2="17"/>
            <line x1="12" y1="13" x2="18" y2="17"/>
          </svg>
          <div class="btn-tip">重新应用布局</div>
        </button>

        <div class="toolbar-sep"></div>

        <!-- 对齐工具 -->
        <button class="icon-btn" @click="alignLeft" :disabled="selectedNodes.length < 2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="3" y2="18"/>
            <rect x="7" y="6" width="6" height="4" rx="1"/>
            <rect x="7" y="14" width="10" height="4" rx="1"/>
          </svg>
          <div class="btn-tip">左对齐</div>
        </button>
        <button class="icon-btn" @click="alignCenterHorizontal" :disabled="selectedNodes.length < 2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="3" x2="12" y2="21"/>
            <rect x="7" y="6" width="10" height="4" rx="1"/>
            <rect x="5" y="14" width="14" height="4" rx="1"/>
          </svg>
          <div class="btn-tip">水平居中</div>
        </button>
        <button class="icon-btn" @click="alignRight" :disabled="selectedNodes.length < 2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <line x1="21" y1="6" x2="21" y2="18"/>
            <rect x="11" y="6" width="6" height="4" rx="1"/>
            <rect x="7" y="14" width="10" height="4" rx="1"/>
          </svg>
          <div class="btn-tip">右对齐</div>
        </button>
        <button class="icon-btn" @click="alignTop" :disabled="selectedNodes.length < 2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <line x1="6" y1="3" x2="18" y2="3"/>
            <rect x="6" y="7" width="4" height="6" rx="1"/>
            <rect x="14" y="7" width="4" height="10" rx="1"/>
          </svg>
          <div class="btn-tip">顶部对齐</div>
        </button>
        <button class="icon-btn" @click="alignCenterVertical" :disabled="selectedNodes.length < 2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <rect x="6" y="7" width="4" height="10" rx="1"/>
            <rect x="14" y="5" width="4" height="14" rx="1"/>
          </svg>
          <div class="btn-tip">垂直居中</div>
        </button>
        <button class="icon-btn" @click="alignBottom" :disabled="selectedNodes.length < 2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <line x1="6" y1="21" x2="18" y2="21"/>
            <rect x="6" y="11" width="4" height="6" rx="1"/>
            <rect x="14" y="7" width="4" height="10" rx="1"/>
          </svg>
          <div class="btn-tip">底部对齐</div>
        </button>
        <button class="icon-btn" @click="distributeHorizontally" :disabled="selectedNodes.length < 3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="8" width="4" height="8" rx="1"/>
            <rect x="10" y="8" width="4" height="8" rx="1"/>
            <rect x="17" y="8" width="4" height="8" rx="1"/>
          </svg>
          <div class="btn-tip">水平分布</div>
        </button>
        <button class="icon-btn" @click="distributeVertically" :disabled="selectedNodes.length < 3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="8" y="3" width="8" height="4" rx="1"/>
            <rect x="8" y="10" width="8" height="4" rx="1"/>
            <rect x="8" y="17" width="8" height="4" rx="1"/>
          </svg>
          <div class="btn-tip">垂直分布</div>
        </button>

        <div class="toolbar-sep"></div>

        <!-- 分组 / 取消分组 -->
        <button class="icon-btn" @click="groupSelected" :disabled="selectedNodes.length < 2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2" stroke-dasharray="3 2"/>
            <rect x="5" y="5" width="6" height="6" rx="1"/>
            <rect x="13" y="13" width="6" height="6" rx="1"/>
          </svg>
          <div class="btn-tip">分组（需选中 2 个以上节点）</div>
        </button>
        <button class="icon-btn" @click="ungroupSelected" :disabled="selectedNodes.length === 0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="5" y="5" width="6" height="6" rx="1"/>
            <rect x="13" y="13" width="6" height="6" rx="1"/>
            <line x1="2" y1="2" x2="6" y2="6"/>
            <line x1="22" y1="2" x2="18" y2="6"/>
            <line x1="22" y1="22" x2="18" y2="18"/>
            <line x1="2" y1="22" x2="6" y2="18"/>
          </svg>
          <div class="btn-tip">取消分组</div>
        </button>

        <div class="toolbar-sep"></div>

        <!-- 导入 / 导出 -->
        <button class="icon-btn" @click="importJSON">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <div class="btn-tip">导入 JSON</div>
        </button>
        <div class="dropdown-group" @mouseenter="showExportMenu = true" @mouseleave="showExportMenu = false">
          <button class="icon-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <div class="btn-tip">导出</div>
          </button>
          <div class="export-menu" v-show="showExportMenu" @mouseenter="showExportMenu = true" @mouseleave="showExportMenu = false">
            <div class="export-item" @click="exportJSON(); showExportMenu = false">
              <span>导出 JSON</span>
            </div>
            <div class="export-item" @click="exportPNG(); showExportMenu = false">
              <span>导出 PNG</span>
            </div>
            <div class="export-item" @click="exportSVG(); showExportMenu = false">
              <span>导出 SVG</span>
            </div>
          </div>
        </div>

        <div class="toolbar-sep"></div>

        <!-- 缩放控制 -->
        <button class="icon-btn" @click="zoomOut">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
          <div class="btn-tip">缩小</div>
        </button>
        <div class="zoom-display">{{ zoomPercent }}%</div>
        <button class="icon-btn" @click="zoomIn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
          <div class="btn-tip">放大</div>
        </button>
        <button class="icon-btn" @click="resetZoom">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 4v6h6"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          <div class="btn-tip">重置缩放 (100%)</div>
        </button>

        <div class="toolbar-sep"></div>

        <!-- 小地图 -->
        <button class="icon-btn" @click="toggleMinimap" :class="{ active: minimapVisible }">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
          <div class="btn-tip">{{ minimapVisible ? '隐藏小地图' : '显示小地图' }}</div>
        </button>

        <div class="toolbar-sep"></div>

        <!-- 主题切换 -->
        <button class="icon-btn" @click="toggleTheme">
          <svg v-if="theme === 'light'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <div class="btn-tip">{{ theme === 'light' ? '切换到深色模式' : '切换到浅色模式' }}</div>
        </button>

        <div class="toolbar-sep"></div>

        <!-- 清空 -->
        <button class="icon-btn danger" @click="clear">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
          <div class="btn-tip">清空画布</div>
        </button>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { GraphiteEditor } from '@recall/graphite'

const showExportMenu = ref(false)
const minimapVisible = ref(false)
const zoomPercent = ref(100)

const canvasRef = ref<HTMLCanvasElement>()
let editor: GraphiteEditor | null = null
const selectedNodes = ref<string[]>([])
const selectedEdges = ref<string[]>([])
const layoutType = ref<'hierarchical' | 'tree' | 'force' | 'circular' | 'grid'>('hierarchical')
const edgeLineStyle = ref<'straight' | 'curved' | 'orthogonal'>('straight')
const theme = ref<'light' | 'dark'>('light')
const useSmartRouting = ref(false)
const isPencilMode = ref(false)

// 左侧形状面板
const shapesPanelCollapsed = ref(false)
const shapesPanelWidth = ref(220)
const isResizingPanel = ref(false)
const resizeStartX = ref(0)
const resizeStartWidth = ref(0)
let draggedShape: 'rectangle' | 'circle' | 'diamond' | 'triangle' | null = null

const nodeStyle = ref({
  fill: '#ffffff',
  stroke: '#333333',
  strokeWidth: 2,
  borderRadius: 8,
  shadowBlur: 0,
  opacity: 1,
})

const edgeStyle = ref({
  stroke: '#666666',
  strokeWidth: 2,
  opacity: 1,
  lineStyle: 'straight' as 'straight' | 'curved' | 'orthogonal',
  useSmartRouting: false,
})

onMounted(() => {
  if (!canvasRef.value) return

  editor = new GraphiteEditor(canvasRef.value)

  // 初始化主题
  theme.value = editor.getTheme()

  editor.on('selectionChanged', (selection: string[]) => {
    selectedNodes.value = selection

    if (selection.length > 0) {
      const nodes = editor!.getNodes()
      const firstSelected = nodes.find(n => n.id === selection[0])
      if (firstSelected) {
        nodeStyle.value = {
          fill: firstSelected.style.fill,
          stroke: firstSelected.style.stroke,
          strokeWidth: firstSelected.style.strokeWidth,
          borderRadius: firstSelected.style.borderRadius,
          shadowBlur: firstSelected.style.shadowBlur,
          opacity: firstSelected.style.opacity,
        }
      }
    }

    // 更新选中的边
    const selectionManager = editor!['selectionManager']
    const selectedEdgeObjects = selectionManager.getSelectedEdges()
    selectedEdges.value = selectedEdgeObjects.map((e: any) => e.id)

    if (selectedEdgeObjects.length > 0) {
      const firstEdge = selectedEdgeObjects[0]
      edgeStyle.value = {
        stroke: firstEdge.style.stroke,
        strokeWidth: firstEdge.style.strokeWidth,
        opacity: firstEdge.style.opacity,
        lineStyle: firstEdge.style.lineStyle || 'straight',
        useSmartRouting: firstEdge.style.useSmartRouting || false,
      }
    }
  })

  // 监听缩放变化
  editor.on('zoomChanged', (zoom: number) => {
    zoomPercent.value = Math.round(zoom * 100)
  })

  const node1 = editor.createNode({ x: 200, y: 150, width: 120, height: 80, content: 'Node 1' })
  const node2 = editor.createNode({
    x: 400, y: 150, width: 120, height: 80, content: 'Node 2',
    style: { fill: '#e3f2fd', stroke: '#1976d2', shadowBlur: 10 }
  })
  const node3 = editor.createNode({
    x: 300, y: 300, width: 120, height: 80, content: 'Node 3',
    style: { fill: '#fff3e0', stroke: '#f57c00', borderRadius: 20 }
  })

  editor.createEdge({ from: node1.id, to: node2.id })
  editor.createEdge({ from: node1.id, to: node3.id })

  // 监听画布的 drop 事件（从形状面板拖拽）
  if (canvasRef.value) {
    canvasRef.value.addEventListener('dragover', onCanvasDragOver)
    canvasRef.value.addEventListener('drop', onCanvasDrop)
  }
})

onUnmounted(() => {
  editor?.destroy()
  document.removeEventListener('mousemove', onResizePanelMove)
  document.removeEventListener('mouseup', onResizePanelEnd)
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('dragover', onCanvasDragOver)
    canvasRef.value.removeEventListener('drop', onCanvasDrop)
  }
})

// 画布拖放事件
function onCanvasDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

function onCanvasDrop(e: DragEvent) {
  e.preventDefault()
  if (!editor || !draggedShape || !canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  // 转换为世界坐标
  const camera = editor['renderer'].getCamera()
  const worldPoint = camera.screenToWorld({ x, y })

  // 创建节点
  editor.createNode({
    x: worldPoint.x,
    y: worldPoint.y,
    width: 120,
    height: 80,
    content: `${draggedShape.charAt(0).toUpperCase() + draggedShape.slice(1)}`,
    shape: draggedShape
  })

  draggedShape = null
}

// 形状拖拽开始
function onShapeDragStart(e: DragEvent, shape: 'rectangle' | 'circle' | 'diamond' | 'triangle') {
  draggedShape = shape
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'copy'
  }
}

// 面板调整大小
function startResizePanel(e: MouseEvent) {
  isResizingPanel.value = true
  resizeStartX.value = e.clientX
  resizeStartWidth.value = shapesPanelWidth.value
  document.addEventListener('mousemove', onResizePanelMove)
  document.addEventListener('mouseup', onResizePanelEnd)
}

function onResizePanelMove(e: MouseEvent) {
  if (!isResizingPanel.value) return
  const dx = e.clientX - resizeStartX.value
  shapesPanelWidth.value = Math.max(180, Math.min(400, resizeStartWidth.value + dx))
}

function onResizePanelEnd() {
  isResizingPanel.value = false
  document.removeEventListener('mousemove', onResizePanelMove)
  document.removeEventListener('mouseup', onResizePanelEnd)
}

function undo() { editor?.undo() }
function redo() { editor?.redo() }
function autoLayout() { editor?.autoLayout({ type: layoutType.value }) }
function clear() { editor?.clear() }

function setEdgeLineStyle(style: 'straight' | 'curved' | 'orthogonal') {
  edgeLineStyle.value = style
  if (!editor) return
  // 更新编辑器的默认连线样式
  editor.setDefaultEdgeStyle({
    lineStyle: style,
    useSmartRouting: useSmartRouting.value
  })
}

function toggleSmartRouting() {
  useSmartRouting.value = !useSmartRouting.value
  if (!editor) return

  // 更新默认连线样式
  editor.setDefaultEdgeStyle({
    lineStyle: edgeLineStyle.value,
    useSmartRouting: useSmartRouting.value
  })

  // 更新所有现有的折线边
  const edges = editor.getEdges()
  edges.forEach((edge: any) => {
    if (edge.style.lineStyle === 'orthogonal') {
      editor!.updateEdgeStyle(edge.id, { useSmartRouting: useSmartRouting.value })
    }
  })
}

function togglePencilMode() {
  isPencilMode.value = !isPencilMode.value
  if (!editor) return
  editor.setPencilMode(isPencilMode.value)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function toggleMinimap() {
  if (!editor) return
  editor.toggleMinimap()
  minimapVisible.value = editor.isMinimapVisible()
}

// 对齐工具
function alignLeft() { editor?.alignLeft() }
function alignCenterHorizontal() { editor?.alignCenterHorizontal() }
function alignRight() { editor?.alignRight() }
function alignTop() { editor?.alignTop() }
function alignCenterVertical() { editor?.alignCenterVertical() }
function alignBottom() { editor?.alignBottom() }
function distributeHorizontally() { editor?.distributeHorizontally() }
function distributeVertically() { editor?.distributeVertically() }

function toggleTheme() {
  if (!editor) return
  const newTheme = theme.value === 'light' ? 'dark' : 'light'
  editor.setTheme(newTheme)
  theme.value = newTheme
}

function updateSelectedNodesStyle() {
  if (!editor || selectedNodes.value.length === 0) return
  editor.updateNodesStyle(selectedNodes.value, nodeStyle.value)
}

function updateSelectedEdgesStyle() {
  if (!editor || selectedEdges.value.length === 0) return
  selectedEdges.value.forEach((edgeId: string) => {
    editor!.updateEdgeStyle(edgeId, edgeStyle.value)
  })
  // 如果改变了连线类型，需要更新路径
  editor['updateEdges']()
  editor['renderer'].markDirty()
}

function exportJSON() {
  if (!editor) return
  const json = editor.exportToJSON()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `graphite-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importJSON() {
  if (!editor) return
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        editor!.importFromJSON(e.target?.result as string)
      } catch (error) {
        alert('导入失败：' + error)
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

function exportPNG() {
  if (!editor) return
  const a = document.createElement('a')
  a.href = editor.exportToPNG()
  a.download = `graphite-${Date.now()}.png`
  a.click()
}

function exportSVG() {
  if (!editor) return
  const blob = new Blob([editor.exportToSVG()], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `graphite-${Date.now()}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

function groupSelected() { editor?.groupSelected('Group') }
function ungroupSelected() { editor?.ungroupSelected() }

function zoomIn() {
  if (!editor) return
  editor.zoomIn()
}

function zoomOut() {
  if (!editor) return
  editor.zoomOut()
}

function resetZoom() {
  if (!editor) return
  editor.resetZoom()
}
</script>

<style scoped>
.playground {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  position: relative;
}

.canvas {
  flex: 1;
  min-width: 0;
  background: #fff;
}

/* 左侧形状面板 */
.shapes-panel {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(250, 250, 250, 0.98);
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  z-index: 50;
  box-sizing: border-box;
  transition: width 0.2s ease;
}

.shapes-panel.collapsed {
  width: 40px !important;
}

.panel-header {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid #e5e5e5;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.collapse-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #888;
  transition: background 0.15s, color 0.15s;
}

.collapse-btn:hover {
  background: #e8e8e8;
  color: #333;
}

.shapes-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.shape-category {
  margin-bottom: 20px;
}

.category-title {
  font-size: 11px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.shape-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  margin-bottom: 8px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.15s;
  user-select: none;
}

.shape-item:hover {
  background: #f5f5f5;
  border-color: #1976d2;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.shape-item:active {
  cursor: grabbing;
}

.shape-item span {
  margin-top: 6px;
  font-size: 11px;
  color: #666;
}

.edge-style-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  margin-bottom: 6px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.edge-style-item:hover {
  background: #f5f5f5;
  border-color: #1976d2;
}

.edge-style-item.active {
  background: #e3f2fd;
  border-color: #1976d2;
}

.edge-style-item span {
  font-size: 11px;
  color: #666;
}

.toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 12px;
  color: #666;
}

.toggle-btn:hover {
  background: #f5f5f5;
  border-color: #1976d2;
}

.toggle-btn.active {
  background: #e3f2fd;
  border-color: #1976d2;
  color: #1976d2;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: ew-resize;
  background: transparent;
  transition: background 0.15s;
}

.resize-handle:hover {
  background: #1976d2;
}

/* 右侧样式面板：绝对定位覆盖画布，不参与 flex 布局，避免 canvas 宽度变化触发 ResizeObserver 重绘 */
.sidebar {
  position: absolute;
  top: 0;
  right: 0;
  width: 240px;
  height: 100%;
  background: rgba(250, 250, 250, 0.96);
  border-left: 1px solid #e5e5e5;
  padding: 16px;
  overflow-y: auto;
  z-index: 50;
  box-sizing: border-box;
}

.sidebar h3 {
  margin: 0 0 16px 0;
  font-size: 13px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.style-control {
  margin-bottom: 16px;
}

.style-control label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #666;
}

.style-control input[type="color"] {
  width: 100%;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.style-control input[type="range"] {
  width: calc(100% - 44px);
  margin-right: 8px;
  vertical-align: middle;
}

.style-control span {
  font-size: 11px;
  color: #888;
  min-width: 36px;
  display: inline-block;
}

.style-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  background: white;
  cursor: pointer;
  outline: none;
}

.style-select:hover {
  border-color: #1976d2;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkbox-wrapper span {
  font-size: 12px;
  color: #666;
}

/* 浮动工具栏 */
.floating-toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1px;
  background: #ffffff;
  border: 1px solid #e2e2e2;
  border-radius: 12px;
  padding: 4px 6px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.10), 0 1px 4px rgba(0, 0, 0, 0.06);
  z-index: 100;
  user-select: none;
  /* 防止工具栏过宽时出界 */
  max-width: calc(100% - 40px);
  flex-wrap: nowrap;
}

.icon-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 7px;
  cursor: pointer;
  color: #555;
  transition: background 0.12s, color 0.12s;
  flex-shrink: 0;
  padding: 0;
  position: relative;
}

.icon-btn:hover:not(:disabled) {
  background: #f2f2f2;
  color: #111;
}

.icon-btn:active:not(:disabled) {
  background: #e8e8e8;
}

.icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.icon-btn.danger:hover:not(:disabled) {
  background: #fff0f0;
  color: #d93025;
}

.toolbar-sep {
  width: 1px;
  height: 20px;
  background: #e5e5e5;
  margin: 0 4px;
  flex-shrink: 0;
}

.zoom-display {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  height: 30px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 500;
  color: #555;
  background: #f8f8f8;
  border-radius: 6px;
  user-select: none;
  flex-shrink: 0;
}

.layout-select {
  height: 30px;
  padding: 0 6px;
  border: 1px solid #e2e2e2;
  border-radius: 6px;
  font-size: 12px;
  color: #555;
  background: transparent;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
  margin-right: 1px;
}

.shape-select {
  height: 30px;
  padding: 0 6px;
  border: 1px solid #e2e2e2;
  border-radius: 6px;
  font-size: 12px;
  color: #555;
  background: transparent;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
  margin-left: 1px;
}

.shape-select:hover,
.layout-select:hover {
  border-color: #bbb;
  background: #f2f2f2;
}

/* 自定义 tooltip */
.btn-tip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 30, 0.85);
  color: #fff;
  font-size: 11px;
  line-height: 1.4;
  padding: 4px 8px;
  border-radius: 5px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 200;
}

.icon-btn:hover .btn-tip {
  opacity: 1;
}

.icon-btn.active {
  background: #e3f2fd;
  color: #1976d2;
}

.btn-tip kbd {
  display: inline-block;
  font-family: inherit;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 3px;
  padding: 0 4px;
  margin-left: 4px;
}

/* 导出下拉 */
.dropdown-group {
  position: relative;
  display: flex;
  align-items: center;
}

.export-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border: 1px solid #e2e2e2;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
  min-width: 120px;
  z-index: 300;
}

.export-item {
  padding: 8px 14px;
  font-size: 12px;
  color: #333;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s;
}

.export-item:hover {
  background: #f5f5f5;
}
</style>
