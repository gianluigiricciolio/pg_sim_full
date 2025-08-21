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
