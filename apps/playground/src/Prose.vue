<template>
  <div class="prose-playground">
    <ProseEditor
      v-model="content"
      placeholder="输入 / 打开命令菜单..."
      :editable="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ProseEditor } from '@recall/prose'

const content = ref(`
  <h1>欢迎使用 Recall Prose 编辑器</h1>
  <p>这是一个功能强大的散文编辑器，基于 <strong>Tiptap</strong> 构建。</p>

  <h2>新功能</h2>
  <ul>
    <li><strong>斜线菜单</strong>：输入 <code>/</code> 打开命令菜单</li>
    <li><strong>悬浮工具栏</strong>：选中文本后自动显示格式化工具</li>
    <li><strong>拖拽支持</strong>：可以拖拽节点重新排序</li>
  </ul>

  <h3>试试这些功能：</h3>
  <ul data-type="taskList">
    <li data-type="taskItem" data-checked="true"><p>输入 / 打开斜线菜单</p></li>
    <li data-type="taskItem" data-checked="true"><p>选中文本查看悬浮工具栏</p></li>
    <li data-type="taskItem" data-checked="false"><p>拖拽段落重新排序</p></li>
  </ul>

  <div data-type="callout" data-callout-type="info" class="callout callout-info">
    <p>💡 提示：悬停在段落左侧可以看到拖拽按钮！</p>
  </div>
`)
</script>

<style scoped>
.prose-playground {
  width: 100%;
  height: 100vh;
  background: #fff;
  overflow: auto;
}
</style>
