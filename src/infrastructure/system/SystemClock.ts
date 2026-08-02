import type { Clock } from '@/core/application/ports/driven/Clock'

export class SystemClock implements Clock {
  now(): number {
    return Date.now()
  }
}
