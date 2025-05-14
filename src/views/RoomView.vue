<template>
  <div class="room-container">
    <div v-if="connectionStatus === 'error'" class="error-message">
      Connection error. Please check if the server is running.
    </div>
    <div v-else-if="connectionStatus === 'disconnected'" class="error-message">
      Disconnected from server. Trying to reconnect...
    </div>
    <div v-if="showNameModal" class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <h2>Enter your name</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <input v-model="userName" placeholder="Your name" @keyup.enter="submitName" />
        <button @click="submitName" :disabled="!userName.trim()">Join Room</button>
      </div>
    </div>

    <div v-else class="room-layout">
      <div class="left-panel">
        <div class="host-section" v-if="hostId">
          <h3>Host</h3>
          <div class="user-card">
            <div class="card-header">{{ currentUserName }}</div>
            <div class="card-body">
              <span v-if="revealed">
                <span class="card-value">{{
                  scores[hostId] !== undefined ? scores[hostId] : '-'
                }}</span>
              </span>
              <span v-else>
                <span v-if="scores[hostId] !== undefined" class="voted">✔️</span>
                <span v-else class="waiting">⏳</span>
              </span>
            </div>
            <div class="card-footer">
              <span class="host-badge">Host</span>
              <span v-if="hostId === socketId" class="me-badge">You</span>
            </div>
          </div>
        </div>

        <div class="participants-section">
          <h3>Participants</h3>
          <div class="user-cards">
            <div v-for="(user, id) in participants" :key="id" class="user-card">
              <div class="card-header">{{ user.name }}</div>
              <div class="card-body">
                <span v-if="revealed">
                  <span class="card-value">{{ scores[id] !== undefined ? scores[id] : '-' }}</span>
                </span>
                <span v-else>
                  <span v-if="scores[id] !== undefined" class="voted">✔️</span>
                  <span v-else class="waiting">⏳</span>
                </span>
              </div>
              <div class="card-footer">
                <span v-if="id === socketId" class="me-badge">You</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div class="user-info">
          <span
            >Welcome, <strong>{{ userName }}</strong
            >!</span
          >
          <span v-if="isHost" class="role">(Host)</span>
          <span v-else-if="!isHost" class="role">(Participant)</span>
          <button @click="leaveRoom" class="leave-btn">Leave Room</button>
          <button v-if="isDev" @click="clearCookies" class="dev-btn">Clear Cookies (Dev)</button>
          <button @click="copyRoomLink" class="share-btn">Share Room Link</button>
        </div>

        <HostView
          v-if="isHost"
          :socket="socket"
          :room-id="roomId"
          :current-task="currentTask"
          :users="users"
          :scores="scores"
          :revealed="revealed"
        />
        <ParticipantView
          v-else
          :socket="socket"
          :room-id="roomId"
          :current-task="currentTask"
          :users="users"
          :scores="scores"
          :revealed="revealed"
          :selected-card="selectedCard"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { io, Socket } from 'socket.io-client'
import { setSessionCookie, clearSessionCookie } from '../utils/cookies'
import HostView from '../components/HostView.vue'
import ParticipantView from '../components/ParticipantView.vue'

interface User {
  name: string
  userType: string
}
interface RoomData {
  task: { title: string; description: string }
  participants: Record<string, User>
  host: { uuid: string; name: string; userType: string }
}

const room = ref<RoomData | null>(null)
const currentUser = ref<User | null>(null)
const route = useRoute()
const router = useRouter()
const roomId = computed(() => route.params.id as string)

// Move socket initialization to a function
const socket = ref<Socket | null>(null)
const connectionStatus = ref('disconnected')
const roomExists = ref(false)

const isHost = computed(() => currentUser.value?.userType === 'host')
const currentTask = ref({ title: '', description: '' })
const selectedCard = ref<number | string | null>(null)
const revealed = ref(false)
const scores = ref<Record<string, number | string>>({})
const users = ref<Record<string, User>>({})
const userName = ref(localStorage.getItem('userName') || '')
const showNameModal = ref(false)
const socketId = socket.value?.id
const currentUserName = ref('')

