import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { instrument } from '@socket.io/admin-ui'
import { v4 as uuidv4 } from 'uuid'
import cors from 'cors'

const app = express()
app.use(cors())
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'https://admin.socket.io'],
    methods: ['GET', 'POST'],
  },
})

instrument(io, {
  auth: false,
  mode: 'development',
})

interface User {
  socketId: string // only for reconnection
  userId: string // only for retrieve user from rooms map
  userName: string
  userType: string
  selectedCard: number | null
}

interface Room {
  roomId: string
  participants: Record<string, User>
}

const rooms = new Map<string, Room>()

function emitRoomData(roomId: string) {
  const room = rooms.get(roomId)
  console.log('Emitting room data:', roomId)
  if (room) {
    console.log(room.participants)
    io.to(roomId).emit('room-data', room)
  }
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  // Handle reconnection
  const userId = socket.handshake.auth.userId
  const userName = socket.handshake.auth.userName
  const socketId = socket.id

  console.table(socket.handshake.auth)
  console.log('socketId:', socketId)

  socket.on('create-room', ({ userName, userId }: { userName: string; userId: string }) => {
    console.log('Creating new room for:', userName)
    const roomId = uuidv4()
    socket.join(roomId)

    const participants: Record<string, User> = {}
    participants[userId] = {
      socketId: socket.id,
      userId,
      userName,
      userType: 'host',
      selectedCard: null,
    }
    rooms.set(roomId, {
      roomId,
      participants,
    } as Room)
    emitRoomData(roomId)
  })

  socket.on('join-room', ({ roomId }: { roomId: string }) => {
    console.log('Attempting to join room:', roomId)
    const room = rooms.get(roomId)
    if (room) {
      console.log('Room found, joining...')
      socket.join(roomId)
      // If user is not in the room, add them as a participant
      if (!room.participants[userId]) {
        console.log('Adding new participant:', userId)
        // Check if this is the only user in the room
        const isOnlyUser = Object.keys(room.participants).length === 0
        const userType = isOnlyUser ? 'host' : 'participant'
        console.log('User type:', userType, 'Is only user:', isOnlyUser)

        room.participants[userId] = {
          socketId: socket.id,
          userId,
          userName,
          userType,
          selectedCard: null,
        }
      } else {
        // Update socket ID for existing user
        const user = room.participants[userId]
        if (user) {
          console.log('Updating existing user socket ID:', userId)
          user.socketId = socket.id
        }
      }
      emitRoomData(roomId)
    } else {
      console.log('Room not found:', roomId)
      socket.emit('error', { message: 'Room not found' })
    }
  })

  socket.on('leave-room', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId)
    if (room) {
      delete room.participants[userId]
      socket.leave(roomId)
      emitRoomData(roomId)
    }
  })

  socket.on(
    'select-card',
    ({ roomId, userId, card }: { roomId: string; userId: string; card: number }) => {
      const room = rooms.get(roomId)
      if (room && card) {
        const user = room.participants[userId]
        if (user) {
          user.selectedCard = card
        }
        emitRoomData(roomId)
      }
    },
  )

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
