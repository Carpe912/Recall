<template>
  <div class="prose-playground">
    <div class="header">
      <h1>Recall Prose 编辑器</h1>
      <a href="/" class="back-link">← 返回图形编辑器</a>
    </div>

    <div class="prose-demo">
      <h2>Prose 编辑器演示</h2>
      <p class="description">基于 Tiptap 的功能丰富的散文编辑器，支持分栏和高亮块等自定义功能</p>

      <div class="editor-wrapper">
        <ProseEditor
          v-model="content"
          placeholder="在这里开始输入..."
          :editable="true"
          :show-toolbar="true"
          @update="handleUpdate"
        />
      </div>

      <div class="output-section">
        <h3>输出预览</h3>
        <div class="output-tabs">
          <button
            :class="{ active: outputTab === 'html' }"
            @click="outputTab = 'html'"
          >
            HTML
          </button>
          <button
            :class="{ active: outputTab === 'json' }"
            @click="outputTab = 'json'"
          >
            JSON
          </button>
          <button
            :class="{ active: outputTab === 'text' }"
            @click="outputTab = 'text'"
          >
            纯文本
          </button>
        </div>
        <pre class="output-content">{{ outputContent }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ProseEditor } from '@recall/prose'
import '@recall/prose/style.css'

const outputTab = ref<'html' | 'json' | 'text'>('html')

const content = ref('')
const editorOutput = ref<{ html: string; json: object; text: string }>({
  html: '',
  json: {},
  text: ''
})

const handleUpdate = (value: { html: string; json: object; text: string }) => {
  editorOutput.value = value
}

const outputContent = computed(() => {
  switch (outputTab.value) {
    case 'html':
      return editorOutput.value.html
    case 'json':
      return JSON.stringify(editorOutput.value.json, null, 2)
    case 'text':
      return editorOutput.value.text
    default:
      return ''
  }
})

onMounted(() => {
  content.value = `
    <h1>欢迎使用 Recall Prose 编辑器</h1>
    <p>这是一个功能强大的散文编辑器，基于 <strong>Tiptap</strong> 构建，支持分栏和高亮块等自定义功能。</p>

    <div data-type="callout" data-callout-type="info" class="callout callout-info">
      <p>💡 这是一个信息提示块，可以用来展示重要信息。</p>
    </div>

    <h2>主要特性</h2>
    <ul>
      <li>丰富的文本格式支持</li>
      <li>表格、图片、链接等多媒体内容</li>
      <li>任务列表和代码块</li>
      <li>分栏布局</li>
      <li>多种类型的高亮块（信息、警告、成功、错误、笔记）</li>
    </ul>

    <h3>试试这些功能：</h3>
    <ul data-type="taskList">
      <li data-type="taskItem" data-checked="true"><p>粗体、斜体、下划线</p></li>
      <li data-type="taskItem" data-checked="true"><p>标题和列表</p></li>
      <li data-type="taskItem" data-checked="false"><p>插入表格和分栏</p></li>
      <li data-type="taskItem" data-checked="false"><p>添加高亮块</p></li>
    </ul>

    <div data-type="callout" data-callout-type="success" class="callout callout-success">
      <p>✅ 使用工具栏可以快速应用各种格式和插入自定义元素！</p>
    </div>
  `
})
</script>

<style scoped>
.prose-playground {
  width: 100%;
  min-height: 100vh;
  background: #f8f9fa;
  padding: 24px;
}

.header {
  max-width: 1400px;
  margin: 0 auto 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #212529;
}

.back-link {
  color: #228be6;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border: 1px solid #228be6;
  border-radius: 6px;
  transition: all 0.2s;
}

.back-link:hover {
  background: #228be6;
  color: white;
}

.prose-demo {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.prose-demo h2 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: #212529;
}

.description {
  margin: 0 0 24px;
  color: #6c757d;
  font-size: 16px;
}

.editor-wrapper {
  margin-bottom: 32px;
}

.output-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 2px solid #e9ecef;
}

.output-section h3 {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
  color: #212529;
}

.output-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.output-tabs button {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #495057;
  transition: all 0.2s;
}

.output-tabs button:hover {
  background: #f8f9fa;
}

.output-tabs button.active {
  background: #228be6;
  color: white;
  border-color: #228be6;
}

.output-content {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px;
  margin: 0;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #212529;
  max-height: 400px;
  overflow-y: auto;
}
</style>
