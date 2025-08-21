<template>
  <section class="panel" style="grid-column: 1 / span 3;">
    <h2>DNA/EV (anteprima)</h2>
    <div class="small">Questa sezione mostra l'anteprima del simulatore DNA/EV. (Prossimo step: legare EV alle attività)</div>
    <table>
      <thead><tr><th>Stat</th><th>DNA</th><th>EV</th><th>Finale</th></tr></thead>
      <tbody>
        <tr v-for="s in stats" :key="s">
          <td>{{ labels[s] }}</td>
          <td>{{ dna[s] }}</td>
          <td>{{ ev[s] }}</td>
          <td>{{ dna[s] + Math.floor(ev[s]/10) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script>
export default {
  name: 'DayEv',
  data(){
    const stats = ['carisma','disciplina','mente','fortuna','vigore','coordinazione','energia']
    const dna = Object.fromEntries(stats.map(s=>[s, Math.floor(Math.random()*10)+1]))
    const ev = Object.fromEntries(stats.map(s=>[s, 0]))
    return { stats, dna, ev, labels: {carisma:'Carisma',disciplina:'Disciplina',mente:'Mente',fortuna:'Fortuna',vigore:'Vigore',coordinazione:'Coordinazione',energia:'Energia'} }
  }
}
</script>
