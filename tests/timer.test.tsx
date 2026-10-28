import { expect, mock, test } from 'claude-code/testing'

const BAND = {
  plugin: 'question-timer',
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 10, columns: 100 },
} as const

for (const surface of ['terminal', 'desktop'] as const) {
  test(`times a question and flags the 3:45 target on ${surface}`, async ($, on) => {
    const clock = mock.clock(on)
    on('ui.toast', () => ({ value: {} }))

    const ui = await $.ui.mount({ ...BAND, surface } as never)
    expect((await ui.find({ type: 'Text', text: /^0:00$/ }))?.text).toBe('0:00')

    await ui.press({ key: 'toggle' })
    await clock.advance(200_000)
    expect((await ui.find({ type: 'Text', text: /^3:20$/ }))?.text).toBe('3:20')

    await clock.advance(30_000)
    expect((await ui.find({ type: 'Text', text: /over/ }))?.text).toContain('0:05 over')

    await ui.press({ key: 'next' })
    expect((await ui.find({ type: 'Text', text: /^Q2/ }))).toBeTruthy()
    expect((await ui.find({ type: 'Text', text: /Last 3:50/ }))?.text).toContain('1 over target')

    await ui.press({ key: 'reset' })
    expect((await ui.find({ type: 'Text', text: /^Q1/ }))).toBeTruthy()
    await ui.unmount()
  })
}
