<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Room } from '../stores/room'

const props = defineProps<{
  room: Room | null
  handleSelectCard: (card: number) => void
}>()

const selectedCard = ref<number | null>(null)

// Watch for room changes to reset selected card when game is restarted
watch(
  () => props.room,
  (newRoom) => {
    if (newRoom) {
      // Reset selected card when room data changes (game restart)
      selectedCard.value = null
    }
  },
  { deep: true },
)

const selectCard = (card: number) => {
  selectedCard.value = card
  props.handleSelectCard(card)
}
</script>

<template>
  <div class="game-panel">
    <div class="cards">
      <button
        v-for="card in [1, 2, 3, 5, 8, 13, 21, 34, 55, 89]"
        :key="card"
        class="card"
        :class="{ selected: selectedCard === card }"
        @click="selectCard(card)"
      >
        {{ card }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.game-panel {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.card {
  width: 60px;
  height: 90px;
  border: 2px solid #42b883;
  border-radius: 8px;
  background: white;
  color: #42b883;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.card.selected {
  background: #42b883;
  color: white;
}
</style>
