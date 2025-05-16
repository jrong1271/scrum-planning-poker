<script setup lang="ts">
import GamePanel from '@/components/GamePanel.vue'
import UserList from '@/components/UserList.vue'

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { io } from 'socket.io-client'

import { useRoomStore } from '../stores/room'
import type { Room } from '../stores/room'

import { v4 as uuidv4 } from 'uuid'

const store = useRoomStore()
const isHost = computed(() => store.currentUser.userType === 'host')
const route = useRoute()
const router = useRouter()

const userId = ref(localStorage.getItem('userId') || '')
const userName = ref(localStorage.getItem('userName') || '')
const showActionPrompt = ref(false)
const showNamePrompt = ref(false)
const inputUserName = ref('')
const selectedAction = ref<'new' | 'join' | ''>('')

const initializeSocket = (roomId: string) => {
  const socket = io('http://localhost:3000', {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: {
      userId: userId.value,
      userName: userName.value,
    },
  })

  store.setSocket(socket)

  socket.on('connect', () => {
    store.setConnectionStatus('connected')
    console.log('Connected to server')
    if (roomId) {
      console.log('Joining room:', roomId)
      if (selectedAction.value === 'new') {
        console.log('Creating new room')
        socket.emit('create-room', {
          userName: userName.value,
          userId: userId.value,
        })
      } else if (selectedAction.value === 'join') {
        console.log('Joining existing room')
        socket.emit('join-room', { roomId, userName: userName.value, userId: userId.value })
      }
    }
  })

  socket.on('room-created', (roomId: string) => {
    console.log('Room created:', roomId)
    localStorage.setItem('roomId', roomId)
  })

  socket.on('error', ({ message }: { message: string }) => {
    console.error('Socket error:', message)
    store.setConnectionStatus('error')
  })

  socket.on('room-data', (room: Room) => {
    store.setRoomData(room)
    const user = room.participants[userId.value]
    if (user) {
      store.setCurrentUser(user)
    }
  })
}

const handleActionSelect = (action: 'new' | 'join') => {
  selectedAction.value = action
  showActionPrompt.value = false
  if (!userName.value) {
    showNamePrompt.value = true
  } else {
    proceedWithConnection()
  }
}

const handleNameSubmit = () => {
  if (inputUserName.value.length > 0) {
    userName.value = inputUserName.value
    userId.value = uuidv4()
    localStorage.setItem('userName', userName.value)
    localStorage.setItem('userId', userId.value)
    showNamePrompt.value = false
    proceedWithConnection()
  }
}

const proceedWithConnection = () => {
  const roomId = route.params.id as string
  if (selectedAction.value === 'new') {
    router.push({ path: '/room/new', query: { action: 'new' } })
  } else if (selectedAction.value === 'join' && roomId) {
    router.push({ path: `/room/${roomId}`, query: { action: 'join' } })
  }
  initializeSocket(roomId || 'new')
}

onMounted(() => {
  const action = route.query.action as string
  if (!action) {
    showActionPrompt.value = true
  } else {
    selectedAction.value = action as 'new' | 'join'
    if (!userName.value) {
      showNamePrompt.value = true
    } else {
      proceedWithConnection()
    }
  }
})

onUnmounted(() => {
  if (store.socket) {
    store.socket.disconnect()
  }
})

const leaveRoom = () => {
  store.leaveRoom()
  router.push('/room')
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
  store.currentUser.score = card
  if (store.socket) {
    store.socket.emit('select-card', {
      userId: store.currentUser.userId,
      card: card,
    })
  }
}
</script>

<template>
  <div class="room-container">
    <!-- Action Selection Prompt -->
    <div v-if="showActionPrompt" class="prompt-overlay">
      <div class="prompt">
        <h3>Welcome to Planning Poker!</h3>
        <p>Would you like to:</p>
        <div class="action-buttons">
          <button @click="handleActionSelect('new')">Create New Room</button>
          <button @click="handleActionSelect('join')">Join Existing Room</button>
        </div>
      </div>
    </div>

    <!-- Name Input Prompt -->
    <div v-if="showNamePrompt" class="prompt-overlay">
      <div class="prompt">
        <h3>Enter Your Name</h3>
        <div class="input-group">
          <input
            v-model="inputUserName"
            type="text"
            placeholder="Your name"
            @keyup.enter="handleNameSubmit"
          />
          <button @click="handleNameSubmit" :disabled="!inputUserName">Continue</button>
        </div>
      </div>
    </div>

    <!-- Main Room View -->
    <div v-if="!showActionPrompt && !showNamePrompt">
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
              >Welcome, <strong>{{ userName }}</strong
              >!</span
            >
            <span v-if="isHost" class="role">(Host)</span>
            <span v-else class="role">(Participant)</span>
            <button @click="copyRoomLink" class="share-btn">Share Room</button>
            <button @click="leaveRoom" class="leave-btn">Leave Room</button>
          </div>

          <GamePanel :room="store.room" :handleSelectCard="selectCard" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.room-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.prompt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.prompt {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: #42b883;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #3aa876;
}

button:disabled {
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

.error-message {
  background: #dc3545;
  color: white;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
  margin-bottom: 1rem;
}
</style>
