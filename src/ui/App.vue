<template>
  <div>
    <header>
      <div>
        <h1>Little World — Simulatore</h1>
        <div class="small">Giornata v0 (AI bisogni) + DNA/EV (hard cap 230) • Speed e Back Office</div>
      </div>
      <div class="controls">
        <button @click="play">Play</button>
        <button @click="pause">Pause</button>
        <button @click="step">Step</button>
        <label>Speed
          <select v-model.number="speed" @change="setSpeed(speed)">
            <option :value="1">realtime</option>
            <option :value="60">1min/s</option>
            <option :value="600">10min/s</option>
            <option :value="3600">1hr/s</option>
          </select>
        </label>
        <span class="small">Ora: {{ clockLabel }}</span>
      </div>
    </header>

    <div class="tabs">
      <div :class="['tab', tab === 'day' ? 'active' : '']" @click="tab = 'day'">Giornata v0 (AI bisogni)</div>
      <div :class="['tab', tab === 'ev' ? 'active' : '']" @click="tab = 'ev'">DNA/EV</div>
    </div>

    <div v-if="tab === 'day'" class="wrap">
      <section class="panel">
        <h2>Stato & Log</h2>
        <div class="kv"><b>Data</b><span>{{ dateLabel }}</span></div>
        <div class="kv"><b>Attività corrente</b><span>{{ state.pg.state.activity.name }}</span></div>
        <div class="kv"><b>Lavoro</b><span>{{ cfg.work.on ? 'ON' : 'OFF' }}</span></div>
        <h3>Log eventi</h3>
        <div class="list small" ref="logEl">
          <div v-for="(l, i) in logs.slice(-120)" :key="i">{{ l }}</div>
        </div>
      </section>

      <section class="panel">
        <h2>Bisogni</h2>
        <table>
          <thead>
            <tr>
              <th>Bisogno</th>
              <th>Valore</th>
              <th>Barra</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="n in needKeys" :key="n">
              <td>{{ labelsNeed[n] }}</td>
              <td>{{ Math.round(state.pg.state.needs[n]) }}</td>
              <td>
                <div class="bar"><i :style="{ width: Math.max(0, Math.min(100, state.pg.state.needs[n])) + '%' }"></i></div>
              </td>
            </tr>
          </tbody>
        </table>
        <h3>Parametri attuali</h3>
        <div class="small">Decadimenti: {{ cfg.decay }}</div>
        <div class="small">Soglie: {{ cfg.thr }}</div>
      </section>

      <section class="panel">
        <h2>Back Office — Giornata</h2>
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
    </div>

    <div v-else class="wrap">
      <DayEv />
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { createUniverse } from '../sim/universe/Universe'
import DayEv from './DayEv.vue'

export default {
  components: { DayEv },
  setup() {
    const { state, cfg, logs, play, pause, step, reinit, setSpeed } = createUniverse()
    const speed = ref(1)
    const tab = ref('day')
    const labelsNeed = { energy: 'Energia', nutrition: 'Nutrizione', hygiene: 'Igiene', social: 'Socialità', fun: 'Divertimento' }
    const needKeys = ['energy', 'nutrition', 'hygiene', 'social', 'fun']

    const clockLabel = computed(() => state.time.toLocaleTimeString())
    const dateLabel = computed(() => state.time.toLocaleDateString())

    watch(speed, (v) => state.speed = v)

    function reinitDay() { reinit(); }

    return {
      state, cfg, logs,
      speed, clockLabel, dateLabel,
      labelsNeed, needKeys, tab,
      play: () => play(), pause: () => pause(), step: () => step(),
      reinitDay,
      setSpeed
    }
  }
}
</script>
