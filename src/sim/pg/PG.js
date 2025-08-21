import { reactive } from 'vue'
import { ActivityRegistry } from '../activities/ActivityRegistry.js'

function formatDuration(ms) {
    const totalMinutes = Math.round(ms / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h`
    return `${minutes}m`
}

export class PG {
    constructor(name, cfg, logFn) {
        this.name = name
        this.cfg = cfg
        this.log = logFn
        this.state = reactive({
            needs: { energy: 95, nutrition: 85, hygiene: 80, social: 75, fun: 80 },
            activity: { name: 'Idle', until: null, start: null },
            meta: {
                lastMealTime: null,
                lastSleepTime: null,
                lastShowerTime: null,
                meals: { breakfast: false, lunch: false, dinner: false },
            },
        })
    }

    schedule(currentTime, name, minutes) {
        const activity = this.state.activity

        if (activity.name === name && activity.until && currentTime >= activity.until) {
            activity.until = new Date(activity.until.getTime() + minutes * 60000)
            return activity.until
        }

        if (activity.start) {
            const dur = currentTime - activity.start
            if (this.log) this.log(`Finito ${activity.name} (durata ${formatDuration(dur)})`)
        }

        const start = new Date(currentTime)
        const until = new Date(currentTime.getTime() + minutes * 60000)
        this.state.activity = { name, until, start }
        if (this.log) this.log(`Iniziato ${name}`)
        return until
    }

    decayMinute() {
        const d = this.cfg.decay
        this.state.needs.energy -= d.energy.base / 60
        this.state.needs.nutrition -= d.nutrition / 60
        this.state.needs.hygiene -= d.hygiene / 60
        this.state.needs.social -= d.social / 60
        this.state.needs.fun -= d.fun / 60
        this.clampNeeds()
    }

    clampNeeds() {
        for (const k of Object.keys(this.state.needs)) {
            this.state.needs[k] = Math.max(0, Math.min(100, this.state.needs[k]))
        }
    }

    applyActivityMinute(currentTime) {
        const name = this.state.activity.name
        const activity = ActivityRegistry.get(name)

        if (activity?.effects) {
            for (const [need, value] of Object.entries(activity.effects)) {
                if (this.state.needs[need] !== undefined) {
                    this.state.needs[need] += value
                }
            }
        }

        this.applyDecayOrClamp(activity)
        return new Date(currentTime.getTime() + 60000)
    }

    applyDecayOrClamp(activity) {
        if (activity?.skipDecay) this.clampNeeds()
        else this.decayMinute()
    }

    recordMeal(time, type) {
        this.state.meta.lastMealTime = new Date(time)
        if (type && this.state.meta.meals[type] !== undefined) {
            this.state.meta.meals[type] = !this.state.meta.meals[type]
        }
    }

    checkPrimaryNeeds({ doSleep, doEat, doWash }) {
        const needs = this.state.needs
        const crit = this.cfg.crit
        if (needs.energy < crit.energy) { doSleep('power', 30); return true }
        if (needs.nutrition < crit.nutrition) { doEat(45); return true }
        if (needs.hygiene < crit.hygiene) { doWash(12); return true }
        return false
    }
  }

export function createPG(cfg, log) {
    return new PG('PG', cfg, log)
}
