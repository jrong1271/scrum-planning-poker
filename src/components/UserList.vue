<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoomStore } from '../stores/room'
import type { User } from '../stores/room'

const props = defineProps<{
  participants: Record<string, User>
}>()

const store = useRoomStore()
const userScores = ref<Record<string, number>>({})

// Watch for changes in participants to sync scores
watch(
  () => props.participants,
  (newParticipants) => {
    Object.entries(newParticipants).forEach(([userId, user]) => {
      if (user.selectedCard !== null && user.selectedCard !== undefined) {
        userScores.value[userId] = user.selectedCard
      }
    })
  },
  { deep: true },
)

onMounted(() => {
  if (store.socket) {
    store.socket.on('score-change', ({ userId, score }: { userId: string; score: number }) => {
      console.log('Score change:', userId, score)
      userScores.value[userId] = score
    })

    // Initialize scores from current participants
    Object.entries(props.participants).forEach(([userId, user]) => {
      if (user.selectedCard !== null && user.selectedCard !== undefined) {
        userScores.value[userId] = user.selectedCard
      }
    })
  }
})

onUnmounted(() => {
  if (store.socket) {
    store.socket.off('score-change')
  }
})
</script>

<template>
  <div class="user-list">
    <h3>Participants</h3>
    <div class="participants">
      <div v-for="(user, userId) in participants" :key="userId" class="participant">
        <div class="user-info">
          <span class="name">{{ user.userName }}</span>
          <span v-if="user.userType === 'host'" class="role">(Host)</span>
        </div>
        <div v-if="userScores[userId]" class="score">
          {{ userScores[userId] }}
        </div>
        <div v-else class="score waiting">Waiting...</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-list {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.participants {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.participant {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  background: #f8f9fa;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.name {
  font-weight: 500;
}

.role {
  font-size: 0.8rem;
  color: #42b883;
}

.score {
  font-weight: bold;
  color: #42b883;
  min-width: 2rem;
  text-align: center;
}

.score.waiting {
  color: #6c757d;
  font-size: 0.8rem;
}
</style>
