export const AudioManager = {
  audio: null,
  init(track = '/public/musica.mp3') {
    if (!this.audio) {
      this.audio = new Audio(track)
      this.audio.loop = true
    }
  },
  play() {
    if (this.audio) this.audio.play()
  },
  pause() {
    if (this.audio) this.audio.pause()
  },
  setTrack(url) {
    if (!this.audio) {
      this.init(url)
    } else {
      this.audio.src = url
      this.audio.load()
    }
  },
  setVolume(v) {
    if (this.audio) this.audio.volume = v
  },
  setLoop(loop) {
    if (this.audio) this.audio.loop = loop
  }
}
