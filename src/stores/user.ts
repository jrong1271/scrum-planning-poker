import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface UserState {
  userId: string
  userName: string
  roomId: string
  action: 'new' | 'join'
}

export const useUserStore = defineStore('user', () => {
  const userId = ref(localStorage.getItem('userId') || '')
  const userName = ref(localStorage.getItem('userName') || '')
  const roomId = ref(localStorage.getItem('roomId') || '')
  const action = ref<'new' | 'join'>((localStorage.getItem('action') as 'new' | 'join') || 'join')

  function setUserState(state: Partial<UserState>) {
    if (state.userId) {
      userId.value = state.userId
      localStorage.setItem('userId', state.userId)
    }
    if (state.userName) {
      userName.value = state.userName
      localStorage.setItem('userName', state.userName)
    }
    if (state.roomId) {
      roomId.value = state.roomId
      localStorage.setItem('roomId', state.roomId)
    }
    if (state.action) {
      action.value = state.action
      localStorage.setItem('action', state.action)
    }
  }

  function clearUserState() {
    userId.value = ''
    userName.value = ''
    roomId.value = ''
    action.value = 'join'
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('roomId')
    localStorage.removeItem('action')
  }

  return {
    userId,
    userName,
    roomId,
    action,
    setUserState,
    clearUserState,
  }
})
