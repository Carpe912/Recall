import type { ICommand } from '../types'

export class CommandManager {
  private history: ICommand[] = []
  private current: number = -1
  private maxHistory: number = 100

  // 执行命令
  execute(command: ICommand): void {
    command.execute()
    this.addToHistory(command)
  }

  // 添加命令到历史（不执行）
  addToHistory(command: ICommand): void {
    // 清除当前位置之后的历史
    this.history = this.history.slice(0, this.current + 1)

    // 添加新命令
    this.history.push(command)
    this.current++

    // 限制历史记录数量
    if (this.history.length > this.maxHistory) {
      this.history.shift()
      this.current--
    }
  }

  // 撤销
  undo(): boolean {
    if (!this.canUndo()) return false

    this.history[this.current].undo()
    this.current--
    return true
  }

  // 重做
  redo(): boolean {
    if (!this.canRedo()) return false

    this.current++
    this.history[this.current].execute()
    return true
  }

  // 是否可以撤销
  canUndo(): boolean {
    return this.current >= 0
  }

  // 是否可以重做
  canRedo(): boolean {
    return this.current < this.history.length - 1
  }

  // 清空历史
  clear(): void {
    this.history = []
    this.current = -1
  }

  // 获取历史记录数量
  getHistorySize(): number {
    return this.history.length
  }
}
