// src/sim/universe/Universe.js
import { reactive } from 'vue'
import { defaultConfig } from '../config/defaultConfig'
import { createPG } from '../pg/PG.js'
import { SleepActivity } from '../activities/SleepActivity.js'
import { ActivityRegistry } from '../activities/ActivityRegistry.js'
import { handleSleep, handleWork, handleEmergencies, handleMeals, handleNap, handleSocial, handleFun, handleHygiene, handleIdle } from './rules'
import { AudioManager } from '../../audio/AudioManager.js'

/**
 * Create the simulation universe holding state and control helpers.
 * @returns {object} Reactive state, config, logs and control functions.
 * @sideeffect Initializes reactive state and timers.
 */
export function createUniverse() {
    AudioManager.setVolume(1) //set Volume to 30%
    const cfg = reactive(defaultConfig())
    const state = reactive({
        time: new Date(2025, 0, 1, cfg.time.startHour, 0, 0, 0),
        speed: 1, // 1x = realtime (1 minuto in game = 1 minuto reale)
        pg: null,
        napCount: 0,
        workingToday: true,
        running: false,
    })
    const logs = reactive([])
    let intervalId = null

    /**
     * Append a timestamped message to the log array.
     * @param {string} s - Message to record.
     * @returns {void}
     */
    function log(s) {
        logs.push(`${state.time.toLocaleTimeString()} — ${s}`)
        if (logs.length > 300) logs.shift()
    }

    state.pg = createPG(cfg, log)

    /**
     * Reset the universe to its initial daily state.
     * @returns {void}
     * @sideeffect Mutates state and clears logs.
     */
    function reinit() {

        state.time = new Date(2025, 0, 1, cfg.time.startHour, 0, 0, 0)
        state.pg = createPG(cfg, log)
        state.napCount = 0
        state.workingToday = true
        logs.length = 0
        log('Reinit giornata')
    }

    // Controls

    /**
     * Start the simulation loop.
     * @returns {void}
     */
    function play() {
        state.running = true
        startInterval()
        AudioManager.play()
    }
    /**
     * Pause the simulation loop.
     * @returns {void}
     */
    function pause() {
        state.running = false
        if (intervalId) clearInterval(intervalId)
        AudioManager.pause()
    }
    /**
     * Advance the simulation by a single minute.
     * @returns {void}
     */
    function step() {
        advanceMinute()
    }

    /**
     * Adjust the simulation speed multiplier.
     * @param {number} newSpeed - 1 means real-time.
     * @returns {void}
     */
    function setSpeed(newSpeed) {
        state.speed = newSpeed
        if (state.running) startInterval()
    }

    // Interval manager
    /**
     * Start or restart the timer driving the simulation clock.
     * @returns {void}
     */
    function startInterval() {
        if (intervalId) clearInterval(intervalId)
        const msPerMinute = 60000 / state.speed // real ms for one in-game minute
        intervalId = setInterval(() => {
            if (state.running) advanceMinute()
        }, msPerMinute)
    }

    /**
     * Check if an hour is within the interval [a,b).
     * @param {number} h - Hour to test.
     * @param {[number,number]} param1 - Interval start and end.
     * @returns {boolean}
     */
    function within(h, [a, b]) {
        return h >= a && h < b
    }

    /**
     * Determine meal type for a given time.
     * @param {Date} time - Time to evaluate.
     * @returns {'breakfast'|'lunch'|'dinner'|null}
     */
    function mealTypeAt(time) {
        const h = time.getHours()
        if (within(h, cfg.meals.breakfast)) return 'breakfast'
        if (within(h, cfg.meals.lunch)) return 'lunch'
        if (within(h, cfg.meals.dinner)) return 'dinner'
        return null
    }

    /**
     * Determine whether current time falls on a weekend.
     * @returns {boolean}
     */
    function isWeekend() {
        const day = state.time.getDay() // 0 = Sunday
        return day === 0 || day === 6
    }

    // --- Main advance ---
    /**
     * Advance the simulation clock by one minute and run rule handlers.
     * @returns {void}
     */
    function advanceMinute() {
        if (state.pg.state.activity.until && state.time < state.pg.state.activity.until) {
            state.time = state.pg.applyActivityMinute(state.time)
            return
        }

        if (state.pg.state.activity.until && state.time >= state.pg.state.activity.until && state.pg.state.activity.name === 'Mangiare') {
            const m = mealTypeAt(state.time)
            state.pg.recordMeal(state.time, m)
        }

        if (state.time.getHours() === cfg.time.startHour && state.time.getMinutes() === 0) {
            // At day start reset eaten-meal flags
            const meals = state.pg.state.meta.meals
            meals.breakfast = meals.lunch = meals.dinner = false
            state.pg.state.dailyActivities = {}
        }

        const ctx = {
            state,
            cfg,
            pg: state.pg,
            within,
            isWeekend,
            doSleepNight,
            doSleep,
            doEat,
            doWash,
            doSocial,
            doFun,
            doWork,
            doIdle,
        }

        const rules = [
            handleSleep,
            handleMeals,
            handleWork,
            handleEmergencies,
            handleNap,
            handleSocial,
            handleFun,
            handleHygiene,
            handleIdle,
        ]

        for (const r of rules) {
            if (r(ctx)) return
        }
    }

    // --- Activities ---
    /**
     * Schedule night sleep until the next morning.
     * @returns {void}
     */
    function doSleepNight() {
        const h = state.time.getHours()
        const targetEnd = new Date(state.time)
        if (h >= 23) {
            targetEnd.setDate(state.time.getDate() + 1)
            targetEnd.setHours(7, 0, 0, 0)
        } else {
            targetEnd.setHours(7, 0, 0, 0)
        }
        // Sleep at least 6h and at most 9h
        let minutes = Math.max(360, Math.min(540, (targetEnd - state.time) / 60000))
        state.pg.schedule(state.time, SleepActivity.variants.night.label, minutes)
    }
    /**
     * Schedule a sleep activity variant.
     * @param {string} variant - Variant key (night, short, power).
     * @param {number} minutes - Duration in minutes.
     * @returns {void}
     */
    function doSleep(variant, minutes) {
        if (variant === 'power') state.napCount++
        const label = SleepActivity.variants[variant]?.label || SleepActivity.variants.night.label
        state.pg.schedule(state.time, label, minutes)
    }

    /**
     * Helper to schedule an activity by registry key.
     * @param {string} key - Activity key.
     * @param {number} minutes - Duration in minutes.
     * @returns {void}
     */
    function scheduleActivity(key, minutes) {
        const activity = ActivityRegistry.get(key)
        if (!activity) return
        state.pg.schedule(state.time, activity.label, minutes)
    }
    /** Schedule eating. */
    function doEat(minutes) { scheduleActivity('eat', minutes) }
    /** Schedule washing. */
    function doWash(minutes) { scheduleActivity('wash', minutes) }
    /** Schedule socializing. */
    function doSocial(minutes) { scheduleActivity('social', minutes) }
    /** Schedule fun. */
    function doFun(minutes) { scheduleActivity('fun', minutes) }
    /** Schedule work. */
    function doWork(minutes) { scheduleActivity('work.block', minutes) }
    /** Schedule idle time. */
    function doIdle(minutes) { scheduleActivity('idle', minutes) }

    return { state, cfg, logs, play, pause, step, reinit, setSpeed }
}