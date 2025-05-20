<script setup lang="ts">
import { ref, onUnmounted, watch, nextTick } from 'vue'
import { useRoomStore } from '../stores/room'
import { useUserStore } from '../stores/user'

defineOptions({
  name: 'RoomChat',
})

interface Message {
  type?: 'system' | 'user'
  userId?: string
  userName: string
  content: string
  timestamp: string
}

const roomStore = useRoomStore()
const userStore = useUserStore()

const messages = ref<Message[]>([])
const newMessage = ref('')
const chatContainer = ref<HTMLElement | null>(null)
const isSending = ref(false)

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}

const sendMessage = () => {
  if (!newMessage.value.trim() || !roomStore.socket || !roomStore.room) return

  isSending.value = true
  roomStore.socket.emit('chat-message', {
    roomId: roomStore.room.roomId,
    userName: userStore.currentUser.userName,
    message: newMessage.value.trim(),
  })
  newMessage.value = ''
  isSending.value = false
}

const scrollToBottom = () => {
  if (chatContainer.value) {
    nextTick(() => {
      chatContainer.value!.scrollTop = chatContainer.value!.scrollHeight
    })
  }
}

// Watch for socket availability and set up message listener
watch(
  () => roomStore.socket,
  (socket) => {
    if (socket) {
      socket.on('chat-message', (message: Message) => {
        messages.value.push({
          ...message,
          userId: message.userId || userStore.currentUser?.sessionId || undefined,
        })
        scrollToBottom()
      })

      socket.on('user-left', ({ userName }: { userName: string }) => {
        messages.value.push({
          type: 'system',
          userName: 'System',
          content: `${userName} left the room`,
          timestamp: new Date().toISOString(),
        })
        scrollToBottom()
      })

      socket.on('user-joined', ({ userName }: { userName: string }) => {
        messages.value.push({
          type: 'system',
          userName: 'System',
          content: `${userName} joined the room`,
          timestamp: new Date().toISOString(),
        })
        scrollToBottom()
      })
    }
  },
  { immediate: true },
)

// Watch messages array for changes to ensure scrolling
watch(
  messages,
  () => {
    scrollToBottom()
  },
  { deep: true },
)

onUnmounted(() => {
  if (roomStore.socket) {
    roomStore.socket.off('chat-message')
    roomStore.socket.off('user-left')
    roomStore.socket.off('user-joined')
  }
})
</script>

<template>
  <div class="room-chat">
    <div class="chat-header">
      <h3>Chat</h3>
    </div>
    <div class="chat-messages" ref="chatContainer">
      <div v-if="messages.length === 0" class="no-messages">
        No messages yet. Start the conversation!
      </div>
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="message"
        :class="{
          'message-own': message.userId === userStore.currentUser?.sessionId,
          'message-system': message.type === 'system',
        }"
      >
        <div class="message-header">
          <span class="message-sender">{{ message.userName }}</span>
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
        </div>
        <div class="message-content">{{ message.content }}</div>
      </div>
    </div>
    <div class="chat-input">
      <v-text-field
        v-model="newMessage"
        placeholder="Type a message..."
        variant="outlined"
        density="comfortable"
        hide-details
        @keyup.enter="sendMessage"
        :disabled="isSending"
      >
        <template v-slot:append>
          <v-btn
            icon="mdi-send"
            variant="text"
            @click="sendMessage"
            :disabled="!newMessage.trim() || isSending"
            :loading="isSending"
          />
        </template>
      </v-text-field>
    </div>
  </div>
</template>

<style scoped>
.room-chat {
  display: flex;
  flex-direction: column;
  height: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chat-header {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #eee;
}

.chat-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.no-messages {
  text-align: center;
  color: #666;
  padding: 1rem;
  font-style: italic;
  font-size: 0.875rem;
}

.message {
  background: #f5f5f5;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  max-width: 85%;
  animation: messageAppear 0.3s ease-out;
  align-self: flex-start;
}

.message-own {
  background: #e3f2fd;
}

.message-system {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  color: #6c757d;
  font-style: italic;
  text-align: center;
  padding: 0.5rem;
  margin: 0.5rem 0;
  max-width: 100%;
}

.message-system .message-header {
  display: none;
}

@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.125rem;
  font-size: 0.75rem;
}

.message-sender {
  font-weight: 600;
  color: #2c3e50;
}

.message-time {
  color: #666;
  font-size: 0.7rem;
}

.message-content {
  color: #2c3e50;
  word-break: break-word;
  font-size: 0.875rem;
  line-height: 1.3;
}

.chat-input {
  padding: 0.5rem;
  border-top: 1px solid #eee;
}
</style>
