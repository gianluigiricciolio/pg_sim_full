import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PG } from '../src/sim/pg/PG.js'
import { defaultConfig } from '../src/sim/config/defaultConfig.js'

describe('checkPrimaryNeeds', () => {
    let pg
    const cfg = defaultConfig()

    beforeEach(() => {
        pg = new PG('PG', cfg, () => {})
    })

    it('triggers power sleep when energy below critical', () => {
        pg.state.needs.energy = cfg.crit.energy - 1
        const doSleep = vi.fn()
        const triggered = pg.checkPrimaryNeeds({ doSleep, doEat: vi.fn(), doWash: vi.fn() })
        expect(triggered).toBe(true)
        expect(doSleep).toHaveBeenCalledWith('power', 30)
    })

    it('triggers meal when nutrition below critical', () => {
        pg.state.needs.nutrition = cfg.crit.nutrition - 1
        const doEat = vi.fn()
        const triggered = pg.checkPrimaryNeeds({ doSleep: vi.fn(), doEat, doWash: vi.fn() })
        expect(triggered).toBe(true)
        expect(doEat).toHaveBeenCalledWith(45)
    })

    it('triggers wash when hygiene below critical', () => {
        pg.state.needs.hygiene = cfg.crit.hygiene - 1
        const doWash = vi.fn()
        const triggered = pg.checkPrimaryNeeds({ doSleep: vi.fn(), doEat: vi.fn(), doWash })
        expect(triggered).toBe(true)
        expect(doWash).toHaveBeenCalledWith(12)
    })

    it('returns false when all needs satisfied', () => {
        const actions = { doSleep: vi.fn(), doEat: vi.fn(), doWash: vi.fn() }
        const triggered = pg.checkPrimaryNeeds(actions)
        expect(triggered).toBe(false)
        expect(actions.doSleep).not.toHaveBeenCalled()
        expect(actions.doEat).not.toHaveBeenCalled()
        expect(actions.doWash).not.toHaveBeenCalled()
    })
})

