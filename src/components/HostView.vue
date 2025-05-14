<template>
  <div class="host-view">
    <div class="task-display">
      <div v-if="isEditingTask" class="task-edit">
        <input
          v-model="task.title"
          placeholder="Task Title"
          @keyup.enter="updateTask"
          ref="taskInput"
        />
        <textarea
          v-model="task.description"
          placeholder="Task Description"
          @keyup.enter="updateTask"
        ></textarea>
        <button @click="updateTask" :disabled="!task.title">Update Task</button>
      </div>
      <div v-else class="task-view" @click="startEditingTask">
        <h2>{{ task.title || 'Click to add task...' }}</h2>
        <p>{{ task.description || 'No description available' }}</p>
      </div>
    </div>

    <div class="host-participant-list">
      <h3>Participants</h3>
      <div v-for="(user, id) in participants" :key="id" class="participant-score">
        <span>{{ user.name }}</span>
        <span v-if="revealed">{{ scores[id] !== undefined ? scores[id] : '-' }}</span>
        <span v-else>?</span>
      </div>
    </div>

    <div v-if="revealed" class="results">
      <h3>Results</h3>
      <div class="results-grid">
        <div v-for="(score, userId) in scores" :key="userId" class="result-item">
          <span>{{ users[userId]?.name || 'User' }}:</span>
          <span>{{ score }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Socket } from 'socket.io-client'

interface Props {
  socket: Socket
  roomId: string
  currentTask: { title: string; description: string }
  users: Record<string, { name: string; userType: string }>
  scores: Record<string, number | string>
  revealed: boolean
}

const props = defineProps<Props>()

const task = ref({ ...props.currentTask })
const isEditingTask = ref(false)
const taskInput = ref<HTMLInputElement | null>(null)

const participants = computed(() => {
  const result: Record<string, { name: string; userType: string }> = {}
  for (const [id, user] of Object.entries(props.users)) {
    if (user.userType !== 'host') {
      result[id] = user
    }
  }
  return result
})

const startEditingTask = () => {
  isEditingTask.value = true
  nextTick(() => {
    taskInput.value?.focus()
  })
}

const updateTask = () => {
  if (!props.socket || !task.value.title) return
  props.socket.emit('update-task', {
    roomId: props.roomId,
    task: task.value,
  })
  isEditingTask.value = false
}
</script>

<script lang="ts">
export default {
  name: 'HostView',
}
</script>

<style scoped>
.host-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-display {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.host-participant-list {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.participant-score {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
}

.results {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
}
</style>
