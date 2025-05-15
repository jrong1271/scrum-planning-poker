<script setup lang="ts">
import type { User } from '../stores/room'

interface Props {
  participants?: Record<string, User>
  host?: User
}

const props = defineProps<Props>()

console.log(props.participants)
</script>

<template>
  <div>
    <h4>Users:</h4>
    <ul>
      <li v-for="user in participants" :key="user.userId">
        {{ user.userName }} {{ user.userType === 'host' ? '(Host)' : '' }}
      </li>
    </ul>
  </div>
</template>
