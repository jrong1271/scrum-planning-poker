export interface UserSession {
  roomId: string
  userName: string
  timestamp: number
}

const COOKIE_NAME = 'poker_session'
const SESSION_DURATION = 4 * 60 * 60 * 1000 // 4 hours in milliseconds

export function setSessionCookie(session: UserSession): void {
  const expires = new Date(Date.now() + SESSION_DURATION).toUTCString()
  document.cookie = `${COOKIE_NAME}=${JSON.stringify(session)}; expires=${expires}; path=/`
}

export function getSessionCookie(): UserSession | null {
  const cookies = document.cookie.split(';')
  const sessionCookie = cookies.find((cookie) => cookie.trim().startsWith(`${COOKIE_NAME}=`))

  if (!sessionCookie) return null

  try {
    const session: UserSession = JSON.parse(sessionCookie.split('=')[1])
    // Check if session is expired
    if (Date.now() - session.timestamp > SESSION_DURATION) {
      clearSessionCookie()
      return null
    }
    return session
  } catch {
    return null
  }
}

export function clearSessionCookie(): void {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}
