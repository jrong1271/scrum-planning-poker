<template>
  <div class="participant-view">
    <div class="task-display">
      <div class="task-view">
        <h2>{{ currentTask.title || 'No task selected' }}</h2>
        <p>{{ currentTask.description || 'No description available' }}</p>
      </div>
    </div>

    <div class="cards-container">
      <div
        v-for="card in planningCards"
        :key="card.value"
        class="card"
        :class="{ selected: selectedCard === card.value }"
        @click="selectCard(card.value)"
      >
        {{ card.value }}
      </div>
    </div>

    <div v-if="revealed" class="results">
      <h3>Results</h3>
      <div class="results-grid">
        <div v-for="(score, userId) in scores" :key="userId" class="result-item">
          <span>{{ users[userId]?.name || 'User' }}:</span>
          <span>{{ score }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue'
import { Socket } from 'socket.io-client'

interface Props {
  socket: Socket
  roomId: string
  currentTask: { title: string; description: string }
  users: Record<string, { name: string; userType: string }>
  scores: Record<string, number | string>
  revealed: boolean
  selectedCard: number | string | null
}

const props = defineProps<Props>()

const planningCards = [
  { value: 0 },
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 5 },
  { value: 8 },
  { value: 13 },
  { value: 21 },
  { value: 34 },
  { value: 55 },
  { value: 89 },
  { value: '?' },
]

const selectCard = (value: number | string) => {
  if (props.revealed || !props.socket) return
  props.socket.emit('select-card', { roomId: props.roomId, value })
}

defineComponent({
  name: 'ParticipantView',
})
</script>

<style scoped>
.participant-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-display {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card {
  aspect-ratio: 2/3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 2px solid #4caf50;
  border-radius: 8px;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.card.selected {
  background: #4caf50;
  color: white;
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
