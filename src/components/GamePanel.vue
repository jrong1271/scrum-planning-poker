<script setup lang="ts">
import type { Room } from '../stores/room'
import { ref, computed } from 'vue'
interface Props {
  room: Room | null
  handleSelectCard: (card: number) => void
}
const selectedCard = ref<number | string | null>(null)
const props = defineProps<Props>()

const selectCard = (card: number) => {
  selectedCard.value = card
  props.handleSelectCard(card)
}
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
]
</script>

<template>
  <div class="host-view">
    <h3>Select your card</h3>
  </div>
  <div class="participant-view">
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
