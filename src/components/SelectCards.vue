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
        selectedCard.value = null
      }
    }
  },
  { deep: true },
)

const selectCard = (card: number) => {
  // If the same card is clicked again, deselect it
  if (selectedCard.value === card) {
    selectedCard.value = null
    props.handleSelectCard(null)
  } else {
    selectedCard.value = card
    props.handleSelectCard(card)
  }
}
</script>

<template>
  <div class="select-cards-panel">
    <div class="cards">
      <button
        v-for="card in [1, 2, 3, 5, 8, 13, 21, 34, 55, 89]"
        :key="card"
        class="card"
        :class="{
          selected: selectedCard === card,
          'high-value': card > 20,
          'medium-value': card > 8 && card <= 20,
          'low-value': card <= 8,
        }"
        @click="selectCard(card)"
      >
        {{ card }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.select-cards-panel {
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
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform-style: preserve-3d;
  perspective: 1000px;
}

.card.low-value {
  border-color: #4caf50;
  color: #4caf50;
  background: linear-gradient(145deg, #ffffff, #f0f0f0);
}

.card.medium-value {
  border-color: #ff9800;
  color: #ff9800;
  background: linear-gradient(145deg, #ffffff, #fff8f0);
}

.card.high-value {
  border-color: #f44336;
  color: #f44336;
  background: linear-gradient(145deg, #ffffff, #fff0f0);
}

.card.low-value:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 6px 12px rgba(76, 175, 80, 0.2);
}

.card.medium-value:hover {
  transform: translateY(-5px) scale(1.05) rotate(2deg);
  box-shadow: 0 8px 16px rgba(255, 152, 0, 0.25);
}

.card.high-value:hover {
  transform: translateY(-8px) scale(1.08) rotate(-3deg);
  box-shadow: 0 12px 24px rgba(244, 67, 54, 0.3);
}

.card.selected {
  background: #42b883;
  color: white;
  transform: translateY(8px) scale(0.95);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-color: #2c3e50;
  animation: selectPulse 0.5s ease-out;
}

@keyframes selectPulse {
  0% {
    transform: translateY(8px) scale(1.1);
    box-shadow: 0 0 0 0 rgba(66, 184, 131, 0.4);
  }
  70% {
    transform: translateY(8px) scale(0.95);
    box-shadow: 0 0 0 10px rgba(66, 184, 131, 0);
  }
  100% {
    transform: translateY(8px) scale(0.95);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 6px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.card.high-value::before {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
}

.card:active {
  transform: translateY(8px) scale(0.95);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.1s ease;
}
</style>
