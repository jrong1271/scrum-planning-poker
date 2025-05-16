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
      } else {
        // Clear score when card is null
        delete userScores.value[userId]
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
    <div class="users">
      <div v-for="(user, userId) in participants" :key="userId" class="user">
        <span class="user-name">{{ user.userName }}</span>
        <span class="user-role">{{ user.userType === 'host' ? '(Host)' : '(Participant)' }}</span>
        <span class="user-score" v-if="userScores[userId]">{{ userScores[userId] }}</span>
        <span class="user-score pending" v-else>Pending</span>
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

.users {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  background: #f8f9fa;
}

.user-name {
  font-weight: 500;
}

.user-role {
  color: #6c757d;
  font-size: 0.9em;
}

.user-score {
  margin-left: auto;
  font-weight: bold;
  color: #42b883;
}

.user-score.pending {
  color: #ffc107;
}
</style>
