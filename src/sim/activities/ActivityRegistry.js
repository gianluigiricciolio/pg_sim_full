import { SleepActivity } from './SleepActivity.js'
import { WorkActivity } from './WorkActivity.js'

// Store activities by both internal key and user-visible label
const activitiesByKey = {}
const activitiesByLabel = {}

/**
 * Register activity variants using an optional prefix to avoid key collisions.
 * Variants can then be retrieved either by their internal key (e.g. `work.block`)
 * or by their label (e.g. `Lavorare`).
 */
function registerVariants(activity, prefix = '') {
    if (!activity?.variants) return
    for (const [key, variant] of Object.entries(activity.variants)) {
        const k = prefix ? `${prefix}.${key}` : key
        activitiesByKey[k] = variant
        activitiesByLabel[variant.label] = variant
    }
}

// Register complex activities with a namespace prefix
registerVariants(SleepActivity, 'sleep')
registerVariants(WorkActivity, 'work')

// Basic activities are keyed explicitly
const basicActivities = {
    eat: { label: 'Mangiare', effects: { nutrition: 50 / 40 } },
    wash: { label: 'Lavarsi', effects: { hygiene: 40 / 12 } },
    social: { label: 'Socializzare', effects: { social: 35 / 90, fun: 10 / 90, energy: -1.0 / 60 } },
    fun: { label: 'Svago', effects: { fun: 25 / 60 } },
    idle: { label: 'Idle', effects: { energy: 0.2 } },
}

for (const [key, act] of Object.entries(basicActivities)) {
    activitiesByKey[key] = act
    activitiesByLabel[act.label] = act
}

export const ActivityRegistry = {
    /**
     * Retrieve an activity by internal key or label.
     * @param {string} key
     */
    get(key) {
        return activitiesByKey[key] || activitiesByLabel[key]
    },
}
