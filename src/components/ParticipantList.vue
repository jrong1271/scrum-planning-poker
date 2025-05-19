<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoomStore } from '../stores/room'
import { useUserStore } from '../stores/user'
import type { Participant } from '../stores/room'

const props = defineProps<{
  participants: Record<string, Participant>
}>()

const roomStore = useRoomStore()
const userStore = useUserStore()
const userScores = ref<Record<string, number | string | null>>({})
const showScores = ref(false)
const bouncingUsers = ref<Set<string>>(new Set())

// Watch for changes in participants to sync scores
watch(
  () => props.participants,
  (newParticipants) => {
    // Clear all scores first
    userScores.value = {}

    // Then update with current selections
    Object.entries(newParticipants).forEach(([sessionId, user]) => {
      if (user.selectedCard !== null && user.selectedCard !== undefined) {
        userScores.value[sessionId] = user.selectedCard
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

const triggerBounce = (sessionId: string) => {
  bouncingUsers.value.add(sessionId)
  setTimeout(() => {
    bouncingUsers.value.delete(sessionId)
  }, 1000) // Remove bounce class after animation completes
}

onMounted(() => {
  if (roomStore.socket) {
    roomStore.socket.on(
      'score-change',
      ({ sessionId, score }: { sessionId: string; score: number | null }) => {
        userScores.value[sessionId] = score
        triggerBounce(sessionId)
      },
    )

    Object.entries(props.participants).forEach(([sessionId, user]) => {
      if (user.selectedCard !== null && user.selectedCard !== undefined) {
        userScores.value[sessionId] = user.selectedCard
      }
    })
  }
})

onUnmounted(() => {
  if (roomStore.socket) {
    roomStore.socket.off('score-change')
  }
})
</script>

<template>
  <div class="participants-list">
    <h3>Participants</h3>
    <div class="users">
      <div
        v-for="(user, sessionId) in participants"
        :key="sessionId"
        class="user"
        :class="{ bounce: bouncingUsers.has(sessionId) }"
      >
        <v-icon
          start
          :icon="user.userType === 'host' ? 'mdi-account-star' : 'mdi-account'"
          size="small"
          class="mr-1"
        />
        <span class="user-name">{{ user.userName }}</span>
        <div class="score-container">
          <span
            class="user-score"
            v-if="showScores"
            :class="{
              'high-value': typeof userScores[sessionId] === 'number' && userScores[sessionId] > 20,
              'medium-value':
                typeof userScores[sessionId] === 'number' &&
                userScores[sessionId] > 8 &&
                userScores[sessionId] <= 20,
              'low-value': typeof userScores[sessionId] === 'number' && userScores[sessionId] <= 8,
            }"
          >
            {{ userScores[sessionId] }}
          </span>
          <span
            class="status-indicator"
            :class="{
              submitted: userScores[sessionId],
              pending: !userScores[sessionId],
            }"
            :title="
              typeof userScores[sessionId] === 'number' ? 'Score submitted' : 'Waiting for score'
            "
          ></span>
        </div>
      </div>
    </div>
    <div
      class="footer"
      v-if="
        userStore.currentUser?.sessionId &&
        participants[userStore.currentUser.sessionId]?.userType === 'host'
      "
    >
      <button class="toggle-btn" @click="toggleScores">
        {{ showScores ? 'Hide Scores' : 'Show Scores' }}
      </button>
      <button class="toggle-btn restart-btn" @click="roomStore.restartGame">
        <v-icon start icon="mdi-refresh" />
        Restart
      </button>
    </div>
  </div>
</template>

<style scoped>
.participants-list {
  min-width: 312px;
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
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
}

.toggle-btn {
  width: 120px;
  padding: 0.5rem 1rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.toggle-btn:hover {
  background: #3aa876;
}

.toggle-btn.restart-btn {
  background: #ffc107;
}

.toggle-btn.restart-btn:hover {
  background: #e0a800;
}

.user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  background: #f8f9fa;
  transition: transform 0.2s ease;
}

.user.bounce {
  animation: bounce 0.5s cubic-bezier(0.36, 0, 0.66, -0.56);
}

@keyframes bounce {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

.user-name {
  font-weight: 500;
}

.score-container {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-score {
  font-weight: bold;
  transition: all 0.3s ease;
}

.user-score.low-value {
  color: #4caf50;
}

.user-score.medium-value {
  color: #ff9800;
}

.user-score.high-value {
  color: #f44336;
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
