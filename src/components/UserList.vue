<script setup lang="ts">
import type { User } from '../stores/room'

interface Props {
  participants: Record<string, User>
}

defineProps<Props>()
</script>

<template>
  <div class="user-list">
    <h3>Participants</h3>
    <div v-for="user in Object.values(participants)" :key="user.userId" class="user-item">
      <span>{{ user.userName }}</span>
      <span v-if="user.userType === 'host'" class="host-badge">Host</span>
      <span v-if="user.score" class="card-badge">{{ user.score }}</span>
    </div>
  </div>
</template>

<style scoped>
.user-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
}

.host-badge {
  background: #42b883;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.card-badge {
  background: #2c3e50;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}
</style>
