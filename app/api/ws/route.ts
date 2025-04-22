import { WebSocketServer } from "ws"
import { NextResponse, type NextRequest } from "next/server"

// Store for active connections
const clients = new Set()

// Initialize WebSocket server (only once)
let wss: WebSocketServer | null = null

if (!wss && typeof process !== "undefined") {
  // This will only run on the server
  wss = new WebSocketServer({ noServer: true })

  // Handle WebSocket connections
  wss.on("connection", (ws) => {
    // Add client to the set
    clients.add(ws)
    console.log("Client connected, total clients:", clients.size)

    // Handle messages from clients
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString())
        console.log("Received data:", data)

        // Broadcast to all connected clients
        clients.forEach((client) => {
          if (client.readyState === 1) {
            // OPEN
            client.send(JSON.stringify(data))
          }
        })
      } catch (error) {
        console.error("Error processing message:", error)
      }
    })

    // Handle client disconnection
    ws.on("close", () => {
      clients.delete(ws)
      console.log("Client disconnected, remaining clients:", clients.size)
    })
  })
}

export async function GET(request: NextRequest) {
  // This is needed to handle the WebSocket upgrade
  const { socket: res } = request as any

  if (!res) {
    return new NextResponse("WebSocket server error", { status: 500 })
  }

  // Handle WebSocket upgrade
  const upgradeHeader = request.headers.get("upgrade")
  if (upgradeHeader !== "websocket") {
    return new NextResponse("Expected websocket", { status: 400 })
  }

  try {
    // Get WebSocket server instance
    if (!wss) {
      return new NextResponse("WebSocket server not initialized", { status: 500 })
    }

    // Create a custom response to handle the WebSocket connection
    res.socket.server.ws = true

    // Handle the upgrade manually
    const headers = Object.fromEntries(request.headers.entries())
    const socket = res.socket as any

    // This is a workaround for the WebSocket upgrade in Next.js
    wss.handleUpgrade({ headers, method: "GET" } as any, socket, Buffer.from([]), (ws) => {
      wss?.emit("connection", ws, request)
    })

    // Return empty response to let Next.js know we've handled it
    return new Response(null, { status: 101 })
  } catch (error) {
    console.error("WebSocket upgrade error:", error)
    return new NextResponse("WebSocket upgrade error", { status: 500 })
  }
}
