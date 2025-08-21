<template>
  <div>
    <header>
      <div>
        <h1>Little World — Simulatore</h1>
        <div class="small">Giornata v0 (AI bisogni) + DNA/EV (hard cap 230) • Speed e Back Office</div>
      </div>
      <UniverseControls
        :speed="speed"
        :clock-label="clockLabel"
        :play="play"
        :pause="pause"
        :step="step"
        :set-speed="updateSpeed"
      />
    </header>

    <div class="tabs">
      <div :class="['tab', tab === 'day' ? 'active' : '']" @click="tab = 'day'">Giornata v0 (AI bisogni)</div>
      <div :class="['tab', tab === 'ev' ? 'active' : '']" @click="tab = 'ev'">DNA/EV</div>
    </div>

    <div v-if="tab === 'day'" class="wrap">
      <PgStatus
        :state="state"
        :cfg="cfg"
        :logs="logs"
        :labels-need="labelsNeed"
        :need-keys="needKeys"
      />
      <ConfigPanel :cfg="cfg" :reinit-day="reinitDay" />
    </div>

    <div v-else class="wrap">
      <DayEv />
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { createUniverse } from '../sim/universe/Universe'
import DayEv from './DayEv.vue'
import UniverseControls from './UniverseControls.vue'
import PgStatus from './PgStatus.vue'
import ConfigPanel from './ConfigPanel.vue'

export default {
  components: { DayEv, UniverseControls, PgStatus, ConfigPanel },
  setup() {
    const { state, cfg, logs, play, pause, step, reinit, setSpeed } = createUniverse()
    const speed = ref(1)
    const tab = ref('day')
    const labelsNeed = { energy: 'Energia', nutrition: 'Nutrizione', hygiene: 'Igiene', social: 'Socialità', fun: 'Divertimento' }
    const needKeys = ['energy', 'nutrition', 'hygiene', 'social', 'fun']

    const clockLabel = computed(() => state.time.toLocaleTimeString())

    watch(speed, (v) => state.speed = v)

    function reinitDay() { reinit(); }

    function updateSpeed(v) {
      speed.value = v
      setSpeed(v)
    }

    return {
      state, cfg, logs,
      speed, clockLabel,
      labelsNeed, needKeys, tab,
      play: () => play(), pause: () => pause(), step: () => step(),
      reinitDay,
      updateSpeed
    }
  }
}
</script>
