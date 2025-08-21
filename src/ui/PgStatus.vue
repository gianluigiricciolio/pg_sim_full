<template>
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
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'PgStatus',
  props: {
    state: Object,
    cfg: Object,
    logs: Array,
    labelsNeed: Object,
    needKeys: Array
  },
  setup(props) {
    const dateLabel = computed(() => props.state.time.toLocaleDateString())
    const { state, cfg, logs, labelsNeed, needKeys } = props
    return { state, cfg, logs, labelsNeed, needKeys, dateLabel }
  }
}
</script>
