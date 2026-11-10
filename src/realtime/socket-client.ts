import { io } from 'socket.io-client'

export function createRealtimeSocket() {
  return io({
    path: '/socket.io/',
    transports: ['websocket'],
    autoConnect: false,
  })
}
