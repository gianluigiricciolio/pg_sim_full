// src/sim/day.js
import { reactive } from 'vue'

export function createDaySim() {
    const cfg = reactive(defaultConfig())
    const state = reactive({
        time: new Date(2025, 0, 1, cfg.time.startHour, 0, 0, 0),
        speed: 1, // 1x = realtime (1 minuto in game = 1 minuto reale)
        needs: { energy: 95, nutrition: 85, hygiene: 80, social: 75, fun: 80 },
        activity: { name: 'Idle', until: null },
        napCount: 0,
        meta: {
            lastMealTime: null,
            lastSleepTime: null,
            lastShowerTime: null,
        },
        workingToday: true,
        running: false,
    })
    const logs = reactive([])
    let intervalId = null

    function log(s) {
        logs.push(`${state.time.toLocaleTimeString()} — ${s}`)
        if (logs.length > 300) logs.shift()
    }

    function reinit() {

        state.time = new Date(2025, 0, 1, cfg.time.startHour, 0, 0, 0)
        state.needs = { energy: 95, nutrition: 85, hygiene: 80, social: 75, fun: 80 }
        state.activity = { name: 'Idle', until: null }
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

    // --- Decay & clamp ---
    function decayMinute() {
        const d = cfg.decay
        // decadimento per minuto (valori base sono per ora)
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

    function within(h, [a, b]) {
        return h >= a && h < b
    }

    function isWeekend() {
        const day = state.time.getDay() // 0 = Sunday
        return day === 0 || day === 6
    }

    // --- Main advance ---
    function advanceMinute() {
        if (state.activity.until && state.time < state.activity.until) {
            // Attività in corso
            applyActivityMinute()
            return
        }

        // Fine attività
        if (state.activity.until && state.time >= state.activity.until) {
            log(`Fine ${state.activity.name}`)
            state.activity = { name: 'Idle', until: null }
        }

        const h = state.time.getHours()

        // Sonno notturno
        if (h >= 23 || h < 7 || (state.needs.energy < 20 && h >= 21)) {
            doSleepNight()
            return
        }

        // Lavoro 9–17 (feriali)
        const workOn = cfg.work.on && !isWeekend()
        if (workOn && h >= cfg.work.start && h < cfg.work.end) {
            if (state.needs.energy < 20) return doNap(30)
            if (state.needs.nutrition < 15) return doEat(45)
            if (state.needs.hygiene < 15) return doWash(12)
            return doWork(30)
        }

        // Emergenze
        if (state.needs.energy < 20) return doNap(30)
        if (state.needs.nutrition < 15) return doEat(45)
        if (state.needs.hygiene < 15) return doWash(12)

        // Pasti

        if (within(h, cfg.meals.breakfast) ||
            within(h, cfg.meals.lunch) ||
            within(h, cfg.meals.dinner)) {

            const need = 100 - state.needs.nutrition

            if (need > 30) {
                return doEat(40) //pasto completo
            } else if (need > 15) {
                return doEat(25) //pasto normale
            } else if (need > 0) {
                return doEat(10) //spuntino
            }

        }


        // Pisolino diurno
        if (state.needs.energy < cfg.thr.energy && state.napCount < cfg.limits.maxNapsPerDay) {
            return doNap(20)
        }

        // Social
        if ((isWeekend() || h >= 19) && state.needs.social < cfg.thr.social) {
            return doSocial(90)
        }

        // Svago
        if (state.needs.fun < cfg.thr.fun) {
            return doFun(60)
        }

        // Igiene
        if (state.needs.hygiene < cfg.thr.hygiene) {
            return doWash(12)
        }

        // Idle
        doIdle(5)
    }

    // --- Activities ---
    function schedule(name, minutes) {
        const until = new Date(state.time.getTime() + minutes * 60000)
        state.activity = { name, until }
        log(`Inizio ${name} (${minutes}m)`)
    }

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
        schedule('Dormire', minutes)
    }
    function doNap(minutes) { state.napCount++; schedule('Power-nap', minutes) }
    function doEat(minutes) { schedule('Mangiare', minutes) }
    function doWash(minutes) { schedule('Lavarsi', minutes) }
    function doSocial(minutes) { schedule('Socializzare', minutes) }
    function doFun(minutes) { schedule('Svago', minutes) }
    function doWork(minutes) { schedule('Lavorare', minutes) }
    function doIdle(minutes) { schedule('Idle', minutes) }

    // --- Apply effects per minuto ---
    function applyActivityMinute() {
        const a = state.activity.name
        switch (a) {
            case 'Dormire':
                state.needs.energy = Math.min(100, state.needs.energy + (12.5 / 60))
                state.needs.nutrition -= (1.0 / 60)
                break
            case 'Power-nap':
                state.needs.energy = Math.min(100, state.needs.energy + 0.5) // +0.5/min
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
                state.needs.energy = Math.min(100, state.needs.energy + 0.2) // Idle leggermente ristorativo
                break
        }
        if (a !== 'Dormire') decayMinute()
        else clampNeeds()
        state.time = new Date(state.time.getTime() + 60000)
    }

    return { state, cfg, logs, play, pause, step, reinit, setSpeed }
}