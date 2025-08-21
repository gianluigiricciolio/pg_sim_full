// src/sim/universe/Universe.js
import { reactive } from 'vue'
import { defaultConfig } from '../config/defaultConfig'
import { createPG } from '../pg/PG.js'
import { handleSleep, handleWork, handleEmergencies, handleMeals, handleNap, handleSocial, handleFun, handleHygiene, handleIdle } from './rules'
export function createUniverse() {
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

    function log(s) {
        logs.push(`${state.time.toLocaleTimeString()} — ${s}`)
        if (logs.length > 300) logs.shift()
    }

    state.pg = createPG(cfg, log)

    function reinit() {

        state.time = new Date(2025, 0, 1, cfg.time.startHour, 0, 0, 0)
        state.pg = createPG(cfg, log)
        state.napCount = 0
        state.workingToday = true
        logs.length = 0
        log('Reinit giornata')
    }

    // Controls
    function play() {
        state.running = true
        startInterval()
    }
    function pause() {
        state.running = false
        if (intervalId) clearInterval(intervalId)
    }
    function step() {
        advanceMinute()
    }

    function setSpeed(newSpeed) {
        state.speed = newSpeed
        if (state.running) startInterval()
    }

    // Interval manager
    function startInterval() {
        if (intervalId) clearInterval(intervalId)
        const msPerMinute = 60000 / state.speed // durata reale di 1 minuto in game
        intervalId = setInterval(() => {
            if (state.running) advanceMinute()
        }, msPerMinute)
    }

    function within(h, [a, b]) {
        return h >= a && h < b
    }

    function mealTypeAt(time) {
        const h = time.getHours()
        if (within(h, cfg.meals.breakfast)) return 'breakfast'
        if (within(h, cfg.meals.lunch)) return 'lunch'
        if (within(h, cfg.meals.dinner)) return 'dinner'
        return null
    }

    function isWeekend() {
        const day = state.time.getDay() // 0 = Sunday
        return day === 0 || day === 6
    }

    // --- Main advance ---
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
            const meals = state.pg.state.meta.meals
            meals.breakfast = meals.lunch = meals.dinner = false
        }

        const ctx = {
            state,
            cfg,
            pg: state.pg,
            within,
            isWeekend,
            doSleepNight,
            doNap,
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
    function doSleepNight() {
        const h = state.time.getHours()
        const targetEnd = new Date(state.time)
        if (h >= 23) {
            targetEnd.setDate(state.time.getDate() + 1)
            targetEnd.setHours(7, 0, 0, 0)
        } else {
            targetEnd.setHours(7, 0, 0, 0)
        }
        let minutes = Math.max(360, Math.min(540, (targetEnd - state.time) / 60000))
        state.pg.schedule(state.time, 'Dormire', minutes)
    }
    function doNap(minutes) { state.napCount++; state.pg.schedule(state.time, 'Power-nap', minutes) }
    function doEat(minutes) { state.pg.schedule(state.time, 'Mangiare', minutes) }
    function doWash(minutes) { state.pg.schedule(state.time, 'Lavarsi', minutes) }
    function doSocial(minutes) { state.pg.schedule(state.time, 'Socializzare', minutes) }
    function doFun(minutes) { state.pg.schedule(state.time, 'Svago', minutes) }
    function doWork(minutes) { state.pg.schedule(state.time, 'Lavorare', minutes) }
    function doIdle(minutes) { state.pg.schedule(state.time, 'Idle', minutes) }

    return { state, cfg, logs, play, pause, step, reinit, setSpeed }
}