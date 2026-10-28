export type TimerState = {
  isRunning: boolean
  /** When the current running stretch began (ms since epoch), or null when paused. */
  runStartedAt: number | null
  /** Time already counted for this question before the current stretch. */
  bankedMs: number
  /** Last tick, used to redraw. */
  now: number
  /** Number of the current question, from 1. */
  question: number
  /** Finished question times in seconds, oldest first. */
  laps: number[]
  /** Whether the over-target toast has fired for this question. */
  hasAlerted: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'question-timer': { timer: TimerState }
  }
}
