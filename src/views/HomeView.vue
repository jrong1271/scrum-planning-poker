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
          <v-btn color="secondary" @click="showNamePrompt('join')" prepend-icon="mdi-login">
            Join Existing Room
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
          />
          <div v-if="actionType === 'join'" class="room-input">
            <div v-if="previousRoom" class="previous-room">
              <p>You were previously in a room:</p>
              <v-btn
                @click="usePreviousRoom"
                color="info"
                variant="tonal"
                class="previous-room-btn"
              >
                Rejoin Room: {{ previousRoom }}
              </v-btn>
              <p class="or-divider">- OR -</p>
            </div>
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
              :disabled="
                !inputUserName ||
                isLoading ||
                (actionType === 'join' && !userStore.roomId && !inputRoomId)
              "
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
              {{ actionType === 'new' ? 'Create Room' : 'Join Room' }}
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'
import { useUserStore } from '../stores/user'
import { io, Socket } from 'socket.io-client'

const router = useRouter()
const userStore = useUserStore()

const inputUserName = ref('')
const inputRoomId = ref('')
const showNameInput = ref(false)
const actionType = ref('')
const isLoading = ref(false)
const previousRoom = ref<string | null>(null)

onMounted(() => {
  // Check if we have a previous room
  const storedRoomId = localStorage.getItem('roomId')
  if (storedRoomId) {
    previousRoom.value = storedRoomId
  }
})

const showNamePrompt = (type: string) => {
  actionType.value = type
  showNameInput.value = true
}

const usePreviousRoom = () => {
  if (previousRoom.value) {
    inputRoomId.value = previousRoom.value
  }
}

const enterRoom = async () => {
  if (!inputUserName.value) return

  const userId = uuidv4()
  userStore.setUserState({
    userId,
    userName: inputUserName.value,
    action: actionType.value as 'new' | 'join',
  })

  if (actionType.value === 'new') {
    isLoading.value = true
    let socket: Socket | null = null

    try {
      // For new rooms, we'll create the room first
      socket = io('http://localhost:3000', {
        auth: {
          userId,
          userName: inputUserName.value,
        },
        timeout: 5000,
      })

      // Create a promise to handle the room creation
      const roomCreated = new Promise<string>((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not initialized'))
          return
        }

        const timeoutId = setTimeout(() => {
          reject(new Error('Room creation timed out'))
        }, 10000)

        socket.on('connect', () => {
          console.log('Connected to server, creating room...')
          socket?.emit('create-room', {
            userName: inputUserName.value,
            userId,
          })
        })

        socket.on('room-created', (roomId: string) => {
          console.log('Room created with ID:', roomId)
          clearTimeout(timeoutId)
          resolve(roomId)
        })

        socket.on('error', (error: Error) => {
          console.error('Error creating room:', error)
          clearTimeout(timeoutId)
          reject(error)
        })

        socket.on('connect_error', (error: Error) => {
          console.error('Connection error:', error)
          clearTimeout(timeoutId)
          reject(error)
        })
      })

      // Wait for room creation
      const roomId = await roomCreated
      userStore.setUserState({ roomId })
      router.push(`/room/${roomId}`)
    } catch (error) {
      console.error('Failed to create room:', error)
      isLoading.value = false
      alert('Failed to create room. Please try again.')
    } finally {
      if (socket) {
        socket.disconnect()
      }
    }
  } else {
    // For joining rooms, use the existing roomId or input roomId
    const roomId = userStore.roomId || inputRoomId.value
    if (!roomId) {
      alert('Please enter a Room ID')
      return
    }
    userStore.setUserState({ roomId })
    router.push(`/room/${roomId}`)
  }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
