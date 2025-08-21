import { describe, it, expect } from 'vitest'
import { createUniverse } from '../src/sim/universe/Universe.js'
import { WorkActivity } from '../src/sim/activities/WorkActivity.js'

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
    const schedule = WorkActivity.buildSchedule(state.time, new Date(2025, 0, 1, 12, 0, 0, 0))
    for (const ev of schedule) {
      state.pg.schedule(state.time, ev.name, ev.duration)
      for (let i = 0; i < ev.duration; i++) step()
    }
    state.pg.schedule(state.time, 'Svago', 30)
    for (let j = 0; j < 30; j++) step()

    const startLogs = logs.filter(l => l.includes('Iniziato Lavorare'))
    const endLogs = logs.filter(l => l.includes('Finito Lavorare'))
    expect(startLogs.length).toBe(1)
    expect(endLogs.length).toBe(1)
  })

  it('allows inserting other activities within work schedule', () => {
    const { state, logs, step } = createUniverse()
    state.time = new Date(2025, 0, 1, 9, 0, 0, 0)
    const schedule = WorkActivity.buildSchedule(
      state.time,
      new Date(2025, 0, 1, 13, 0, 0, 0),
      30,
      [
        { start: new Date(2025, 0, 1, 11, 0, 0, 0), name: 'Mangiare', duration: 30 },
        { start: new Date(2025, 0, 1, 12, 0, 0, 0), name: 'Pausa bagno', duration: 5 },
      ]
    )
    for (const ev of schedule) {
      state.pg.schedule(state.time, ev.name, ev.duration)
      for (let i = 0; i < ev.duration; i++) step()
    }
    state.pg.schedule(state.time, 'Svago', 30)
    for (let j = 0; j < 30; j++) step()

    const startLogs = logs.filter(l => l.includes('Iniziato Lavorare'))
    const endLogs = logs.filter(l => l.includes('Finito Lavorare'))
    expect(startLogs.length).toBe(3)
    expect(endLogs.length).toBe(3)
    expect(logs.some(l => l.includes('Iniziato Mangiare'))).toBe(true)
    expect(logs.some(l => l.includes('Iniziato Pausa bagno'))).toBe(true)
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
