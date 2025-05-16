import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { instrument } from '@socket.io/admin-ui'
import { v4 as uuidv4 } from 'uuid'
import cors from 'cors'
import helmet from 'helmet'

const app = express()
app.use(cors())
app.use(helmet())
app.disable('x-powered-by')
const httpServer = createServer(app)
const io = new Server(httpServer, {
  path: '/api/socket.io',
  cors: {
    origin: ['https://smeeta.com', 'http://localhost:5173', 'https://admin.socket.io'],
    methods: ['GET', 'POST'],
  },
})

instrument(io, {
  auth: false,
  mode: 'development',
})

interface User {
  socketId: string
  userId: string
  userName: string
  userType: 'host' | 'participant'
  selectedCard: number | null
}

interface Room {
  roomId: string
  participants: Record<string, User>
}

const rooms = new Map<string, Room>()

function sanitizeUserName(name: string): string {
  return String(name)
    .replace(/[^\w\s\-]/g, '')
    .slice(0, 32)
}

function emitRoomData(roomId: string) {
  const room = rooms.get(roomId)
  if (room) {
    io.to(roomId).emit('room-data', room)
  }
}

io.on('connection', (socket) => {
  const { userId } = socket.handshake.auth

  socket.on('create-room', ({ userName, userId }: { userName: string; userId: string }) => {
    try {
      if (!userName || !userId) {
        socket.emit('error', { message: 'Missing required fields' })
        return
      }
      const safeName = sanitizeUserName(userName)
      const roomId = uuidv4()
      socket.join(roomId)
      const participants: Record<string, User> = {
        [userId]: {
          socketId: socket.id,
          userId,
          userName: safeName,
          userType: 'host',
          selectedCard: null,
        },
      }
      rooms.set(roomId, { roomId, participants })
      socket.emit('room-created', roomId)
      emitRoomData(roomId)
    } catch {
      socket.emit('error', { message: 'Failed to create room' })
    }
  })

  socket.on(
    'join-room',
    ({ roomId, userName, userId }: { roomId: string; userName: string; userId: string }) => {
      try {
        const room = rooms.get(roomId)
        if (!room) {
          socket.emit('error', { message: 'Room not found' })
          socket.disconnect()
          return
        }
        const safeName = sanitizeUserName(userName)
        socket.join(roomId)
        if (!room.participants[userId]) {
          const isOnlyUser = Object.keys(room.participants).length === 0
          room.participants[userId] = {
            socketId: socket.id,
            userId,
            userName: safeName,
            userType: isOnlyUser ? 'host' : 'participant',
            selectedCard: null,
          }
        } else {
          room.participants[userId].socketId = socket.id
          room.participants[userId].userName = safeName
        }
        emitRoomData(roomId)
      } catch {
        socket.emit('error', { message: 'Failed to join room' })
      }
    },
  )

  socket.on('leave-room', ({ roomId }: { roomId: string }) => {
    try {
      const room = rooms.get(roomId)
      if (room) {
        delete room.participants[userId]
        socket.leave(roomId)
        emitRoomData(roomId)
      }
    } catch {
      socket.emit('error', { message: 'Failed to leave room' })
    }
  })

  socket.on('restart-game', ({ roomId }: { roomId: string }) => {
    try {
      const room = rooms.get(roomId)
      if (room) {
        Object.values(room.participants).forEach((participant) => {
          participant.selectedCard = null
        })
        emitRoomData(roomId)
      }
    } catch {
      socket.emit('error', { message: 'Failed to restart game' })
    }
  })

  socket.on(
    'select-card',
    ({ roomId, userId, card }: { roomId: string; userId: string; card: number }) => {
      try {
        const room = rooms.get(roomId)
        if (room?.participants[userId]) {
          room.participants[userId].selectedCard = card
          io.to(roomId).emit('score-change', { userId, score: card })
          emitRoomData(roomId)
        }
      } catch {
        socket.emit('error', { message: 'Failed to select card' })
      }
    },
  )

  socket.on('disconnect', () => {
    // Handle disconnection if needed
  })
})

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
