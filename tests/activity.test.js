import { describe, it, expect } from 'vitest'
import { createUniverse } from '../src/sim/universe/Universe.js'

describe('activity notifications', () => {
  it('sends single start and end notification for repeated activity', () => {
    const { state, logs, step } = createUniverse()

    state.pg.schedule(state.time, 'Test', 1)
    expect(logs.filter(l => l.includes('Iniziato Test')).length).toBe(1)

    step()
    step()

    expect(logs.filter(l => l.includes('Iniziato Test')).length).toBe(1)
    expect(logs.filter(l => l.includes('Finito Test')).length).toBe(1)

    state.pg.schedule(state.time, 'Test', 1)
    step()
    step()

    expect(logs.filter(l => l.includes('Iniziato Test')).length).toBe(2)
    expect(logs.filter(l => l.includes('Finito Test')).length).toBe(2)
  })

  it('logs once for continuous repeated work activity', () => {
    const { state, logs, step } = createUniverse()
    state.time = new Date(2025, 0, 1, 9, 0, 0, 0)
    state.pg.schedule(state.time, 'Lavorare', 30)

    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 30; j++) step()
      state.pg.schedule(state.time, 'Lavorare', 30)
    }
    for (let j = 0; j < 30; j++) step()
    state.pg.schedule(state.time, 'Svago', 30)

    const startLogs = logs.filter(l => l.includes('Iniziato Lavorare'))
    const endLogs = logs.filter(l => l.includes('Finito Lavorare'))
    expect(startLogs.length).toBe(1)
    expect(endLogs.length).toBe(1)
  })

  it('calculates and formats duration correctly', () => {
    const { state, logs, step } = createUniverse()
    state.pg.schedule(state.time, 'Test', 65)

    for (let i = 0; i < 65; i++) {
      step()
    }
    step()

    const endLogs = logs.filter(l => l.includes('Finito Test'))
    const last = endLogs[endLogs.length - 1]
    expect(last).toMatch(/1h 5m\)$/)
  })
})
