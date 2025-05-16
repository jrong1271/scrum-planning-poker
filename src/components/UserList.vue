<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoomStore } from '../stores/room'
import { useUserStore } from '../stores/user'
import type { User } from '../stores/room'

const props = defineProps<{
  participants: Record<string, User>
}>()

const store = useRoomStore()
const userStore = useUserStore()
const userScores = ref<Record<string, number | string>>({})
const showScores = ref(false)

// Watch for changes in participants to sync scores
watch(
  () => props.participants,
  (newParticipants) => {
    // Clear all scores first
    userScores.value = {}

    // Then update with current selections
    Object.entries(newParticipants).forEach(([userId, user]) => {
      if (user.selectedCard !== null && user.selectedCard !== undefined) {
        userScores.value[userId] = user.selectedCard
      }
    })
    // Hide scores when participants change (game restart)
    showScores.value = false
  },
  { deep: true },
)

const toggleScores = () => {
  showScores.value = !showScores.value
}

onMounted(() => {
  if (store.socket) {
    store.socket.on(
      'score-change',
      ({ userId, score }: { userId: string; score: number | null }) => {
        console.log('Score change:', userId, score)
        if (score === null) {
          userScores.value[userId] = 'Pending...'
        } else {
          userScores.value[userId] = score
        }
      },
    )

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
        <div class="score-container">
          <span
            class="user-score"
            v-if="userId === userStore.userId || (showScores && userScores[userId])"
          >
            {{ userScores[userId] }}
          </span>
          <span class="user-score pending" v-else-if="showScores"> Pending </span>
          <span
            class="status-indicator"
            :class="{
              submitted: userScores[userId] && userScores[userId] !== 'Pending...',
              pending: !userScores[userId] || userScores[userId] === 'Pending...',
            }"
            :title="
              userScores[userId] && userScores[userId] !== 'Pending...'
                ? 'Score submitted'
                : 'Waiting for score'
            "
          ></span>
        </div>
      </div>
    </div>
    <div class="footer" v-if="participants[userStore.userId]?.userType === 'host'">
      <button class="toggle-btn" @click="toggleScores">
        {{ showScores ? "Hide Others' Scores" : "Show Others' Scores" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.user-list {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
}

h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.users {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.toggle-btn {
  width: 100%;
  padding: 0.5rem 1rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: #3aa876;
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

.score-container {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-score {
  font-weight: bold;
  color: #42b883;
}

.user-score.pending {
  color: #ffc107;
  font-style: italic;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  transition: all 0.2s ease;
}

.status-indicator.submitted {
  background-color: #42b883;
  box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.2);
}

.status-indicator.pending {
  background-color: #ffc107;
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.4);
  }
  70% {
    box-shadow: 0 0 0 4px rgba(255, 193, 7, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0);
  }
}
</style>
