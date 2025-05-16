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

const route = useRoute()
const router = useRouter()
const store = useRoomStore()
const userStore = useUserStore()
const isHost = computed(() => store.currentUser.userType === 'host')
const showNamePrompt = ref(false)
const inputUserName = ref('')
const roomId = ref<string | null>(null)
const copySuccess = ref(false)

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
  const roomLink = `${window.location.origin}/room/${store.room?.roomId}`
  try {
    await navigator.clipboard.writeText(roomLink)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy room link:', err)
  }
}

const selectCard = (card: number | null) => {
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
  const socket = io('//localhost:3000', {
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
        <v-text-field
          v-model="inputUserName"
          label="Enter your name"
          variant="outlined"
          density="comfortable"
          @keyup.enter="handleNameSubmit(inputUserName)"
        />
        <v-btn
          color="primary"
          @click="handleNameSubmit(inputUserName)"
          :disabled="!inputUserName"
          block
        >
          Join Room
        </v-btn>
      </div>
    </div>
    <template v-else>
      <v-alert v-if="store.connectionStatus === 'error'" type="error" variant="tonal" class="mb-4">
        Connection error. Please check if the server is running.
      </v-alert>
      <v-alert
        v-else-if="store.connectionStatus === 'disconnected'"
        type="warning"
        variant="tonal"
        class="mb-4"
      >
        Disconnected from server. Trying to reconnect...
      </v-alert>
      <div v-else class="room-layout">
        <div class="left-panel">
          <UserList :participants="store.participants" />
        </div>

        <div class="right-panel">
          <div class="user-info">
            <span>
              <v-icon start :icon="isHost ? 'mdi-account-star' : 'mdi-account'" class="mr-1" />
              <strong>{{ userStore.userName }}</strong>
            </span>

            <div class="room-actions">
              <v-btn
                color="primary"
                @click="copyRoomLink"
                :title="copySuccess ? 'Copied!' : 'Copy room link'"
                size="small"
              >
                <v-icon start icon="mdi-share-variant" />
                Share
              </v-btn>
              <v-btn color="error" @click="leaveRoom" title="Leave room" size="small">
                <v-icon start icon="mdi-exit-to-app" />
                Leave
              </v-btn>
            </div>
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
  flex-wrap: wrap;
}

.room-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}
</style>
