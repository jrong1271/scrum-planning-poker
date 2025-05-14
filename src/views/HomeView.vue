<template>
  <div class="home">
    <h1>Planning Poker</h1>
    <div class="actions">
      <div class="create-room">
        <button @click="createRoom" :disabled="isSubmitting">Create New Room</button>
      </div>
      <div class="join-room">
        <input v-model="roomId" type="text" placeholder="Enter Room ID" :disabled="isSubmitting" />
        <button @click="joinRoom" :disabled="isSubmitting">Join Room</button>
      </div>
    </div>

    <!-- Name Modal -->
    <div v-if="showNameModal" class="modal">
      <div class="modal-content">
        <h2>Enter Your Name</h2>
        <input v-model="userName" type="text" placeholder="Your name" @keyup.enter="submitName" />
        <button @click="submitName">Continue</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const roomId = ref('')
const userName = ref('')
const showNameModal = ref(false)
const isCreatingRoom = ref(false)
const isSubmitting = ref(false)

onMounted(() => {
  // Load saved name from localStorage
  const savedName = localStorage.getItem('userName')
  if (savedName) {
    userName.value = savedName
  }
})

const createRoom = () => {
  isCreatingRoom.value = true
  showNameModal.value = true
}

const joinRoom = () => {
  isCreatingRoom.value = false
  showNameModal.value = true
}

const submitName = () => {
  if (!userName.value.trim()) return
  showNameModal.value = false
  localStorage.setItem('userName', userName.value)

  if (isCreatingRoom.value) {
    router.push('/room/new')
  } else {
    router.push(`/room/${roomId.value}`)
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
