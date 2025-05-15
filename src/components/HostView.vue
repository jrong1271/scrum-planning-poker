<script setup lang="ts">
import { computed } from 'vue'
import type { RoomData } from '../stores/room'
interface Props {
  room: RoomData | null
}

const props = defineProps<Props>()

const participants = computed(() => {
  return props.room
    ? Object.values(props.room.participants).filter((user) => user.userType !== 'host')
    : []
})
</script>

<template>
  <div class="host-view">
    <div class="host-participant-list">
      <h3>Participants</h3>
      <div v-for="user in participants" :key="user.userId" class="participant-score">
        <span>{{ user.userName }}</span>
        <span>{{ user.score }}</span>
      </div>
    </div>

    <h3>Results</h3>
    <div class="results-grid">
      <div v-for="participant in participants" :key="participant.userId" class="result-item">
        <span>{{ participant.userName }} : {{ participant.score }}:</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.host-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.host-participant-list {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.participant-score {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
}

.results {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
}
</style>
