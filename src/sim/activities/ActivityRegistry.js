import { SleepActivity } from './SleepActivity.js'
import { WorkActivity } from './WorkActivity.js'
import { EatActivity } from './EatActivity.js'
import { WashActivity } from './WashActivity.js'
import { SocialActivity } from './SocialActivity.js'
import { FunActivity } from './FunActivity.js'
import { IdleActivity } from './IdleActivity.js'

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

// Register activities
registerVariants(SleepActivity, 'sleep')
registerVariants(WorkActivity, 'work')
registerVariants(EatActivity)
registerVariants(WashActivity)
registerVariants(SocialActivity)
registerVariants(FunActivity)
registerVariants(IdleActivity)

export const ActivityRegistry = {
    /**
     * Retrieve an activity by internal key or label.
     * @param {string} key
     */
    get(key) {
        return activitiesByKey[key] || activitiesByLabel[key]
    },
}
