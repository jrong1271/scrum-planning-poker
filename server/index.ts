import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'
import cors from 'cors'

const app = express()
app.use(cors())
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

interface User {
  uuid: string
  name: string
  userType: string
}

interface Room {
  host: User
  participants: Record<string, User>
  task: {
    title: string
    description: string
  }
}

const rooms = new Map<string, Room>()

function emitRoomUsers(roomId: string) {
  try {
    const room = rooms.get(roomId)
    if (room) {
      io.to(roomId).emit('room-users', {
        participants: { ...room.participants },
        host: { ...room.host },
      })
    }
  } catch (error) {
    console.error('Error emitting room users:', error)
  }
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('create-room', ({ name, userType }: { name: string; userType: string }) => {
    console.log('Create room', name, userType)
    try {
      const roomId = uuidv4()
      rooms.set(roomId, {
        host: { uuid: socket.id, name, userType },
        participants: {},
        task: { title: '', description: '' },
      })
      socket.join(roomId)
      console.log('Room joined ', roomId)
      io.to(roomId).emit('room-created', roomId)
      io.to(roomId).emit('assign-host', { roomId, name, userType })
    } catch (error) {
      console.error('Error creating room:', error)
      socket.emit('error', 'Failed to create room')
    }
  })

  socket.on(
    'update-task',
    ({ roomId, task }: { roomId: string; task: { title: string; description: string } }) => {
      try {
        const room = rooms.get(roomId)
        if (room) {
          room.task = task
          // Broadcast complete room data to all users
          io.to(roomId).emit('room-data', rooms.get(roomId))
        }
      } catch (error) {
        console.error('Error updating task:', error)
        socket.emit('error', 'Failed to update task')
      }
    },
  )

  socket.on(
    'join-room',
    ({ roomId, name, userType }: { roomId: string; name: string; userType?: string }) => {
      try {
        const room = rooms.get(roomId)
        if (room) {
          socket.join(roomId)
          if (userType === 'host') {
            room.host = {
              uuid: room.host.uuid,
              name,
              userType: 'host',
            }
          } else {
            room.participants[socket.id] = {
              uuid: uuidv4(),
              name,
              userType: 'participant',
            }
          }
          io.to(roomId).emit('room-users', {
            participants: { ...room.participants },
            host: { ...room.host },
          })
        } else {
          socket.emit('error', 'Room not found')
        }
      } catch (error) {
        console.error('Error joining room:', error)
        socket.emit('error', 'Failed to join room')
      }
    },
  )

  socket.on('leave-room', ({ roomId }) => {
    const room = rooms.get(roomId)
    if (room) {
      const userType = room.participants[socket.id] ? 'participant' : 'host'
      socket.leave(roomId)
      if (userType === 'host') {
        rooms.delete(roomId)
      } else {
        delete room.participants[socket.id]
        emitRoomUsers(roomId)
      }
    } else {
      socket.emit('error', 'Room not found')
    }
  })
})

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
