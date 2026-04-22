<template>
  <div class="prose-playground">
    <div class="header">
      <h1>Recall Prose 编辑器</h1>
      <div class="header-actions">
        <div class="view-mode">
          <select v-model="viewMode" class="view-mode-select" aria-label="视图模式">
            <option value="wysiwyg">所见即所得</option>
            <option value="preview">实时预览</option>
          </select>
        </div>
        <a href="/" class="back-link">← 返回图形编辑器</a>
      </div>
    </div>

    <div class="editor-container">
      <div class="editor-panel">
        <div class="editor-wrapper">
          <ProseEditor
            v-model="content"
            placeholder="输入 / 打开命令菜单..."
            :editable="true"
            :show-toolbar="true"
            @update="handleUpdate"
          />
        </div>
      </div>

      <div v-if="viewMode === 'preview'" class="divider"></div>

      <div v-if="viewMode === 'preview'" class="markdown-panel">
        <div class="markdown-wrapper">
          <textarea
            v-model="markdownContent"
            class="markdown-editor"
            placeholder="Markdown 内容..."
            @input="handleMarkdownInput"
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ProseEditor } from '@recall/prose'

const content = ref('')
const markdownContent = ref('')
const viewMode = ref<'wysiwyg' | 'preview'>('preview')
const editorOutput = ref<{ html: string; json: object; text: string }>({
  html: '',
  json: {},
  text: ''
})

// 简单的HTML到Markdown转换
const htmlToMarkdown = (html: string): string => {
  let md = html

  // 标题
  md = md.replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
  md = md.replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
  md = md.replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
  md = md.replace(/<h4>(.*?)<\/h4>/g, '#### $1\n')
  md = md.replace(/<h5>(.*?)<\/h5>/g, '##### $1\n')
  md = md.replace(/<h6>(.*?)<\/h6>/g, '###### $1\n')

  // 粗体和斜体
  md = md.replace(/<strong>(.*?)<\/strong>/g, '**$1**')
  md = md.replace(/<b>(.*?)<\/b>/g, '**$1**')
  md = md.replace(/<em>(.*?)<\/em>/g, '*$1*')
  md = md.replace(/<i>(.*?)<\/i>/g, '*$1*')
  md = md.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
  md = md.replace(/<s>(.*?)<\/s>/g, '~~$1~~')

  // 代码
  md = md.replace(/<code>(.*?)<\/code>/g, '`$1`')
  md = md.replace(/<pre><code>(.*?)<\/code><\/pre>/gs, '```\n$1\n```\n')

  // 链接
  md = md.replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')

  // 列表
  md = md.replace(/<ul>(.*?)<\/ul>/gs, (match, content) => {
    return content.replace(/<li>(.*?)<\/li>/g, '- $1\n')
  })
  md = md.replace(/<ol>(.*?)<\/ol>/gs, (match, content) => {
    let index = 1
    return content.replace(/<li>(.*?)<\/li>/g, () => `${index++}. $1\n`)
  })

  // 引用
  md = md.replace(/<blockquote>(.*?)<\/blockquote>/gs, (match, content) => {
    return content.split('\n').map((line: string) => `> ${line}`).join('\n') + '\n'
  })

  // 分割线
  md = md.replace(/<hr\s*\/?>/g, '\n---\n')

  // 段落
  md = md.replace(/<p>(.*?)<\/p>/g, '$1\n\n')

  // 清理HTML标签
  md = md.replace(/<[^>]+>/g, '')

  // 清理多余空行
  md = md.replace(/\n{3,}/g, '\n\n')

  return md.trim()
}

// 简单的Markdown到HTML转换
const markdownToHtml = (md: string): string => {
  let html = md

  // 标题
  html = html.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
  html = html.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
  html = html.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')

  // 粗体和斜体
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>')

  // 代码
  html = html.replace(/```(.*?)\n(.*?)```/gs, '<pre><code>$2</code></pre>')
  html = html.replace(/`(.+?)`/g, '<code>$1</code>')

  // 链接
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')

  // 列表
  html = html.replace(/^\-\s+(.*)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
  html = html.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>')

  // 引用
  html = html.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>')

  // 分割线
  html = html.replace(/^---$/gm, '<hr>')

  // 段落
  html = html.replace(/^(?!<[huo]|<pre|<blockquote)(.+)$/gm, '<p>$1</p>')

  return html
}

const handleUpdate = (value: { html: string; json: object; text: string }) => {
  editorOutput.value = value
  markdownContent.value = htmlToMarkdown(value.html)
}

let isUpdatingFromMarkdown = false

const handleMarkdownInput = () => {
  if (isUpdatingFromMarkdown) return

  isUpdatingFromMarkdown = true
  const html = markdownToHtml(markdownContent.value)
  content.value = html

  setTimeout(() => {
    isUpdatingFromMarkdown = false
  }, 100)
}

// 初始内容
content.value = `
  <h1>欢迎使用 Recall Prose 编辑器</h1>
  <p>这是一个功能强大的散文编辑器，基于 <strong>Tiptap</strong> 构建。</p>

  <h2>新功能</h2>
  <ul>
    <li><strong>斜线菜单</strong>：输入 <code>/</code> 打开命令菜单</li>
    <li><strong>悬浮工具栏</strong>：选中文本后自动显示格式化工具</li>
    <li><strong>拖拽支持</strong>：可以拖拽节点重新排序</li>
    <li><strong>Markdown 联动</strong>：左右两栏实时同步</li>
  </ul>

  <h3>试试这些功能：</h3>
  <ul data-type="taskList">
    <li data-type="taskItem" data-checked="true"><p>输入 / 打开斜线菜单</p></li>
    <li data-type="taskItem" data-checked="true"><p>选中文本查看悬浮工具栏</p></li>
    <li data-type="taskItem" data-checked="false"><p>在右侧编辑 Markdown</p></li>
    <li data-type="taskItem" data-checked="false"><p>拖拽段落重新排序</p></li>
  </ul>

  <div data-type="callout" data-callout-type="info" class="callout callout-info">
    <p>💡 提示：所有编辑都会实时同步到右侧的 Markdown 编辑器！</p>
  </div>
`
</script>

<style scoped>
.prose-playground {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.header {
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-mode-select {
  border: 1px solid #ced4da;
  background: white;
  color: #212529;
  font-size: 14px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #212529;
}

.back-link {
  color: #228be6;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 12px;
  border: 1px solid #228be6;
  border-radius: 6px;
  transition: all 0.2s;
}

.back-link:hover {
  background: #228be6;
  color: white;
}

.editor-container {
  flex: 1;
  display: flex;
  gap: 0;
  overflow: visible;
  min-height: 0;
}

.editor-panel,
.markdown-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  min-width: 0;
}

.divider {
  width: 1px;
  background: #e0e0e0;
  flex-shrink: 0;
}

.editor-wrapper,
.markdown-wrapper {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.markdown-editor {
  width: 100%;
  height: 100%;
  padding: 20px;
  border: none;
  outline: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #212529;
  resize: none;
  background: #f8f9fa;
}

.markdown-editor::placeholder {
  color: #adb5bd;
}
</style>
