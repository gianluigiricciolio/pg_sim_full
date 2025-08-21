import { reactive } from 'vue'

export class PG {
    constructor(name, cfg, startTime) {
        this.name = name
        this.cfg = cfg
        this.state = reactive({
            needs: { energy: 95, nutrition: 85, hygiene: 80, social: 75, fun: 80 },
            activity: { name: 'Idle', until: null },
            meta: { lastMeal: null, lastSleep: null, lastWash: null },
        })
        this.time = startTime
    }

    tickMinute(currentTime) {
        this.time = currentTime
        // Per ora solo decadimento base
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
}
