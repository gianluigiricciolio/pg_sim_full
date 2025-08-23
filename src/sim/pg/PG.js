import { reactive } from 'vue'
import { ActivityRegistry } from '../activities/ActivityRegistry.js'

/**
 * Format a duration in milliseconds to a human readable string.
 * @param {number} ms - Duration in milliseconds.
 * @returns {string} Formatted duration (e.g., "2h 30m").
 */
function formatDuration(ms) {
    const totalMinutes = Math.round(ms / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h`
    return `${minutes}m`
}

/**
 * Player character with needs and scheduled activities.
 */
export class PG {
    /**
     * Create a new player character.
     * @param {string} name - Character name.
     * @param {object} cfg - Configuration including decay rates and thresholds.
     * @param {(msg: string) => void} [logFn] - Optional logging callback.
     */
    constructor(name, cfg, logFn) {
        this.name = name
        this.cfg = cfg
        this.log = logFn
        this.state = reactive({
            needs: { energy: 95, nutrition: 85, hygiene: 80, social: 75, fun: 80 },
            activity: { name: 'Idle', until: null, start: null },
            dailyActivities: {},
            meta: {
                lastMealTime: null,
                lastSleepTime: null,
                lastShowerTime: null,
                meals: { breakfast: false, lunch: false, dinner: false },
            },
        })
    }

    /**
     * Schedule a new activity or extend the current one.
     * @param {Date} currentTime - Current simulation time.
     * @param {string} name - Activity name.
     * @param {number} minutes - Duration in minutes.
     * @returns {Date} The time when the activity will end.
     * @sideeffect Updates state.activity and may log.
     */
    schedule(currentTime, name, minutes) {
        const activity = this.state.activity

        // Extend existing activity if it's the same and has already ended
        if (activity.name === name && activity.until && currentTime >= activity.until) {
            this.state.dailyActivities[name] = (this.state.dailyActivities[name] || 0) + 1
            activity.until = new Date(activity.until.getTime() + minutes * 60000) // minutes → ms
            return activity.until
        }

        if (activity.start) {
            const dur = currentTime - activity.start
            if (this.log) this.log(`Finito ${activity.name} (durata ${formatDuration(dur)})`)
            if (!activity.until || currentTime >= activity.until) {
                const prev = activity.name
                this.state.dailyActivities[prev] = (this.state.dailyActivities[prev] || 0) + 1
            }
        }

        const start = new Date(currentTime)
        const until = new Date(currentTime.getTime() + minutes * 60000) // convert to ms
        this.state.activity = { name, until, start }
        if (this.log) this.log(`Iniziato ${name}`)
        return until
    }

    /**
     * Apply natural need decay for one minute of game time.
     * @returns {void}
     * @sideeffect Decreases needs in place.
     */
    decayMinute() {
        const d = this.cfg.decay
        // Decay rates are expressed per hour; divide by 60 for per-minute change
        this.state.needs.energy -= d.energy.base / 60
        this.state.needs.nutrition -= d.nutrition / 60
        this.state.needs.hygiene -= d.hygiene / 60
        this.state.needs.social -= d.social / 60
        this.state.needs.fun -= d.fun / 60
        this.clampNeeds()
    }

    /**
     * Clamp all need values to the range [0, 100].
     * @returns {void}
     * @sideeffect Mutates this.state.needs.
     */
    clampNeeds() {
        for (const k of Object.keys(this.state.needs)) {
            this.state.needs[k] = Math.max(0, Math.min(100, this.state.needs[k]))
        }
    }

    /**
     * Apply effects of the current activity for one minute and advance time.
     * @param {Date} currentTime - Current simulation time.
     * @returns {Date} New time one minute later.
     * @sideeffect Mutates needs based on activity effects.
     */
    applyActivityMinute(currentTime) {
        const name = this.state.activity.name
        const activity = ActivityRegistry.get(name)

        if (activity?.effects) {
            for (const [need, value] of Object.entries(activity.effects)) {
                if (this.state.needs[need] !== undefined) {
                    this.state.needs[need] += value // apply per-minute effect
                }
            }
        }

        this.applyDecayOrClamp(activity)
        return new Date(currentTime.getTime() + 60000) // advance 1 minute
    }

    /**
     * Apply natural decay unless the activity specifies to skip it.
     * @param {object} [activity] - Activity variant.
     * @returns {void}
     * @sideeffect May mutate needs.
     */
    applyDecayOrClamp(activity) {
        if (activity?.skipDecay) this.clampNeeds()
        else this.decayMinute()
    }

    /**
     * Record the time of a meal and toggle meal consumption flag.
     * @param {Date} time - Meal time.
     * @param {'breakfast'|'lunch'|'dinner'} [type] - Meal type.
     * @returns {void}
     * @sideeffect Updates meta information about meals.
     */
    recordMeal(time, type) {
        this.state.meta.lastMealTime = new Date(time)
        if (type && this.state.meta.meals[type] !== undefined) {
            this.state.meta.meals[type] = !this.state.meta.meals[type]
        }
    }

    /**
     * Check critical needs and trigger emergency actions if required.
     * @param {{doSleep: Function, doEat: Function, doWash: Function}} handlers - Callbacks to schedule activities.
     * @returns {boolean} True if an emergency action was taken.
     * @sideeffect May schedule new activities through provided handlers.
     */
    checkPrimaryNeeds({ doSleep, doEat, doWash }) {
        const needs = this.state.needs
        const crit = this.cfg.crit
        if (needs.energy < crit.energy) { doSleep('power', 30); return true }
        if (needs.nutrition < crit.nutrition) { doEat(45); return true }
        if (needs.hygiene < crit.hygiene) { doWash(12); return true }
        return false
    }
}

/**
 * Factory helper to instantiate a PG.
 * @param {object} cfg - Configuration object.
 * @param {(msg: string) => void} [log] - Optional logging callback.
 * @returns {PG} Newly created player character.
 */
export function createPG(cfg, log) {
    return new PG('PG', cfg, log)
}
