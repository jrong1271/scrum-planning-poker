<template>
  <div class="join-container">
    <div class="join-form">
      <h1>Join Room</h1>
      <p class="subtitle">Enter the room ID to join</p>

      <div class="input-group">
        <input
          v-model="roomId"
          placeholder="Room ID"
          @keyup.enter="joinRoom"
          :disabled="isJoining"
        />
        <button @click="joinRoom" :disabled="!roomId.trim() || isJoining" class="join-btn">
          {{ isJoining ? 'Joining...' : 'Join Room' }}
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="!userName" class="name-input">
        <p class="subtitle">Enter your name to join</p>
        <input
          v-model="tempName"
          placeholder="Your name"
          @keyup.enter="setName"
          :disabled="isJoining"
        />
        <button @click="setName" :disabled="!tempName.trim() || isJoining" class="join-btn">
          Set Name
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { io } from 'socket.io-client'

const router = useRouter()
const socket = io('http://localhost:3000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
})

const roomId = ref('')
const isJoining = ref(false)
const error = ref('')
const userName = ref(localStorage.getItem('userName') || '')
const tempName = ref('')

const setName = () => {
  if (!tempName.value.trim()) return
  userName.value = tempName.value
  localStorage.setItem('userName', tempName.value)
}

const joinRoom = () => {
  if (!roomId.value.trim() || isJoining.value) return
  if (!userName.value.trim()) {
    error.value = 'Please enter your name first'
    return
  }

  isJoining.value = true
  error.value = ''

  socket.emit('check-room', roomId.value)

  socket.once('room-check', (exists: boolean) => {
    if (exists) {
      router.push(`/room/${roomId.value}`)
    } else {
      error.value = 'Room not found'
      isJoining.value = false
    }
  })
}
</script>

<style scoped>
.join-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.join-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 400px;
  text-align: center;
}

h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  margin-bottom: 2rem;
}

.input-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.join-btn {
  padding: 0.75rem 1.5rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.join-btn:hover:not(:disabled) {
  background: #3aa876;
}

.join-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.name-input {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.name-input .subtitle {
  margin-bottom: 1rem;
}

.name-input input {
  margin-bottom: 1rem;
}
</style>
