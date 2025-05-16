<script setup lang="ts">
import GamePanel from '@/components/GamePanel.vue'
import UserList from '@/components/UserList.vue'

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { io } from 'socket.io-client'
import { v4 as uuidv4 } from 'uuid'

import { useRoomStore } from '../stores/room'
import { useUserStore } from '../stores/user'
import type { Room } from '../stores/room'

const store = useRoomStore()
const userStore = useUserStore()
const isHost = computed(() => store.currentUser.userType === 'host')
const route = useRoute()
const router = useRouter()

const showNamePrompt = ref(false)
const inputUserName = ref('')
const roomId = ref<string | null>(null)

onMounted(() => {
  // Get roomId from route or store
  const routeRoomId = route.params.id as string
  const storeRoomId = userStore.roomId
  const currentRoomId =
    routeRoomId && routeRoomId !== 'new' && routeRoomId !== 'join' ? routeRoomId : storeRoomId

  console.log('Current room ID:', currentRoomId)
  console.log('User ID:', userStore.userId)
  console.log('User Name:', userStore.userName)

  if (!currentRoomId) {
    console.log('No room ID available, redirecting to home')
    router.push('/')
    return
  }

  // Store roomId for later use
  roomId.value = currentRoomId

  // If no userId or userName, show name prompt
  if (!userStore.userId || !userStore.userName) {
    console.log('Missing user data, showing name prompt')
    showNamePrompt.value = true
    console.log('showNamePrompt set to:', showNamePrompt.value)
    return
  }

  // We have all required data, initialize socket
  initializeSocket(currentRoomId)
})

onUnmounted(() => {
  if (store.socket) {
    store.socket.disconnect()
  }
})

const leaveRoom = () => {
  store.leaveRoom()
  userStore.clearUserState()
  router.push('/')
}

const copyRoomLink = async () => {
  const url = window.location.origin + window.location.pathname + '?action=join'
  try {
    await navigator.clipboard.writeText(url)
    console.log('Link copied to clipboard')
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}

const selectCard = (card: number) => {
  console.log('Selected card:', card)
  if (store.socket && store.room) {
    store.socket.emit('select-card', {
      roomId: store.room.roomId,
      userId: userStore.userId,
      card: card,
    })
  }
}

const handleNameSubmit = (name: string) => {
  if (!name || !roomId.value) return
  console.log('Submitting name:', name)
  const userId = uuidv4() // Generate new userId if not exists
  userStore.setUserState({
    userId,
    userName: name,
  })
  showNamePrompt.value = false

  // Now we have all required data, initialize socket
  initializeSocket(roomId.value)
}

const initializeSocket = (roomId: string) => {
  if (!userStore.userId || !userStore.userName) {
    console.log('Cannot initialize socket: missing user data')
    return
  }

  // First try to connect to the room
  const socket = io('http://localhost:3000', {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: {
      userId: userStore.userId,
      userName: userStore.userName,
    },
  })

  store.setSocket(socket)

  socket.on('connect', () => {
    store.setConnectionStatus('connected')
    console.log('Connected to server')
    if (roomId) {
      console.log('Joining room:', roomId)
      socket.emit('join-room', {
        roomId,
        userName: userStore.userName,
        userId: userStore.userId,
      })
    }
  })

  socket.on('room-created', (roomId: string) => {
    console.log('Room created:', roomId)
    userStore.setUserState({ roomId })
    // Update URL with the new roomId
    router.replace(`/room/${roomId}`)
  })

  socket.on('error', ({ message }: { message: string }) => {
    console.error('Socket error:', message)
    store.setConnectionStatus('error')
    if (message === 'Room not found') {
      // Clear user state and redirect to home
      userStore.clearUserState()
      router.push('/')
    }
  })

  socket.on('room-data', (room: Room) => {
    console.log('Received room data:', room)
    store.setRoomData(room)
    const user = room.participants[userStore.userId]
    if (user) {
      store.setCurrentUser(user)
    }
  })

  socket.on('disconnect', () => {
    console.log('Disconnected from server')
    store.setConnectionStatus('disconnected')
  })
}
</script>

<template>
  <div class="room-container">
    <div v-if="showNamePrompt" class="name-prompt">
      <h3>Enter Your Name</h3>
      <div class="input-group">
        <input
          v-model="inputUserName"
          type="text"
          placeholder="Enter your name"
          @keyup.enter="handleNameSubmit(inputUserName)"
        />
        <button @click="handleNameSubmit(inputUserName)" :disabled="!inputUserName">
          Join Room
        </button>
      </div>
    </div>
    <template v-else>
      <div v-if="store.connectionStatus === 'error'" class="error-message">
        Connection error. Please check if the server is running.
      </div>
      <div v-else-if="store.connectionStatus === 'disconnected'" class="error-message">
        Disconnected from server. Trying to reconnect...
      </div>
      <div v-else class="room-layout">
        <div class="left-panel">
          <UserList :participants="store.participants" />
        </div>

        <div class="right-panel">
          <div class="user-info">
            <span
              >Welcome, <strong>{{ userStore.userName }}</strong
              >!</span
            >
            <span v-if="isHost" class="role">(Host)</span>
            <span v-else class="role">(Participant)</span>
            <button @click="copyRoomLink" class="share-btn">Share Room</button>
            <button v-if="isHost" @click="store.restartGame" class="restart-btn">
              Restart Game
            </button>
            <button @click="leaveRoom" class="leave-btn">Leave Room</button>
          </div>

          <GamePanel :room="store.room" :handleSelectCard="selectCard" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.room-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.name-prompt {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.name-prompt h3 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.input-group button {
  padding: 0.75rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.input-group button:hover:not(:disabled) {
  background: #3aa876;
}

.input-group button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.room-layout {
  display: flex;
  gap: 2rem;
}

.left-panel {
  flex: 0 0 250px;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 1rem;
}

.right-panel {
  flex: 1;
}

.user-info {
  margin-bottom: 1rem;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.role {
  color: #42b883;
  font-weight: bold;
}

button {
  padding: 0.5rem 1rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  background-color: #3aa876;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.share-btn {
  background: #2196f3;
}

.share-btn:hover {
  background: #1976d2;
}

.leave-btn {
  background: #dc3545;
}

.leave-btn:hover {
  background: #c82333;
}

.restart-btn {
  background: #ffc107;
}

.restart-btn:hover {
  background: #e0a800;
}

.error-message {
  background: #dc3545;
  color: white;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
  margin-bottom: 1rem;
}
</style>
