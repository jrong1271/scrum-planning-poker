<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'
import { useUserStore } from '../stores/user'
import type { UserState } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const inputUserName = ref<string | null>(null)
const inputRoomId = ref<string | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)

const showNameInput = ref(false)
const actionType = ref<'new' | 'join' | null>(null)
const isLoading = ref(false)

const session = localStorage.getItem('session')
const sessionData = ref<UserState | null>(null)
if (session) {
  sessionData.value = JSON.parse(session)
}

const showNamePrompt = async (type: 'new' | 'join') => {
  actionType.value = type
  showNameInput.value = true
  // Wait for the input to be rendered
  await nextTick()
  // Focus the name input
  nameInputRef.value?.focus()
}

const joinPreviousRoom = () => {
  // handle if user re-joins through the previous room button
  if (sessionData.value?.roomId) {
    userStore.setUserState({
      ...userStore.currentUser,
      ...sessionData.value,
    })
    router.push(`/room/${sessionData.value?.roomId}`)
  }
}

const enterRoom = async () => {
  const userType = actionType.value === 'join' ? 'participant' : 'host'

  userStore.setUserState({
    ...userStore.currentUser,
    roomId: actionType.value === 'join' ? inputRoomId.value : uuidv4(),
    userName: inputUserName.value,
    userType,
  })

  router.push(`/room/${userStore.currentUser.roomId}`)
}
</script>
<template>
  <div class="home">
    <h1>Planning Poker</h1>

    <div class="actions">
      <div v-if="!showNameInput" class="welcome-prompt">
        <h2>Welcome to Planning Poker!</h2>
        <p>Would you like to:</p>
        <div class="action-buttons">
          <v-btn color="primary" @click="showNamePrompt('new')" prepend-icon="mdi-plus">
            Create New Room
          </v-btn>
          <v-btn color="secondary" @click="showNamePrompt('join')" prepend-icon="mdi-door-open">
            Join Existing Room
          </v-btn>
        </div>
        <div v-if="sessionData?.roomId" class="previous-room">
          <p>You were previously in a room:</p>
          <v-btn @click="joinPreviousRoom" color="info" variant="tonal" class="previous-room-btn">
            Rejoin Room: {{ sessionData.roomId }} as {{ sessionData.userName }}
          </v-btn>
        </div>
      </div>

      <div v-if="showNameInput" class="name-prompt">
        <h3>{{ actionType === 'new' ? 'Create New Room' : 'Join Room' }}</h3>
        <div class="input-group">
          <v-text-field
            v-model="inputUserName"
            label="Your Name"
            placeholder="Enter your name"
            :disabled="isLoading"
            variant="outlined"
            density="comfortable"
            ref="nameInputRef"
          />
          <div v-if="actionType === 'join'" class="room-input">
            <v-text-field
              v-model="inputRoomId"
              label="Room ID"
              placeholder="Enter Room ID"
              :disabled="isLoading"
              variant="outlined"
              density="comfortable"
            />
          </div>
          <div class="button-group">
            <v-btn
              @click="showNameInput = false"
              color="secondary"
              variant="outlined"
              prepend-icon="mdi-arrow-left"
            >
              Back
            </v-btn>
            <v-btn
              @click="enterRoom"
              :disabled="!inputUserName || isLoading || (actionType === 'join' && !inputRoomId)"
              color="primary"
            >
              <v-progress-circular
                v-if="isLoading"
                indeterminate
                color="white"
                size="20"
                width="2"
                class="mr-2"
              />
              {{ actionType === 'new' ? 'Create' : 'Join' }}
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Feature Cards -->
    <div class="feature-cards">
      <v-card class="feature-card" elevation="4">
        <v-card-item class="feature-card-content">
          <template v-slot:prepend>
            <v-icon icon="mdi-clock-fast" color="primary" size="x-large" class="feature-icon" />
          </template>
          <v-card-title class="feature-title">Real-time Updates</v-card-title>
          <v-card-text class="feature-text">
            Instant synchronization of card selections and scores across all participants
          </v-card-text>
        </v-card-item>
      </v-card>

      <v-card class="feature-card" elevation="4">
        <v-card-item class="feature-card-content">
          <template v-slot:prepend>
            <v-icon icon="mdi-account-group" color="primary" size="x-large" class="feature-icon" />
          </template>
          <v-card-title class="feature-title">Team Collaboration</v-card-title>
          <v-card-text class="feature-text">
            Easy room sharing and participant management for seamless team planning
          </v-card-text>
        </v-card-item>
      </v-card>

      <v-card class="feature-card" elevation="4">
        <v-card-item class="feature-card-content">
          <template v-slot:prepend>
            <v-icon icon="mdi-eye" color="primary" size="x-large" class="feature-icon" />
          </template>
          <v-card-title class="feature-title">Score Control</v-card-title>
          <v-card-text class="feature-text">
            Host controls for managing score visibility and game rounds
          </v-card-text>
        </v-card-item>
      </v-card>

      <v-card class="feature-card" elevation="4">
        <v-card-item class="feature-card-content">
          <template v-slot:prepend>
            <v-icon icon="mdi-github" color="primary" size="x-large" class="feature-icon" />
          </template>
          <v-card-title class="feature-title">Open Source</v-card-title>
          <v-card-text class="feature-text">
            This project is open source and available on GitHub
          </v-card-text>
          <v-btn
            href="https://github.com/jrong1271/scrum-planning-poker"
            target="_blank"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-github"
            class="mt-2"
          >
            View Source Code
          </v-btn>
        </v-card-item>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 4rem 0 2rem;
  padding: 0.5rem;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
}

.feature-card {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 8px;
  background: white;
  overflow: hidden;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.feature-card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
}

.feature-icon {
  margin-bottom: 0.5rem;
  background: rgba(var(--v-theme-primary), 0.1);
  padding: 0.75rem;
  border-radius: 50%;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.feature-text {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.welcome-prompt,
.name-prompt {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
}

.welcome-prompt h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.welcome-prompt p {
  color: #666;
  margin-bottom: 1.5rem;
}

.previous-room {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.or-divider {
  color: #666;
  margin: 0.5rem 0;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.button-group .v-btn {
  flex: 1;
  max-width: 200px;
}

@media (max-width: 1024px) {
  .feature-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .feature-cards {
    grid-template-columns: 1fr;
    max-width: 400px;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
