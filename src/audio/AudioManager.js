import Soundtrack from 'soundtrack.js'

/**
 * AudioManager centralizza la gestione dell'audio di background usando soundtrack.js.
 * Mantiene lo stato del brano corrente e fornisce metodi basilari di controllo.
 * L'API è pensata per essere estendibile (es. effetti sonori, playlist multiple).
 */
export class AudioManager {
    constructor() {
        /** @private */
        this.soundtrack = null
        /** @private */
        this.currentTrack = null
    }

    /**
     * Carica un brano usando soundtrack.js.
     * @param {string} src - Percorso del file audio (default: '/musica.mp3').
     * @returns {void}
     */
    load(src = '/musica.mp3') {
        if (typeof window === 'undefined') return
        this.soundtrack = new Soundtrack([{ name: 'bg', src }])
        this.currentTrack = 'bg'
    }

    /** Avvia la riproduzione del brano corrente. */
    play() {
        if (this.soundtrack && this.currentTrack) {
            this.soundtrack.play(this.currentTrack)
        }
    }

    /** Mette in pausa la riproduzione. */
    pause() {
        if (this.soundtrack && this.soundtrack.current !== undefined) {
            const player = this.soundtrack.players[this.soundtrack.current]
            if (player) player.pause()
        }
    }

    /**
     * Imposta il volume del brano corrente.
     * @param {number} v - Volume compreso tra 0 e 1.
     */
    setVolume(v) {
        if (this.soundtrack && this.soundtrack.current !== undefined) {
            const player = this.soundtrack.players[this.soundtrack.current]
            if (player) player.volume = v
        }
    }
}

/** Istanza predefinita da riutilizzare nella simulazione. */
const audioManager = new AudioManager()
export default audioManager
