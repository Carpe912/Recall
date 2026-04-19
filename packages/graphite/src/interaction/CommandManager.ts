import type { ICommand } from '../types'

/**
 * CompoundCommand — groups multiple commands into one atomic undo/redo unit.
 * This is the basis of the transaction mechanism: all commands recorded
 * during a beginTransaction/commitTransaction block are bundled here.
 */
export class CompoundCommand implements ICommand {
  private commands: ICommand[]
  readonly label: string

  constructor(commands: ICommand[], label: string = '') {
    this.commands = commands
    this.label = label
  }

  execute(): void {
    this.commands.forEach(cmd => cmd.execute())
  }

  undo(): void {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo()
    }
  }

  /** Number of sub-commands (useful for discarding empty transactions). */
  get size(): number {
    return this.commands.length
  }
}

export class CommandManager {
  private history: ICommand[] = []
  private current: number = -1
  private maxHistory: number = 100

  // Transaction support
  private transactionDepth: number = 0
  private pendingCommands: ICommand[] = []
  private pendingLabel: string = ''

  // ---- Transaction API ----

  /**
   * Begin a transaction. All commands executed inside will be grouped into
   * a single CompoundCommand on commit, so Undo undoes all of them at once.
   * Transactions can be nested; only the outermost commit flushes.
   */
  beginTransaction(label: string = ''): void {
    if (this.transactionDepth === 0) {
      this.pendingCommands = []
      this.pendingLabel = label
    }
    this.transactionDepth++
  }

  /**
   * Commit the current transaction. If the outermost transaction is committed
   * and there are pending commands, they are bundled into a CompoundCommand
   * and added to the history as a single entry.
   */
  commitTransaction(): void {
    if (this.transactionDepth === 0) return
    this.transactionDepth--

    if (this.transactionDepth === 0 && this.pendingCommands.length > 0) {
      const compound = new CompoundCommand([...this.pendingCommands], this.pendingLabel)
      this.pendingCommands = []
      this.pendingLabel = ''
      this._addToHistory(compound)
    }
  }

  /**
   * Abort the current transaction: discard all pending commands without
   * touching the history stack, and undo any side-effects already executed.
   */
  rollbackTransaction(): void {
    if (this.transactionDepth === 0) return
    this.transactionDepth = 0

    // Undo already-executed pending commands in reverse order
    for (let i = this.pendingCommands.length - 1; i >= 0; i--) {
      this.pendingCommands[i].undo()
    }
    this.pendingCommands = []
    this.pendingLabel = ''
  }

  /** Whether a transaction is currently open. */
  isInTransaction(): boolean {
    return this.transactionDepth > 0
  }

  // ---- Core command methods ----

  /**
   * Execute a command immediately.
   * Inside a transaction the command is added to the pending batch instead of
   * being committed to the history directly.
   */
  execute(command: ICommand): void {
    command.execute()
    if (this.transactionDepth > 0) {
      this.pendingCommands.push(command)
    } else {
      this._addToHistory(command)
    }
  }

  /**
   * Add a command to history without executing it again.
   * (Used after drag-end where the side-effect already happened.)
   * Inside a transaction the command joins the pending batch.
   */
  addToHistory(command: ICommand): void {
    if (this.transactionDepth > 0) {
      this.pendingCommands.push(command)
    } else {
      this._addToHistory(command)
    }
  }

  private _addToHistory(command: ICommand): void {
    // Clear redo branch
    this.history = this.history.slice(0, this.current + 1)
    this.history.push(command)
    this.current++

    // Enforce size limit
    if (this.history.length > this.maxHistory) {
      this.history.shift()
      this.current--
    }
  }

  // ---- Undo / Redo ----

  undo(): boolean {
    if (!this.canUndo()) return false
    this.history[this.current].undo()
    this.current--
    return true
  }

  redo(): boolean {
    if (!this.canRedo()) return false
    this.current++
    this.history[this.current].execute()
    return true
  }

  canUndo(): boolean {
    return this.current >= 0
  }

  canRedo(): boolean {
    return this.current < this.history.length - 1
  }

  clear(): void {
    this.history = []
    this.current = -1
    this.pendingCommands = []
    this.transactionDepth = 0
  }

  getHistorySize(): number {
    return this.history.length
  }
}
