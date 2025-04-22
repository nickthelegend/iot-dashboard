"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { Thermometer, Droplets } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function Dashboard() {
  const [data, setData] = useState<{ temperature: number; humidity: number; timestamp: string }[]>([])
  const [currentTemp, setCurrentTemp] = useState<number>(0)
  const [currentHumidity, setCurrentHumidity] = useState<number>(0)
  const [connected, setConnected] = useState<boolean>(false)
  const [lastUpdate, setLastUpdate] = useState<string>("")

  useEffect(() => {
    // Create WebSocket connection
    // Automatically use secure WebSocket (wss://) if the page is loaded over HTTPS
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const socket = new WebSocket(`${protocol}//${window.location.host}/api/ws`)

    // Connection opened
    socket.addEventListener("open", () => {
      console.log("Connected to WebSocket server")
      setConnected(true)
    })

    // Listen for messages
    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.temperature !== undefined && message.humidity !== undefined) {
          // Update current values
          setCurrentTemp(message.temperature)
          setCurrentHumidity(message.humidity)

          // Add to chart data with timestamp
          const timestamp = new Date().toLocaleTimeString()
          setData((prevData) => {
            // Keep only the last 20 data points for the chart
            const newData = [...prevData, { temperature: message.temperature, humidity: message.humidity, timestamp }]
            if (newData.length > 20) {
              return newData.slice(newData.length - 20)
            }
            return newData
          })

          setLastUpdate(new Date().toLocaleString())
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
      }
    })

    // Connection closed
    socket.addEventListener("close", () => {
      console.log("Disconnected from WebSocket server")
      setConnected(false)
    })

    // Clean up on unmount
    return () => {
      socket.close()
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between py-4">
          <h1 className="text-2xl font-bold">IoT Dashboard</h1>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className="text-sm text-muted-foreground">{connected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temperature</CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentTemp.toFixed(1)}°C</div>
              <p className="text-xs text-muted-foreground">Last updated: {lastUpdate}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Humidity</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentHumidity.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Last updated: {lastUpdate}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Sensor Data History</CardTitle>
            <CardDescription>Temperature and humidity over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={{
                temperature: {
                  label: "Temperature (°C)",
                  color: "hsl(var(--chart-1))",
                },
                humidity: {
                  label: "Humidity (%)",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="temperature" stroke="var(--color-temperature)" strokeWidth={2} />
                  <Line type="monotone" dataKey="humidity" stroke="var(--color-humidity)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
