export const WorkActivity = {
    variants: {
        block: {
            label: 'Lavorare',
            duration: 30,
            effects: {
                energy: -4.0 / 60,
                nutrition: -2.0 / 60,
            },
        },
    },
    /**
     * Crea un orario di lavoro composto da blocchi di durata fissa
     * permettendo di inserire altre attività all'interno.
     * @param {Date} start - ora di inizio lavoro
     * @param {Date} end - ora di fine lavoro
     * @param {number} [blockMinutes=WorkActivity.variants.block.duration] - durata del blocco base
     * @param {Array<{start: Date, name: string, duration: number}>} [inserts=[]]
     *        attività da inserire all'interno dell'orario
     * @returns {Array<{start: Date, name: string, duration: number}>} - lista ordinata di attività
     * @sideeffect None. Restituisce un nuovo array senza modificare gli argomenti.
     */
    buildSchedule(start, end, blockMinutes = 30, inserts = []) {
        const result = []
        const extras = [...inserts].sort((a, b) => a.start - b.start)
        const blockLabel = WorkActivity.variants.block.label
        let current = new Date(start)
        let i = 0
        while (current < end) {
            const nextExtra = extras[i]
            if (nextExtra && current >= nextExtra.start && current < new Date(nextExtra.start.getTime() + nextExtra.duration * 60000)) {
                // If current overlaps an extra, skip to end of extra
                current = new Date(nextExtra.start.getTime() + nextExtra.duration * 60000)
                i++
                continue
            }
            if (nextExtra && nextExtra.start <= end && nextExtra.start > current) {
                // Fill work blocks until next extra starts
                const minutesUntilExtra = (nextExtra.start - current) / 60000
                let remaining = minutesUntilExtra
                while (remaining > 0) {
                    const chunk = Math.min(blockMinutes, remaining)
                    result.push({ start: new Date(current), name: blockLabel, duration: chunk })
                    current = new Date(current.getTime() + chunk * 60000)
                    remaining -= chunk
                }
                // add the extra
                result.push({ start: new Date(nextExtra.start), name: nextExtra.name, duration: nextExtra.duration })
                current = new Date(nextExtra.start.getTime() + nextExtra.duration * 60000)
                i++
            } else {
                // No more extras or extras after end; fill work blocks until end
                const minutesLeft = (end - current) / 60000
                if (minutesLeft <= 0) break
                const chunk = Math.min(blockMinutes, minutesLeft)
                result.push({ start: new Date(current), name: blockLabel, duration: chunk })
                current = new Date(current.getTime() + chunk * 60000)
            }
        }
        return result
    },
}
