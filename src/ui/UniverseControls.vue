<template>
  <div class="controls">
    <button @click="play">Play</button>
    <button @click="pause">Pause</button>
    <button @click="step">Step</button>
    <label>Speed
      <select :value="speed" @change="e => setSpeed(Number(e.target.value))">
        <option :value="1">realtime</option>
        <option :value="60">1min/s</option>
        <option :value="600">10min/s</option>
        <option :value="3600">1hr/s</option>
      </select>
    </label>
    <span class="small">Ora: {{ clockLabel }}</span>
  </div>
</template>

<script>
export default {
  name: 'UniverseControls',
  props: {
    speed: { type: Number, default: 1 },
    clockLabel: { type: String, default: '' },
    play: { type: Function, required: true },
    pause: { type: Function, required: true },
    step: { type: Function, required: true },
    setSpeed: { type: Function, required: true }
  }
}
</script>
