<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Room } from '../stores/room'

const props = defineProps<{
  room: Room | null
  handleSelectCard: (card: number | null) => void
}>()

const selectedCard = ref<number | null>(null)

// Watch for room changes to reset selected card when game is restarted
watch(
  () => props.room,
  (newRoom, oldRoom) => {
    // Only reset if it's a game restart (all participants' cards are cleared)
    if (newRoom && oldRoom) {
      const allCardsCleared = Object.values(newRoom.participants).every(
        (participant) => participant.selectedCard === null,
      )
      const hadSelectedCards = Object.values(oldRoom.participants).some(
        (participant) => participant.selectedCard !== null,
      )
      if (allCardsCleared && hadSelectedCards) {
        console.log('Game restarted, resetting selected card')
        selectedCard.value = null
      }
    }
  },
  { deep: true },
)

const selectCard = (card: number) => {
  console.log('Before selection - selectedCard:', selectedCard.value)
  // If the same card is clicked again, deselect it
  if (selectedCard.value === card) {
    selectedCard.value = null
    console.log('Deselecting card, new selectedCard:', selectedCard.value)
    props.handleSelectCard(null)
  } else {
    selectedCard.value = card
    console.log('Selecting card, new selectedCard:', selectedCard.value)
    props.handleSelectCard(card)
  }
}

// Add a watch to monitor selectedCard changes
watch(selectedCard, (newValue) => {
  console.log('selectedCard changed to:', newValue)
})
</script>

<template>
  <div class="game-panel">
    <div class="cards">
      <button
        v-for="card in [1, 2, 3, 5, 8, 13, 21, 34, 55, 89]"
        :key="card"
        class="card"
        :class="{
          selected: selectedCard === card,
          'not-selected': selectedCard !== null && selectedCard !== card,
        }"
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
  transition: all 0.15s ease;
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.card.selected {
  background: #42b883;
  color: white;
  transform: translateY(8px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-color: #2c3e50;
}

.card.not-selected {
  opacity: 0.7;
  filter: grayscale(0.5);
}

.card:active {
  transform: translateY(8px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.1s ease;
}
</style>
