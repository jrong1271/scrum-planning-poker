import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Socket } from 'socket.io-client'

export interface User {
  userId: string
  userName: string
  userType?: string
  selectedCard?: number | null
  score?: number | null
}

export interface Room {
  roomId: string
  participants: Record<string, User>
}

export const useRoomStore = defineStore('room', () => {
  const room = ref<Room | null>(null)
  const socket = ref<Socket | null>(null)
  const connectionStatus = ref('disconnected')
  const currentUser = ref<User>({
    userId: localStorage.getItem('userId') || '',
    userName: localStorage.getItem('userName') || '',
  })
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
    console.log(room.value)
  }

  function setCurrentUser(user: User) {
    currentUser.value = user
    localStorage.setItem('userId', user.userId)
    localStorage.setItem('userName', user.userName)
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
    currentUser,
    revealed,
    participants,
    setSocket,
    setRoomData,
    setCurrentUser,
    setConnectionStatus,
    setRevealed,
    selectCard,
    leaveRoom,
    restartGame,
  }
})
