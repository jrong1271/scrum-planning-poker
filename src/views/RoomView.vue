<script setup lang="ts">
import HostView from '../components/HostView.vue'
import ParticipantView from '../components/ParticipantView.vue'
import UserList from '../components/UserList.vue'

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

const userId = ref(localStorage.getItem('userId') || uuidv4())
const userName = ref(localStorage.getItem('userName') || '')

const initializeSocket = () => {
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
    const roomId = route.params.id as string
    const action = route.query.action as string
    if (roomId) {
      console.log('Joining room:', roomId)
      if (action === 'new') {
        console.log('Creating new room')
        socket.emit('create-room', {
          userName: userName.value,
          userId: userId.value,
        })
      } else {
        console.log('Joining existing room')
        socket.emit('join-room', { roomId, userName, userId })
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
    console.log('Room data updated:', store.room)
  })
}

onMounted(() => {
  initializeSocket()
  if (!localStorage.getItem('userId')) {
    localStorage.setItem('userId', userId.value)
  }
})

onUnmounted(() => {
  if (store.socket) {
    store.socket.disconnect()
  }
})

const leaveRoom = () => {
  store.leaveRoom()
  router.push('/')
}

const selectCard = (card: number) => {
  console.log('Selected card:', card)
}
</script>

<template>
  <div class="room-container">
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
          <button @click="leaveRoom" class="leave-btn">Leave Room</button>
        </div>

        <HostView v-if="isHost" :room="store.room" />
        <ParticipantView v-else :room="store.room" :handleSelectCard="selectCard" />
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

.host-section {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #ddd;
}

.participants-section {
  flex: 1;
}

.user-cards {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-header {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.card-body {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
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
  margin-left: 0.5rem;
  color: #42b883;
  font-weight: bold;
}

.task-display {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.task-edit {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-edit input,
.task-edit textarea {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.task-edit textarea {
  min-height: 100px;
  resize: vertical;
}

.task-view {
  cursor: pointer;
}

.task-view:hover {
  background-color: #f5f5f5;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.card {
  aspect-ratio: 2/3;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.5rem;
  font-weight: bold;
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.card.selected {
  border-color: #42b883;
  background: #42b883;
  color: white;
}

.results {
  margin-top: 2rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
}

button {
  padding: 0.5rem 1rem;
  margin: 0.5rem;
  border: none;
  border-radius: 4px;
  background: #42b883;
  color: white;
  cursor: pointer;
  transition: background 0.2s ease;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #3aa876;
}

.host-badge {
  background: #42b883;
  color: white;
  border-radius: 4px;
  padding: 0 0.5rem;
  margin-left: 0.5rem;
  font-size: 0.9em;
}
.me-badge {
  background: #2c3e50;
  color: white;
  border-radius: 4px;
  padding: 0 0.5rem;
  margin-left: 0.5rem;
  font-size: 0.9em;
}

.error-message {
  background-color: #ff4444;
  color: white;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.leave-btn {
  margin-left: auto;
  background-color: #dc3545;
}

.leave-btn:hover {
  background-color: #c82333;
}

.host-participant-list {
  margin: 2rem 0;
}
.participant-score {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: #f9f9f9;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.dev-btn {
  background-color: #6c757d;
  font-size: 0.8em;
  padding: 0.3rem 0.6rem;
}

.dev-btn:hover {
  background-color: #5a6268;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  margin: 0;
}

.close-btn:hover {
  color: #333;
  background: none;
}
</style>
