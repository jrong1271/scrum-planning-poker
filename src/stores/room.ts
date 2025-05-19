import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Socket } from 'socket.io-client'

export type Participant = {
  sessionId: string
  userName: string
  userType?: string
  selectedCard?: number | null
  score?: number | null
}

export type Room = {
  roomId: string
  participants: Record<string, Participant>
}

export const useRoomStore = defineStore('room', () => {
  const room = ref<Room | null>(null)
  const socket = ref<Socket | null>(null)
  const connectionStatus = ref('disconnected')
  const revealed = ref(false)
  const participants = computed(() => {
    if (!room.value) return {}
    return room.value.participants
  })

  function setSocket(newSocket: Socket) {
    socket.value = newSocket
  }

  function setRoomData(data: Room) {
    room.value = data
  }

  function setConnectionStatus(status: string) {
    connectionStatus.value = status
  }

  function setRevealed(value: boolean) {
    revealed.value = value
  }

  function selectCard(card: number | string) {
    if (!socket.value) return
    socket.value.emit('select-card', {
      roomId: room.value?.roomId,
      card,
    })
  }

  function leaveRoom() {
    if (!socket.value) return
    socket.value.emit('leave-room', {
      roomId: room.value?.roomId,
    })
  }

  function restartGame() {
    if (!socket.value || !room.value) return
    socket.value.emit('restart-game', {
      roomId: room.value.roomId,
    })
  }

  return {
    room,
    socket,
    connectionStatus,
    revealed,
    participants,
    setSocket,
    setRoomData,
    setConnectionStatus,
    setRevealed,
    selectCard,
    leaveRoom,
    restartGame,
  }
})
