<template>
  <div class="home">
    <h1>Planning Poker</h1>
    <div class="actions">
      <div class="create-room">
        <input v-model="userName" type="text" placeholder="Your name" />
        <button @click="enterRoom('new')" :disabled="userName.length === 0">Create New Room</button>
      </div>
      <div class="join-room">
        <input v-model="inputRoomId" type="text" placeholder="Room ID" />
        <button @click="enterRoom('old')" :disabled="roomId.length === 0">Join Room</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'
const router = useRouter()
const roomId = ref(localStorage.getItem('roomId') || uuidv4())
const inputRoomId = ref('')
const userName = ref(localStorage.getItem('userName') || '')
const enterRoom = (type: 'new' | 'old') => {
  if (type === 'new') {
    roomId.value = uuidv4()
  } else {
    roomId.value = inputRoomId.value
  }

  router.push({
    path: `/room/${roomId.value}`,
    query: {
      action: type,
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

.create-room,
.join-room {
  display: flex;
  gap: 1rem;
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
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
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
