import { http, HttpResponse, ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'

const realtime = ws.link('*')

export const handlers = [
  http.get('/api/health', () =>
    HttpResponse.json({ status: 'ok', service: 'mock-api' }),
  ),
  realtime.addEventListener('connection', (connection) => {
    const socket = toSocketIo(connection)

    socket.client.on('foundation.ping', () => {
      socket.client.emit('foundation.pong', {
        eventId: 'foundation-pong-v1',
        resourceId: 'foundation',
        version: 1,
        message: 'event received',
      })
    })
  }),
]
