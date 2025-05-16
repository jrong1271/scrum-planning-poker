<template>
  <div class="home">
    <h1>Planning Poker</h1>
    <div class="actions">
      <div v-if="!showNameInput" class="welcome-prompt">
        <h2>Welcome to Planning Poker!</h2>
        <p>Would you like to:</p>
        <div class="action-buttons">
          <button @click="showNamePrompt('new')">Create New Room</button>
          <button @click="showNamePrompt('join')">Join Existing Room</button>
        </div>
      </div>

      <div v-if="showNameInput" class="name-prompt">
        <h3>{{ actionType === 'new' ? 'Create New Room' : 'Join Room' }}</h3>
        <div class="input-group">
          <input
            v-model="inputUserName"
            type="text"
            placeholder="Enter your name"
            :disabled="isLoading"
          />
          <div v-if="actionType === 'join'" class="room-input">
            <div v-if="previousRoom" class="previous-room">
              <p>You were previously in a room:</p>
              <button @click="usePreviousRoom" class="previous-room-btn">
                Rejoin Room: {{ previousRoom }}
              </button>
              <p class="or-divider">- OR -</p>
            </div>
            <input
              v-model="inputRoomId"
              type="text"
              placeholder="Enter Room ID"
              :disabled="isLoading"
            />
          </div>
          <button
            @click="enterRoom"
            :disabled="
              !inputUserName ||
              isLoading ||
              (actionType === 'join' && !userStore.roomId && !inputRoomId)
            "
          >
            <span v-if="isLoading">Creating Room...</span>
            <span v-else>{{ actionType === 'new' ? 'Create Room' : 'Join Room' }}</span>
          </button>
        </div>
      </div>
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
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
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

input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 0.5rem 1rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  min-width: 150px;
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  background-color: #3aa876;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.welcome-prompt h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.welcome-prompt p {
  color: #666;
  margin-bottom: 1.5rem;
}

.name-prompt h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.previous-room {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.previous-room p {
  margin: 0.5rem 0;
  color: #666;
}

.previous-room-btn {
  background: #2196f3;
  width: 100%;
}

.previous-room-btn:hover {
  background: #1976d2;
}

.or-divider {
  color: #999;
  font-size: 0.9em;
  margin: 0.5rem 0;
}

.room-input {
  margin-top: 1rem;
}

.room-input input {
  width: 100%;
}
</style>
