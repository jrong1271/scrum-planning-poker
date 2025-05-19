import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { instrument } from '@socket.io/admin-ui'
import cors from 'cors'
import helmet from 'helmet'

const app = express()
app.use(cors())
app.use(helmet())
app.disable('x-powered-by')
const httpServer = createServer(app)
const io = new Server(httpServer, {
  path: '/socket',
  cors: {
    origin: ['https://smeeta.com', 'http://localhost:5173', 'https://admin.socket.io'],
    methods: ['GET', 'POST'],
  },
})

instrument(io, {
  auth: false,
  mode: 'development',
})
type Participant = {
  sessionId: string
  userName: string
  socketId?: string
  userType?: 'host' | 'participant'
  selectedCard?: number | null
}
type UserState = {
  sessionId: string
  userName: string
  roomId: string
}
type Room = {
  roomId: string
  participants: Record<string, Participant>
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
  socket.on('join-room', ({ roomId, userName, sessionId }: UserState) => {
    try {
      socket.join(roomId)

      const safeName = sanitizeUserName(userName)
      let room = null
      if (rooms.has(roomId)) {
        room = rooms.get(roomId)
        if (room) {
          // detect re-connecting users
          if (room.participants[sessionId]) {
            room.participants[sessionId].socketId = socket.id
            emitRoomData(roomId)
            return
          } else {
            // new user joining a room with participants
            room.participants[sessionId] = {
              sessionId,
              userName: safeName,
              socketId: socket.id,
              userType: Object.keys(room.participants).length > 0 ? 'participant' : 'host',
              selectedCard: null,
            } as Participant
          }
        }
      } else {
        // create a new room
        rooms.set(roomId, {
          roomId,
          participants: {
            [sessionId]: {
              sessionId,
              userName: safeName,
              socketId: socket.id,
              userType: 'host',
              selectedCard: null,
            },
          },
        })
      }

      emitRoomData(roomId)
    } catch {
      socket.emit('error', { message: 'Failed to join room' })
    }
  })

  socket.on('leave-room', ({ roomId }: { roomId: string }) => {
    try {
      const room = rooms.get(roomId)
      if (room) {
        Object.values(room.participants).map((participant) => {
          if (participant.socketId === socket.id) {
            delete room.participants[participant.sessionId]
          }
        })
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

  socket.on('select-card', ({ roomId, sessionId, card }) => {
    try {
      const room = rooms.get(roomId)
      if (room?.participants[sessionId]) {
        room.participants[sessionId].selectedCard = card
        io.to(roomId).emit('score-change', { sessionId, score: card })
        //emitRoomData(roomId)
      }
    } catch {
      socket.emit('error', { message: 'Failed to select card' })
    }
  })

  socket.on('disconnect', () => {
    // Handle disconnection if needed
  })
})

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
