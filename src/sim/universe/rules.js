export function handleSleep({ state, pg, doSleepNight }) {
    const h = state.time.getHours()
    if (h >= 23 || h < 7 || (pg.state.needs.energy < 20 && h >= 21)) {
        doSleepNight()
        return true
    }
    return false
}

export function handleWork({ state, pg, cfg, doNap, doEat, doWash, doWork, isWeekend }) {
    const h = state.time.getHours()
    const workOn = cfg.work.on && !isWeekend()
    if (workOn && h >= cfg.work.start && h < cfg.work.end) {
        if (pg.state.needs.energy < 20) { doNap(30); return true }
        if (pg.state.needs.nutrition < 15) { doEat(45); return true }
        if (pg.state.needs.hygiene < 15) { doWash(12); return true }
        doWork(30)
        return true
    }
    return false
}

export function handleEmergencies({ pg, doNap, doEat, doWash }) {
    if (pg.state.needs.energy < 20) { doNap(30); return true }
    if (pg.state.needs.nutrition < 15) { doEat(45); return true }
    if (pg.state.needs.hygiene < 15) { doWash(12); return true }
    return false
}

export function handleMeals({ state, pg, cfg, doEat, within }) {
    const h = state.time.getHours()
    let mealType = null
    if (within(h, cfg.meals.breakfast)) mealType = 'breakfast'
    else if (within(h, cfg.meals.lunch)) mealType = 'lunch'
    else if (within(h, cfg.meals.dinner)) mealType = 'dinner'
    if (!mealType || pg.state.meta.meals[mealType]) return false
    const need = 100 - pg.state.needs.nutrition
    if (need > 30) { doEat(40); return true }
    if (need > 15) { doEat(25); return true }
    if (need > 0) { doEat(10); return true }
    return false
}

export function handleNap({ state, pg, cfg, doNap }) {
    if (pg.state.needs.energy < cfg.thr.energy && state.napCount < cfg.limits.maxNapsPerDay) {
        doNap(20)
        return true
    }
    return false
}

export function handleSocial({ state, pg, cfg, doSocial, isWeekend }) {
    const h = state.time.getHours()
    if ((isWeekend() || h >= 19) && pg.state.needs.social < cfg.thr.social) {
        doSocial(90)
        return true
    }
    return false
}

export function handleFun({ pg, cfg, doFun }) {
    if (pg.state.needs.fun < cfg.thr.fun) {
        doFun(60)
        return true
    }
    return false
}

export function handleHygiene({ pg, cfg, doWash }) {
    if (pg.state.needs.hygiene < cfg.thr.hygiene) {
        doWash(12)
        return true
    }
    return false
}

export function handleIdle({ doIdle }) {
    doIdle(5)
    return true
}
