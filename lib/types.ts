export interface Plant {
  id: number
  trefle_id: number
  name: string
  scientific_name: string
  common_names?: string[]
  family?: string
  genus?: string
  plant_type?: string
  min_zone?: string
  max_zone?: string
  native_distributions?: number[]
  introduced_distributions?: number[]
  sun_requirement?: string[]
  water_needs?: string
  description?: string
  is_edible: boolean
  image_url?: string
  view_count?: number
}

export interface GardenPreferences {
  zone: string
  address: string
  edibleOnly: boolean
  seasons: string[]
  nativeOnly: boolean
}

export interface GardenPlant extends Plant {
  addedAt: string
}

export interface GardenLayout {
  width: number
  length: number
  photoUrl?: string
  shapeType: "rectangle" | "custom" | "l-shape" | "curved"
  customPoints?: { x: number; y: number }[]
  area?: number
}

export interface CareTask {
  id: string
  plantId: string
  plantName: string
  task: string
  frequency: string
  timeOfDay: string
  nextDue: string
}
