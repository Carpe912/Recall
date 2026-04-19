import type { Node } from '../core/Node'
import type { Edge } from '../core/Edge'

/**
 * A connection rule function.
 * Return `true` to allow the connection.
 * Return `false` or an error string to reject it.
 */
export type ConnectionRule = (
  fromNode: Node,
  toNode: Node,
  fromPortId: string,
  toPortId: string,
  existingEdges: Edge[]
) => true | false | string

export interface ValidationResult {
  valid: boolean
  /** Human-readable reason when valid === false */
  reason?: string
}

export class ConnectionValidator {
  private rules: Array<{ name: string; rule: ConnectionRule }> = []

  /**
   * Register a named rule. Rules are evaluated in registration order.
   * The first failing rule short-circuits the rest.
   */
  addRule(name: string, rule: ConnectionRule): this {
    this.rules.push({ name, rule })
    return this
  }

  /** Remove a previously registered rule by name. */
  removeRule(name: string): this {
    this.rules = this.rules.filter(r => r.name !== name)
    return this
  }

  /** Remove all rules. */
  clearRules(): this {
    this.rules = []
    return this
  }

  validate(
    fromNode: Node,
    toNode: Node,
    fromPortId: string,
    toPortId: string,
    existingEdges: Edge[]
  ): ValidationResult {
    for (const { name, rule } of this.rules) {
      const result = rule(fromNode, toNode, fromPortId, toPortId, existingEdges)
      if (result !== true) {
        return {
          valid: false,
          reason: typeof result === 'string' ? result : `Rule "${name}" rejected the connection`,
        }
      }
    }
    return { valid: true }
  }

  // ── Built-in rules ──────────────────────────────────────────────────────────

  /**
   * Reject self-loops (connecting a node to itself).
   */
  static noSelfLoop: ConnectionRule = (fromNode, toNode) => {
    if (fromNode.id === toNode.id) return 'Cannot connect a node to itself'
    return true
  }

  /**
   * Reject duplicate edges between the same two nodes (in either direction).
   */
  static noDuplicateEdge: ConnectionRule = (fromNode, toNode, _fp, _tp, existingEdges) => {
    const duplicate = existingEdges.some(
      e =>
        (e.fromNodeId === fromNode.id && e.toNodeId === toNode.id) ||
        (e.fromNodeId === toNode.id && e.toNodeId === fromNode.id)
    )
    if (duplicate) return 'An edge between these nodes already exists'
    return true
  }

  /**
   * Enforce port type compatibility:
   * - output → input   ✓
   * - output → both    ✓
   * - both   → input   ✓
   * - both   → both    ✓
   * - input  → *       ✗  (source cannot be an input-only port)
   * - *      → output  ✗  (target cannot be an output-only port)
   */
  static portTypeCompatibility: ConnectionRule = (fromNode, toNode, fromPortId, toPortId) => {
    const fromPort = fromNode.ports.find(p => p.id === fromPortId)
    const toPort = toNode.ports.find(p => p.id === toPortId)

    if (fromPort?.type === 'input') {
      return `Port "${fromPortId}" is input-only and cannot be a connection source`
    }
    if (toPort?.type === 'output') {
      return `Port "${toPortId}" is output-only and cannot be a connection target`
    }
    return true
  }
}

/**
 * Factory that creates a validator pre-loaded with all three built-in rules
 * (no self-loop, no duplicate edge, port type compatibility).
 */
export function createDefaultValidator(): ConnectionValidator {
  return new ConnectionValidator()
    .addRule('no-self-loop', ConnectionValidator.noSelfLoop)
    .addRule('no-duplicate-edge', ConnectionValidator.noDuplicateEdge)
    .addRule('port-type-compatibility', ConnectionValidator.portTypeCompatibility)
}
