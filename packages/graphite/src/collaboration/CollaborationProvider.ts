/**
 * Yjs CRDT collaboration provider for GraphiteEditor.
 *
 * USAGE:
 *   Install peer dependency: pnpm add yjs y-websocket
 *
 *   import * as Y from 'yjs'
 *   import { WebsocketProvider } from 'y-websocket'
 *   import { GraphiteEditor } from '@recall/graphite'
 *   import { CollaborationProvider } from '@recall/graphite/collaboration'
 *
 *   const ydoc = new Y.Doc()
 *   const wsProvider = new WebsocketProvider('ws://localhost:1234', 'my-room', ydoc)
 *   const collab = new CollaborationProvider(editor, ydoc)
 *   collab.connect()
 */

import type { GraphiteEditor } from '../GraphiteEditor'

// Minimal Yjs type stubs so we don't require yjs at build time.
// At runtime, pass a real Y.Doc instance.
interface YDoc {
  getMap(name: string): YMap
  transact(fn: () => void): void
  on(event: string, handler: (...args: unknown[]) => void): void
  off(event: string, handler: (...args: unknown[]) => void): void
  destroy(): void
}

interface YMap {
  set(key: string, value: unknown): void
  get(key: string): unknown
  delete(key: string): void
  has(key: string): boolean
  toJSON(): Record<string, unknown>
  observe(handler: (event: YMapEvent) => void): void
  unobserve(handler: (event: YMapEvent) => void): void
  forEach(handler: (value: unknown, key: string) => void): void
}

interface YMapEvent {
  keysChanged: Set<string>
  transaction: { local: boolean }
}

export interface CollaborationOptions {
  /** Throttle local updates to avoid flooding (ms). Default: 50 */
  throttleMs?: number
  /** Field name for nodes map in ydoc. Default: 'graphite_nodes' */
  nodesMapName?: string
  /** Field name for edges map in ydoc. Default: 'graphite_edges' */
  edgesMapName?: string
}

export class CollaborationProvider {
  private editor: GraphiteEditor
  private ydoc: YDoc
  private nodesMap: YMap
  private edgesMap: YMap
  private options: Required<CollaborationOptions>
  private connected: boolean = false
  private applyingRemote: boolean = false
  private flushTimer: ReturnType<typeof setTimeout> | null = null

  constructor(editor: GraphiteEditor, ydoc: YDoc, options: CollaborationOptions = {}) {
    this.editor = editor
    this.ydoc = ydoc
    this.options = {
      throttleMs: options.throttleMs ?? 50,
      nodesMapName: options.nodesMapName ?? 'graphite_nodes',
      edgesMapName: options.edgesMapName ?? 'graphite_edges',
    }

    this.nodesMap = ydoc.getMap(this.options.nodesMapName)
    this.edgesMap = ydoc.getMap(this.options.edgesMapName)
  }

  connect(): void {
    if (this.connected) return
    this.connected = true

    // Listen for remote changes
    this.nodesMap.observe(this.onNodesChanged)
    this.edgesMap.observe(this.onEdgesChanged)

    // Listen for local editor changes and push to Yjs
    this.editor.on('selectionChanged', this.scheduleFlush)
    this.editor.on('nodesChanged', this.scheduleFlush)
    this.editor.on('edgesChanged', this.scheduleFlush)

    // Seed local state from ydoc if it has data, else push our state
    const remoteNodeCount = Object.keys(this.nodesMap.toJSON()).length
    if (remoteNodeCount > 0) {
      this.applyRemoteState()
    } else {
      this.flush()
    }
  }

  disconnect(): void {
    if (!this.connected) return
    this.connected = false

    this.nodesMap.unobserve(this.onNodesChanged)
    this.edgesMap.unobserve(this.onEdgesChanged)

    this.editor.off('selectionChanged', this.scheduleFlush)
    this.editor.off('nodesChanged', this.scheduleFlush)
    this.editor.off('edgesChanged', this.scheduleFlush)

    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }

  destroy(): void {
    this.disconnect()
  }

  // ----- Local → Remote -----

  private scheduleFlush = (): void => {
    if (this.applyingRemote) return
    if (this.flushTimer !== null) return

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null
      this.flush()
    }, this.options.throttleMs)
  }

  private flush(): void {
    const nodes = this.editor.getNodes()
    const edges = this.editor.getEdges()

    this.ydoc.transact(() => {
      // Sync nodes
      const remoteNodeKeys = new Set(Object.keys(this.nodesMap.toJSON()))

      nodes.forEach(node => {
        const data = {
          id: node.id,
          x: node.transform.x,
          y: node.transform.y,
          width: node.width,
          height: node.height,
          content: node.content,
          style: { ...node.style },
        }
        this.nodesMap.set(node.id, JSON.stringify(data))
        remoteNodeKeys.delete(node.id)
      })

      // Remove stale nodes
      remoteNodeKeys.forEach(key => this.nodesMap.delete(key))

      // Sync edges
      const remoteEdgeKeys = new Set(Object.keys(this.edgesMap.toJSON()))

      edges.forEach(edge => {
        const data = {
          id: edge.id,
          from: edge.fromNodeId,
          to: edge.toNodeId,
          style: { ...edge.style },
        }
        this.edgesMap.set(edge.id, JSON.stringify(data))
        remoteEdgeKeys.delete(edge.id)
      })

      // Remove stale edges
      remoteEdgeKeys.forEach(key => this.edgesMap.delete(key))
    })
  }

  // ----- Remote → Local -----

  private onNodesChanged = (event: YMapEvent): void => {
    if (event.transaction.local) return
    this.applyRemoteState()
  }

  private onEdgesChanged = (event: YMapEvent): void => {
    if (event.transaction.local) return
    this.applyRemoteState()
  }

  private applyRemoteState(): void {
    this.applyingRemote = true
    try {
      const nodesJson = this.nodesMap.toJSON() as Record<string, string>
      const edgesJson = this.edgesMap.toJSON() as Record<string, string>

      const graph = {
        nodes: Object.values(nodesJson).map(v => JSON.parse(v)),
        edges: Object.values(edgesJson).map(v => JSON.parse(v)),
      }

      this.editor.importFromJSON(JSON.stringify(graph))
    } finally {
      this.applyingRemote = false
    }
  }

  // ----- Awareness (cursor presence) -----

  /**
   * Attach Yjs awareness to broadcast local cursor position.
   * Requires y-protocols awareness to be set up on the provider.
   *
   * @param awareness - Y awareness instance (from y-websocket or y-webrtc)
   * @param userId    - Unique identifier for this user
   * @param userName  - Display name
   */
  attachAwareness(
    awareness: { setLocalStateField: (key: string, value: unknown) => void; on: (event: string, handler: () => void) => void },
    userId: string,
    userName: string
  ): void {
    awareness.setLocalStateField('user', { id: userId, name: userName })

    this.editor.on('mousemove', (point: { x: number; y: number }) => {
      awareness.setLocalStateField('cursor', { x: point.x, y: point.y })
    })
  }
}
