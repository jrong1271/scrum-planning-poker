<script setup lang="ts">
import GamePanel from '@/components/GamePanel.vue'
import UserList from '@/components/UserList.vue'

import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { io } from 'socket.io-client'

import { useRoomStore } from '../stores/room'
import { useUserStore } from '../stores/user'
import type { Room } from '../stores/room'

const store = useRoomStore()
const userStore = useUserStore()
const isHost = computed(() => store.currentUser.userType === 'host')
const route = useRoute()
const router = useRouter()

const initializeSocket = (roomId: string) => {
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
      if (userStore.action === 'new') {
        console.log('Creating new room')
        socket.emit('create-room', {
          userName: userStore.userName,
          userId: userStore.userId,
        })
      } else if (userStore.action === 'join') {
        console.log('Joining existing room')
        socket.emit('join-room', {
          roomId,
          userName: userStore.userName,
          userId: userStore.userId,
        })
      }
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

onMounted(() => {
  // Check if we have required user data
  if (!userStore.userName) {
    // Extract roomId from URL if present
    const roomId = route.params.id
    if (roomId && roomId !== 'new' && roomId !== 'join') {
      userStore.setUserState({
        roomId: roomId as string,
        action: 'join', // Set action to join when refreshing
      })
    }
    router.push('/')
    return
  }

  // Initialize socket with roomId
  const roomId = route.params.id
  if (roomId && roomId !== 'new' && roomId !== 'join') {
    console.log('Initializing socket with route roomId:', roomId)
    initializeSocket(roomId as string)
  } else if (userStore.roomId) {
    console.log('Initializing socket with store roomId:', userStore.roomId)
    initializeSocket(userStore.roomId)
  }
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
            >Welcome, <strong>{{ userStore.userName }}</strong
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
