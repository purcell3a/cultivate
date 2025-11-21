"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Plant } from "./mock-data"

interface GardenPreferences {
  zone: string
  address: string
  edibleOnly: boolean
  seasons: string[]
  nativeOnly: boolean
}

interface GardenPlant extends Plant {
  addedAt: string
}

interface GardenLayout {
  width: number
  length: number
  photoUrl?: string
  shapeType: "rectangle" | "custom" | "l-shape" | "curved"
  customPoints?: { x: number; y: number }[]
  area?: number
}

interface CareTask {
  id: string
  plantId: string
  plantName: string
  task: string
  frequency: string
  timeOfDay: string
  nextDue: string
}

interface GardenContextType {
  preferences: GardenPreferences
  setPreferences: (prefs: Partial<GardenPreferences>) => void
  myGarden: GardenPlant[]
  addPlant: (plant: Plant) => void
  removePlant: (plantId: string) => void
  layout: GardenLayout
  setLayout: (layout: Partial<GardenLayout>) => void
  careTasks: CareTask[]
  addCareTask: (task: Omit<CareTask, "id" | "nextDue">) => void
  removeCareTask: (taskId: string) => void
}

const GardenContext = createContext<GardenContextType | undefined>(undefined)

export function GardenProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferencesState] = useState<GardenPreferences>({
    zone: "",
    address: "",
    edibleOnly: false,
    seasons: [],
    nativeOnly: false,
  })

  const [myGarden, setMyGarden] = useState<GardenPlant[]>([])
  const [layout, setLayoutState] = useState<GardenLayout>({
    width: 0,
    length: 0,
    shapeType: "rectangle",
    customPoints: [],
    area: 0,
  })
  const [careTasks, setCareTasks] = useState<CareTask[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem("gardenPreferences")
    const savedGarden = localStorage.getItem("myGarden")
    const savedLayout = localStorage.getItem("gardenLayout")
    const savedTasks = localStorage.getItem("careTasks")

    if (savedPrefs) setPreferencesState(JSON.parse(savedPrefs))
    if (savedGarden) setMyGarden(JSON.parse(savedGarden))
    if (savedLayout) setLayoutState(JSON.parse(savedLayout))
    if (savedTasks) setCareTasks(JSON.parse(savedTasks))
  }, [])

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("gardenPreferences", JSON.stringify(preferences))
  }, [preferences])

  useEffect(() => {
    localStorage.setItem("myGarden", JSON.stringify(myGarden))
  }, [myGarden])

  useEffect(() => {
    localStorage.setItem("gardenLayout", JSON.stringify(layout))
  }, [layout])

  useEffect(() => {
    localStorage.setItem("careTasks", JSON.stringify(careTasks))
  }, [careTasks])

  const setPreferences = (prefs: Partial<GardenPreferences>) => {
    setPreferencesState((prev) => ({ ...prev, ...prefs }))
  }

  const addPlant = (plant: Plant) => {
    const gardenPlant: GardenPlant = {
      ...plant,
      addedAt: new Date().toISOString(),
    }
    setMyGarden((prev) => [...prev, gardenPlant])
  }

  const removePlant = (plantId: string) => {
    setMyGarden((prev) => prev.filter((p) => p.id !== plantId))
    setCareTasks((prev) => prev.filter((t) => t.plantId !== plantId))
  }

  const setLayout = (newLayout: Partial<GardenLayout>) => {
    setLayoutState((prev) => ({ ...prev, ...newLayout }))
  }

  const addCareTask = (task: Omit<CareTask, "id" | "nextDue">) => {
    const newTask: CareTask = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      nextDue: calculateNextDue(task.frequency),
    }
    setCareTasks((prev) => [...prev, newTask])
  }

  const removeCareTask = (taskId: string) => {
    setCareTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  return (
    <GardenContext.Provider
      value={{
        preferences,
        setPreferences,
        myGarden,
        addPlant,
        removePlant,
        layout,
        setLayout,
        careTasks,
        addCareTask,
        removeCareTask,
      }}
    >
      {children}
    </GardenContext.Provider>
  )
}

export function useGarden() {
  const context = useContext(GardenContext)
  if (!context) {
    throw new Error("useGarden must be used within a GardenProvider")
  }
  return context
}

function calculateNextDue(frequency: string): string {
  const now = new Date()
  switch (frequency) {
    case "daily":
      now.setDate(now.getDate() + 1)
      break
    case "weekly":
      now.setDate(now.getDate() + 7)
      break
    case "bi-weekly":
      now.setDate(now.getDate() + 14)
      break
    case "monthly":
      now.setMonth(now.getMonth() + 1)
      break
  }
  return now.toISOString()
}
