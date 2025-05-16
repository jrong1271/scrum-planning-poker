import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface UserState {
  userId: string
  userName: string
  action: 'new' | 'join' | ''
  roomId: string
}

export const useUserStore = defineStore('user', () => {
  const userId = ref(localStorage.getItem('userId') || '')
  const userName = ref(localStorage.getItem('userName') || '')
  const action = ref<'new' | 'join' | ''>('')
  const roomId = ref('')

  function setUserState(state: Partial<UserState>) {
    if (state.userId) {
      userId.value = state.userId
      localStorage.setItem('userId', state.userId)
    }
    if (state.userName) {
      userName.value = state.userName
      localStorage.setItem('userName', state.userName)
    }
    if (state.action) {
      action.value = state.action
    }
    if (state.roomId) {
      roomId.value = state.roomId
    }
  }

  function clearUserState() {
    userId.value = ''
    userName.value = ''
    action.value = ''
    roomId.value = ''
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
  }

  return {
    userId,
    userName,
    action,
    roomId,
    setUserState,
    clearUserState,
  }
})
