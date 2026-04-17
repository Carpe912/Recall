import type { Point } from '../types'

export class Animator {
  private animations: Map<string, Animation> = new Map()

  animate(
    id: string,
    from: Point,
    to: Point,
    duration: number,
    onUpdate: (point: Point) => void,
    onComplete?: () => void
  ): void {
    // 取消已存在的动画
    this.cancel(id)

    const startTime = Date.now()

    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // 缓动函数：easeInOutCubic
      const eased = this.easeInOutCubic(progress)

      const current = {
        x: from.x + (to.x - from.x) * eased,
        y: from.y + (to.y - from.y) * eased,
      }

      onUpdate(current)

      if (progress < 1) {
        const animationId = requestAnimationFrame(tick)
        this.animations.set(id, { animationId, tick })
      } else {
        this.animations.delete(id)
        onComplete?.()
      }
    }

    const animationId = requestAnimationFrame(tick)
    this.animations.set(id, { animationId, tick })
  }

  cancel(id: string): void {
    const animation = this.animations.get(id)
    if (animation) {
      cancelAnimationFrame(animation.animationId)
      this.animations.delete(id)
    }
  }

  cancelAll(): void {
    this.animations.forEach((animation) => {
      cancelAnimationFrame(animation.animationId)
    })
    this.animations.clear()
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }
}

interface Animation {
  animationId: number
  tick: () => void
}
