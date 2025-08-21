import { reactive } from 'vue'

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
        const a = this.state.activity.name
        switch (a) {
            case 'Dormire':
                this.state.needs.energy = Math.min(100, this.state.needs.energy + (12.5 / 60))
                this.state.needs.nutrition -= (1.0 / 60)
                break
            case 'Power-nap':
                this.state.needs.energy = Math.min(100, this.state.needs.energy + 0.5)
                break
            case 'Mangiare':
                this.state.needs.nutrition = Math.min(100, this.state.needs.nutrition + (50 / 40))
                break
            case 'Lavarsi':
                this.state.needs.hygiene = Math.min(100, this.state.needs.hygiene + (40 / 12))
                break
            case 'Socializzare':
                this.state.needs.social = Math.min(100, this.state.needs.social + (35 / 90))
                this.state.needs.fun = Math.min(100, this.state.needs.fun + (10 / 90))
                this.state.needs.energy -= (1.0 / 60)
                break
            case 'Svago':
                this.state.needs.fun = Math.min(100, this.state.needs.fun + (25 / 60))
                break
            case 'Lavorare':
                this.state.needs.energy -= (4.0 / 60)
                this.state.needs.nutrition -= (2.0 / 60)
                break
            case 'Idle':
                this.state.needs.energy = Math.min(100, this.state.needs.energy + 0.2)
                break
        }
        if (a !== 'Dormire') this.decayMinute()
        else this.clampNeeds()
        return new Date(currentTime.getTime() + 60000)
    }

    recordMeal(time, type) {
        this.state.meta.lastMealTime = new Date(time)
        if (type && this.state.meta.meals[type] !== undefined) {
            this.state.meta.meals[type] = !this.state.meta.meals[type]
        }
    }
}

export function createPG(cfg, log) {
    return new PG('PG', cfg, log)
}
