import { defineStore } from 'pinia'
import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'

export type UserState = {
  sessionId: string | null
  userName: string | null
  roomId: string | null
  userType: string | null
}

// use to persist user data
export const useUserStore = defineStore('user', () => {
  const currentUser = ref<UserState>({
    sessionId: null,
    userName: null,
    roomId: null,
    userType: null,
  })

  function setUserState(state: Partial<UserState>) {
    currentUser.value = {
      ...currentUser.value,
      ...state,
    }
    if (!currentUser.value.sessionId) {
      currentUser.value.sessionId = uuidv4()
    }

    if (!currentUser.value.roomId) {
      currentUser.value.roomId = uuidv4()
    }
    localStorage.setItem('session', JSON.stringify(currentUser.value))
  }

  function clearUserState() {
    currentUser.value = {
      sessionId: null,
      userName: null,
      roomId: null,
      userType: null,
    }
    localStorage.removeItem('session')
  }

  return {
    currentUser,
    setUserState,
    clearUserState,
  }
})
