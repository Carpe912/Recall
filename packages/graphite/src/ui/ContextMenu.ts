export type MenuItem =
  | { label: string; action: () => void; disabled?: boolean; divider?: false }
  | { divider: true; label?: never; action?: never; disabled?: never }

export class ContextMenu {
  private element: HTMLDivElement
  private isVisible: boolean = false

  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'graphite-context-menu'
    this.element.style.cssText = `
      position: fixed;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      padding: 4px 0;
      min-width: 160px;
      z-index: 10000;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
    `
    document.body.appendChild(this.element)

    // 点击外部关闭菜单
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target as Node)) {
        this.hide()
      }
    })

    // 滚动时关闭菜单
    document.addEventListener('scroll', () => {
      this.hide()
    }, true)
  }

  show(x: number, y: number, items: MenuItem[]): void {
    this.element.innerHTML = ''

    items.forEach(item => {
      if (item.divider) {
        const divider = document.createElement('div')
        divider.style.cssText = `
          height: 1px;
          background: #e0e0e0;
          margin: 4px 0;
        `
        this.element.appendChild(divider)
        return
      }

      const menuItem = document.createElement('div')
      menuItem.textContent = item.label
      menuItem.style.cssText = `
        padding: 8px 16px;
        cursor: ${item.disabled ? 'not-allowed' : 'pointer'};
        color: ${item.disabled ? '#999' : '#333'};
        transition: background 0.2s;
      `

      if (!item.disabled) {
        menuItem.addEventListener('mouseenter', () => {
          menuItem.style.background = '#f5f5f5'
        })
        menuItem.addEventListener('mouseleave', () => {
          menuItem.style.background = 'transparent'
        })
        menuItem.addEventListener('click', () => {
          item.action()
          this.hide()
        })
      }

      this.element.appendChild(menuItem)
    })

    // 先用 visibility:hidden 显示以获取实际尺寸，避免闪烁到旧位置
    this.element.style.visibility = 'hidden'
    this.element.style.display = 'block'
    const menuWidth = this.element.offsetWidth
    const menuHeight = this.element.offsetHeight

    // 调整位置，确保不超出视口
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let finalX = x
    let finalY = y

    if (x + menuWidth > viewportWidth) {
      finalX = viewportWidth - menuWidth - 10
    }

    if (y + menuHeight > viewportHeight) {
      finalY = viewportHeight - menuHeight - 10
    }

    this.element.style.left = `${finalX}px`
    this.element.style.top = `${finalY}px`
    this.element.style.visibility = 'visible'

    this.isVisible = true
  }

  hide(): void {
    this.element.style.display = 'none'
    this.isVisible = false
  }

  destroy(): void {
    document.body.removeChild(this.element)
  }
}
