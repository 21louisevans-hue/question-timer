import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { TimerState } from '../types'

const TARGET_MS = 225_000 // 3 min 45 s per TMUA question
const WARN_MS = 180_000 // turn amber at 3:00

const initial: TimerState = {
  isRunning: false,
  runStartedAt: null,
  bankedMs: 0,
  now: 0,
  question: 1,
  laps: [],
  hasAlerted: false,
}

const timer = atom({ plugin: 'question-timer', key: 'timer' } as const, initial)

const elapsedMs = (t: TimerState) =>
  t.bankedMs + (t.isRunning && t.runStartedAt !== null ? Math.max(0, t.now - t.runStartedAt) : 0)

const fmt = (ms: number) => {
  const total = Math.floor(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

let ticker: Timer | null = null

function stopTicking() {
  ticker?.cancel()
  ticker = null
}

function startTicking($: EngineInterface) {
  if (ticker) return
  ticker = $.clock.every(1000, async () => {
    const now = await $.clock.now()
    const t = await update($, timer, s => ({ ...s, now }))
    if (t.isRunning && !t.hasAlerted && elapsedMs(t) >= TARGET_MS) {
      await update($, timer, s => ({ ...s, hasAlerted: true }))
      $.ui.toast(`Q${t.question}: past 3:45. Pick your best answer and move on.`)
    }
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    if ((await read($, timer)).isRunning) startTicking($)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const t = await read($, timer)
    if (t.isRunning && !ticker) startTicking($)

    const { Box, Button, Text } = $.ui.resolve(e)
    const ms = elapsedMs(t)
    const isOver = ms >= TARGET_MS
    const color = isOver ? 'error' : ms >= WARN_MS ? 'warning' : t.isRunning ? 'success' : 'inactive'

    const toggle = async () => {
      const now = await $.clock.now()
      const s = await update($, timer, s =>
        s.isRunning
          ? { ...s, isRunning: false, bankedMs: elapsedMs({ ...s, now }), runStartedAt: null, now }
          : { ...s, isRunning: true, runStartedAt: now, now },
      )
      if (s.isRunning) startTicking($)
      else stopTicking()
    }

    const nextQuestion = async () => {
      const now = await $.clock.now()
      await update($, timer, s => {
        const lap = Math.round(elapsedMs({ ...s, now }) / 1000)
        return {
          ...s,
          laps: [...s.laps, lap],
          question: s.question + 1,
          bankedMs: 0,
          runStartedAt: s.isRunning ? now : null,
          now,
          hasAlerted: false,
        }
      })
    }

    const reset = async () => {
      stopTicking()
      await update($, timer, () => initial)
    }

    const laps = t.laps
    const last = laps.at(-1) ?? null
    const avg = laps.length ? laps.reduce((a, b) => a + b, 0) / laps.length : null
    const overCount = laps.filter(l => l * 1000 >= TARGET_MS).length

    return (
      <Box flexDirection="column">
        <Box>
          <Text bold>Q{t.question} </Text>
          <Text bold color={color}>{fmt(ms)}</Text>
          <Text dimColor> / 3:45</Text>
          {isOver ? <Text color="error"> +{fmt(ms - TARGET_MS)} over</Text> : null}
          <Text> </Text>
          <Button key="toggle" hotkey="s" label={t.isRunning ? 'Pause' : ms > 0 ? 'Resume' : 'Start'} onPress={toggle} />
          <Text> </Text>
          <Button key="next" hotkey="n" label="Next question" onPress={nextQuestion} />
          <Text> </Text>
          <Button key="reset" hotkey="r" label="Reset" onPress={reset} />
        </Box>
        {last !== null && avg !== null ? (
          <Text dimColor>
            Last {fmt(last * 1000)} · average {fmt(avg * 1000)} over {laps.length} · {overCount} over target
          </Text>
        ) : null}
      </Box>
    )
  })
}
