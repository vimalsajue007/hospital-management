import { useEffect, useRef, useCallback } from 'react'
 
export function useWebSocket(userId, onMessage) {
  const ws = useRef(null)
  const reconnectTimer = useRef(null)
 
  const connect = useCallback(() => {
    if (!userId) return
    try {
      ws.current = new WebSocket(`ws://localhost:8000/api/appointments/ws/${userId}`)
      ws.current.onopen = () => console.log('[WS] Connected')
      ws.current.onmessage = (e) => {
        try { onMessage(JSON.parse(e.data)) } catch {}
      }
      ws.current.onclose = () => {
        reconnectTimer.current = setTimeout(connect, 3000)
      }
      ws.current.onerror = () => ws.current.close()
    } catch {}
  }, [userId, onMessage])
 
  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [connect])
 
  return ws
}