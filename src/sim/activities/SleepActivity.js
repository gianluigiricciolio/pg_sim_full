export const SleepActivity = {
    variants: {
        night: {
            label: 'Dormire',
            duration: 480,
            effects: {
                energy: 12.5 / 60,
                nutrition: -1.0 / 60,
            },
            skipDecay: true,
        },
        short: {
            label: 'Dormire (short)',
            duration: 120,
            effects: {
                energy: 8 / 60,
                nutrition: -0.5 / 60,
            },
        },
        power: {
            label: 'Dormire (power)',
            duration: 20,
            effects: {
                energy: 0.5,
                nutrition: 0,
            },
        },
    },
}