const initializeSocket = () => {
  socket.value = io('http://localhost:3000', {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  socket.value.on('connect', () => {
    connectionStatus.value = 'connected'
    console.log('Connected to server')

    // If this is a new room, create it
    if (roomId.value === 'new') {
      socket.value?.emit('create-room', {
        name: userName.value,
        userType: 'host',
      })
    } else {
      // Otherwise check if room exists
      socket.value?.emit('check-room', roomId.value)
    }
  })

  socket.value.on('room-created', (newRoomId: string) => {
    // Update URL with the new room ID
    router.replace(`/room/${newRoomId}`)
    // Then join the room
    socket.value?.emit('join-room', {
      roomId: newRoomId,
      name: userName.value,
      userType: 'host',
    })
  })

  socket.value.on('room-check', (exists: boolean) => {
    roomExists.value = exists
    if (!exists) {
      clearSessionCookie()
      router.push('/')
    } else {
      // Join existing room
      socket.value?.emit('join-room', {
        roomId: roomId.value,
        name: userName.value,
        userType: 'participant',
      })
      setSessionCookie({
        roomId: roomId.value,
        userName: userName.value,
        timestamp: Date.now(),
      })
    }
  })

  // Register all event listeners
  socket.value.on('assign-host', (data: { roomId: string; name: string; userType: string }) => {
    console.log('Assign host', data)
    currentUser.value = { name: data.name, userType: data.userType }
  })

  socket.value.on('connect_error', (error: Error) => {
    connectionStatus.value = 'error'
    console.error('Connection error:', error)
  })

  socket.value.on('disconnect', () => {
    connectionStatus.value = 'disconnected'
    console.log('Disconnected from server')
  })

  socket.value.on(
    'room-data',
    (data: {
      task: { title: string; description: string }
      participants: Record<string, User>
      host: { uuid: string; name: string; userType: string }
    }) => {
      room.value = data
    },
  )

  socket.value.on('room-closed', () => {
    clearSessionCookie()
    router.push('/')
  })
}

function submitName() {
  if (!userName.value.trim()) return
  showNameModal.value = false
  // Store the name in localStorage
  // Initialize socket connection after name is submitted
  initializeSocket()
}

onMounted(() => {
  // If user is redirected here after creating a room, HomeView will emit 'create-room' and redirect
  // So, we need to check if the user is the first one (host) or joining
  if (!userName.value) {
    showNameModal.value = true
  } else {
    // If we already have a name, initialize socket
    initializeSocket()
  }
})

onUnmounted(() => {
  if (socket.value) {
    socket.value.off('room-check')
    socket.value.off('host-assigned')
    socket.value.off('room-closed')
    socket.value.disconnect()
  }
})

const leaveRoom = () => {
  if (!socket.value) return
  socket.value.emit('leave-room', roomId.value)
  clearSessionCookie()
  router.push('/')
}

const clearCookies = () => {
  clearSessionCookie()
  localStorage.removeItem('userName')
  router.push('/')
}

const isDev = true // For development purposes

// Add copyRoomLink function
const copyRoomLink = async () => {
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
    alert('Room link copied to clipboard!')
  } catch {
    alert('Failed to copy link')
  }
}

const closeModal = () => {
  router.push('/')
}
</script>

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
  margin-bottom: 2rem;
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.task-view {
  cursor: pointer;
  padding: 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.task-view:hover {
  background-color: #f5f5f5;
}

.task-edit {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-edit input,
.task-edit textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.task-edit textarea {
  min-height: 100px;
  resize: vertical;
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

.share-btn {
  background-color: #007bff;
  color: white;
  margin-left: 0.5rem;
}
.share-btn:hover {
  background-color: #0056b3;
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
