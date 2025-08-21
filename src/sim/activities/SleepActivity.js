export const SleepActivity = {
    variants: {
        night: {
            label: 'Dormire',
            duration: 480,
            energyPerMinute: 12.5 / 60,
            nutritionPerMinute: -1.0 / 60,
        },
        short: {
            label: 'Dormire (short)',
            duration: 120,
            energyPerMinute: 8 / 60,
            nutritionPerMinute: -0.5 / 60,
        },
        power: {
            label: 'Dormire (power)',
            duration: 20,
            energyPerMinute: 0.5,
            nutritionPerMinute: 0,
        },
    },
}
