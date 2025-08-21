export function defaultConfig() {
    return {
        seed: 12345,
        time: { startHour: 7 },
        work: { on: true, start: 9, end: 17 },
        limits: { maxNapsPerDay: 2 },
        meals: { breakfast: [6, 9], lunch: [12, 15], dinner: [19, 22] },
        decay: {
            energy: { base: 3.0 },
            nutrition: 4.0,
            hygiene: 2.0,
            social: 1.5,
            fun: 2.0
        },
        thr: { energy: 35, nutrition: 30, hygiene: 25, social: 35, fun: 35 }
    }
}