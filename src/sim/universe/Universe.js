// src/sim/universe/Universe.js
import { reactive } from 'vue'
import { defaultConfig } from '../config/defaultConfig'
import { handleSleep, handleWork, handleEmergencies, handleMeals, handleNap, handleSocial, handleFun, handleHygiene, handleIdle } from './rules'

function createPG(cfg, log) {
    const state = reactive({
        needs: { energy: 95, nutrition: 85, hygiene: 80, social: 75, fun: 80 },
        activity: { name: 'Idle', until: null },
        meta: { lastMealTime: null, lastSleepTime: null, lastShowerTime: null },
    })

    function schedule(currentTime, name, minutes) {
        const until = new Date(currentTime.getTime() + minutes * 60000)
        state.activity = { name, until }
        if (log) log(`Inizio ${name} (${minutes}m)`)
        return until
    }

    function decayMinute() {
        const d = cfg.decay
        state.needs.energy -= d.energy.base / 60
        state.needs.nutrition -= d.nutrition / 60
        state.needs.hygiene -= d.hygiene / 60
        state.needs.social -= d.social / 60
        state.needs.fun -= d.fun / 60
        clampNeeds()
    }

    function clampNeeds() {
        for (const k of Object.keys(state.needs)) {
            state.needs[k] = Math.max(0, Math.min(100, state.needs[k]))
        }
    }

    function applyActivityMinute(currentTime) {
        const a = state.activity.name
        switch (a) {
            case 'Dormire':
                state.needs.energy = Math.min(100, state.needs.energy + (12.5 / 60))
                state.needs.nutrition -= (1.0 / 60)
                break
            case 'Power-nap':
                state.needs.energy = Math.min(100, state.needs.energy + 0.5)
                break
            case 'Mangiare':
                state.needs.nutrition = Math.min(100, state.needs.nutrition + (50 / 40))
                break
            case 'Lavarsi':
                state.needs.hygiene = Math.min(100, state.needs.hygiene + (40 / 12))
                break
            case 'Socializzare':
                state.needs.social = Math.min(100, state.needs.social + (35 / 90))
                state.needs.fun = Math.min(100, state.needs.fun + (10 / 90))
                state.needs.energy -= (1.0 / 60)
                break
            case 'Svago':
                state.needs.fun = Math.min(100, state.needs.fun + (25 / 60))
                break
            case 'Lavorare':
                state.needs.energy -= (4.0 / 60)
                state.needs.nutrition -= (2.0 / 60)
                break
            case 'Idle':
                state.needs.energy = Math.min(100, state.needs.energy + 0.2)
                break
        }
        if (a !== 'Dormire') decayMinute()
        else clampNeeds()
        return new Date(currentTime.getTime() + 60000)
    }

    function recordMeal(time) {
        state.meta.lastMealTime = new Date(time)
    }

    return { state, schedule, applyActivityMinute, recordMeal }
}

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

        if (state.pg.state.activity.until && state.time >= state.pg.state.activity.until) {
            if (state.pg.state.activity.name === 'Mangiare') {
                state.pg.recordMeal(state.time)
            }
            log(`Fine ${state.pg.state.activity.name}`)
            state.pg.state.activity = { name: 'Idle', until: null }
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
            handleWork,
            handleEmergencies,
            handleMeals,
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