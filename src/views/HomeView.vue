<template>
  <div class="home">
    <h1>Planning Poker</h1>
    <div class="actions">
      <div v-if="!route.query.roomId" class="welcome-prompt">
        <h2>Welcome to Planning Poker!</h2>
        <p>Would you like to:</p>
        <div class="action-buttons">
          <button
            :class="{ 'button-pressed': actionType === 'new' }"
            @click="showNamePrompt('new')"
          >
            Create New Room
          </button>
          <button
            :class="{ 'button-pressed': actionType === 'join' }"
            @click="showNamePrompt('join')"
          >
            Join Existing Room
          </button>
        </div>
      </div>

      <div v-if="showNameInput && actionType" class="name-prompt">
        <h3>{{ actionType === 'new' ? 'Create New Room' : 'Join Room' }}</h3>
        <div class="input-group">
          <input v-model="userName" type="text" placeholder="Enter your name" />
          <div v-if="actionType === 'join'" class="room-input">
            <input v-model="inputRoomId" type="text" placeholder="Enter Room ID" />
          </div>
          <button
            @click="enterRoom"
            :disabled="!userName || (actionType === 'join' && !inputRoomId)"
          >
            {{ actionType === 'new' ? 'Create Room' : 'Join Room' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'

const router = useRouter()
const route = useRoute()
const roomId = ref(localStorage.getItem('roomId') || uuidv4())
const inputRoomId = ref('')
const userName = ref(localStorage.getItem('userName') || '')
const showNameInput = ref(false)
const actionType = ref('')

const showNamePrompt = (type: string) => {
  actionType.value = type
  showNameInput.value = true
}

const enterRoom = () => {
  if (actionType.value === 'new') {
    roomId.value = uuidv4()
  } else {
    roomId.value = inputRoomId.value
  }

  router.push({
    path: `/room/${roomId.value}`,
    query: {
      action: actionType.value === 'new' ? 'new' : 'old',
      userName: userName.value,
    },
  })
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
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  min-width: 150px;
  transition: all 0.2s ease;
}

button.button-pressed {
  background-color: #388e3c;
  transform: translateY(2px);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
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

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 300px;
}

.modal-content input {
  width: 100%;
}
</style>
