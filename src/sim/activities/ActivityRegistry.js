import { SleepActivity } from './SleepActivity.js'
import { WorkActivity } from './WorkActivity.js'

const activitiesByLabel = {}

function registerVariants(activity) {
    if (!activity?.variants) return
    for (const variant of Object.values(activity.variants)) {
        activitiesByLabel[variant.label] = variant
    }
}

registerVariants(SleepActivity)
registerVariants(WorkActivity)

const basicActivities = [
    { label: 'Mangiare', effects: { nutrition: 50 / 40 } },
    { label: 'Lavarsi', effects: { hygiene: 40 / 12 } },
    { label: 'Socializzare', effects: { social: 35 / 90, fun: 10 / 90, energy: -1.0 / 60 } },
    { label: 'Svago', effects: { fun: 25 / 60 } },
    { label: 'Idle', effects: { energy: 0.2 } },
]

for (const act of basicActivities) {
    activitiesByLabel[act.label] = act
}

export const ActivityRegistry = {
    get(name) {
        return activitiesByLabel[name]
    },
}
