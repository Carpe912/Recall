export type Theme = 'light' | 'dark'

export interface ThemeColors {
  background: string
  grid: string
  text: string
  nodeFill: string
  nodeStroke: string
  edgeStroke: string
}

export const themes: Record<Theme, ThemeColors> = {
  light: {
    background: '#ffffff',
    grid: '#f0f0f0',
    text: '#333333',
    nodeFill: '#ffffff',
    nodeStroke: '#333333',
    edgeStroke: '#666666',
  },
  dark: {
    background: '#1e1e1e',
    grid: '#2d2d2d',
    text: '#e0e0e0',
    nodeFill: '#2d2d2d',
    nodeStroke: '#666666',
    edgeStroke: '#888888',
  },
}

export class ThemeManager {
  private currentTheme: Theme = 'light'

  constructor(theme: Theme = 'light') {
    this.currentTheme = theme
  }

  getTheme(): Theme {
    return this.currentTheme
  }

  setTheme(theme: Theme): void {
    this.currentTheme = theme
  }

  getColors(): ThemeColors {
    return themes[this.currentTheme]
  }

  // 从 localStorage 加载主题
  static loadTheme(): Theme {
    const saved = localStorage.getItem('graphite-theme')
    return (saved === 'dark' ? 'dark' : 'light') as Theme
  }

  // 保存主题到 localStorage
  static saveTheme(theme: Theme): void {
    localStorage.setItem('graphite-theme', theme)
  }
}
