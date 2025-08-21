import { describe, it, expect } from 'vitest'
import { createUniverse } from '../src/sim/universe/Universe.js'

describe('daily activities tracking', () => {
  it('increments counter when activity completes', () => {
    const { state, step } = createUniverse()
    state.pg.schedule(state.time, 'Test', 1)
    step()
    step()
    expect(state.pg.state.dailyActivities.Test).toBe(1)
  })

  it('resets counters at day start', () => {
    const { state, step } = createUniverse()
    state.pg.state.dailyActivities.Test = 3
    step()
    expect(state.pg.state.dailyActivities.Test).toBeUndefined()
  })
})
