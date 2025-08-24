<template>
  <section class="panel">
    <h2>Back Office — Giornata</h2>

    <fieldset>
      <legend>Colonna Sonora</legend>
      <label>Scegli l' audio
        <select :value="track" @change="e => setTrack(value)">
          <option :value="'/music/loop.mp3'">Morning</option>
          <option :value="'/music/musica.mp3'">Afternoon</option>
          <option :value="'/music/evening.mp3'">Evening</option>
        </select>
      </label>

    </fieldset>

    <fieldset>
      <legend>Tempo</legend>
      <div class="grid2">
        <label>Ora iniziale <input type="number" v-model.number="cfg.time.startHour" min="0" max="23"></label>
        <label>Seed RNG <input type="number" v-model.number="cfg.seed"></label>
      </div>
      <div><button @click="reinitDay">Reinit giornata</button></div>
    </fieldset>

    <fieldset>
      <legend>Lavoro</legend>
      <div class="grid2">
        <label>Work ON <input type="checkbox" v-model="cfg.work.on"></label>
        <label>Start <input type="number" v-model.number="cfg.work.start" min="0" max="23"></label>
        <label>End <input type="number" v-model.number="cfg.work.end" min="0" max="23"></label>
      </div>
    </fieldset>

    <fieldset>
      <legend>Pasti & Sonno</legend>
      <div class="grid2">
        <label>Col: {{ cfg.meals.breakfast[0] }}–{{ cfg.meals.breakfast[1] }}</label>
        <label>Pranzo: {{ cfg.meals.lunch[0] }}–{{ cfg.meals.lunch[1] }}</label>
        <label>Cena: {{ cfg.meals.dinner[0] }}–{{ cfg.meals.dinner[1] }}</label>
        <label>Notte: 23–7 (flessibile)</label>
      </div>
    </fieldset>

    <fieldset>
      <legend>Decadimenti & Soglie</legend>
      <div class="grid2">
        <label>Energia/h <input type="number" v-model.number="cfg.decay.energy.base" step="0.1"></label>
        <label>Nutrizione/h <input type="number" v-model.number="cfg.decay.nutrition" step="0.1"></label>
        <label>Igiene/h <input type="number" v-model.number="cfg.decay.hygiene" step="0.1"></label>
        <label>Socialità/h <input type="number" v-model.number="cfg.decay.social" step="0.1"></label>
        <label>Divertimento/h <input type="number" v-model.number="cfg.decay.fun" step="0.1"></label>
      </div>
      <div class="grid2">
        <label>Thr Energia <input type="number" v-model.number="cfg.thr.energy" step="1"></label>
        <label>Thr Nutrizione <input type="number" v-model.number="cfg.thr.nutrition" step="1"></label>
        <label>Thr Igiene <input type="number" v-model.number="cfg.thr.hygiene" step="1"></label>
        <label>Thr Socialità <input type="number" v-model.number="cfg.thr.social" step="1"></label>
        <label>Thr Divertimento <input type="number" v-model.number="cfg.thr.fun" step="1"></label>
      </div>
    </fieldset>
  </section>
</template>

<script>
export default {
  name: 'ConfigPanel',
  props: {
    cfg: Object,
    reinitDay: Function
  },
  setup(props) {
    const { cfg, reinitDay } = props
    return { cfg, reinitDay }
  }
}
</script>
