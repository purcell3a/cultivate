"use server"

import { sql } from "./db"
import { getCurrentUser } from "./auth-actions"

export async function getUserPlants() {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }

    const result = await sql`
      SELECT * FROM user_plants 
      WHERE user_id = ${user.id}
      ORDER BY added_date DESC
    `

    return { plants: result }
  } catch (error) {
    console.error("[v0] Get user plants error:", error)
    return { error: "Failed to fetch plants" }
  }
}

export async function addPlantToGarden(plant: any) {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }

    const result = await sql`
      INSERT INTO user_plants (user_id, plant_id, plant_name, plant_type, notes)
      VALUES (${user.id}, ${plant.id}, ${plant.name}, ${plant.type}, ${plant.notes || ""})
      RETURNING *
    `

    return { plant: result[0] }
  } catch (error) {
    console.error("[v0] Add plant error:", error)
    return { error: "Failed to add plant" }
  }
}

export async function removePlantFromGarden(plantId: number) {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }

    await sql`
      DELETE FROM user_plants 
      WHERE id = ${plantId} AND user_id = ${user.id}
    `

    return { success: true }
  } catch (error) {
    console.error("[v0] Remove plant error:", error)
    return { error: "Failed to remove plant" }
  }
}

export async function getGardenLayout() {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }

    const result = await sql`
      SELECT * FROM garden_layouts 
      WHERE user_id = ${user.id}
      ORDER BY updated_at DESC
      LIMIT 1
    `

    return { layout: result[0] || null }
  } catch (error) {
    console.error("[v0] Get garden layout error:", error)
    return { error: "Failed to fetch layout" }
  }
}

export async function saveGardenLayout(layout: any) {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }

    // Check if layout exists
    const existing = await sql`
      SELECT id FROM garden_layouts WHERE user_id = ${user.id}
    `

    if (existing.length > 0) {
      // Update existing
      const result = await sql`
        UPDATE garden_layouts 
        SET shape_type = ${layout.shapeType},
            dimensions = ${JSON.stringify(layout.dimensions)},
            area = ${layout.area},
            plants = ${JSON.stringify(layout.plants || [])},
            updated_at = NOW()
        WHERE user_id = ${user.id}
        RETURNING *
      `
      return { layout: result[0] }
    } else {
      // Create new
      const result = await sql`
        INSERT INTO garden_layouts (user_id, shape_type, dimensions, area, plants)
        VALUES (${user.id}, ${layout.shapeType}, ${JSON.stringify(layout.dimensions)}, ${layout.area}, ${JSON.stringify(layout.plants || [])})
        RETURNING *
      `
      return { layout: result[0] }
    }
  } catch (error) {
    console.error("[v0] Save garden layout error:", error)
    return { error: "Failed to save layout" }
  }
}

export async function getCareTasks() {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }

    const result = await sql`
      SELECT * FROM care_tasks 
      WHERE user_id = ${user.id}
      ORDER BY next_due ASC NULLS LAST, created_at DESC
    `

    return { tasks: result }
  } catch (error) {
    console.error("[v0] Get care tasks error:", error)
    return { error: "Failed to fetch tasks" }
  }
}

export async function addCareTask(task: any) {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }

    const result = await sql`
      INSERT INTO care_tasks (user_id, task_type, plant_name, frequency, next_due, notes)
      VALUES (${user.id}, ${task.taskType}, ${task.plantName || ""}, ${task.frequency}, ${task.nextDue}, ${task.notes || ""})
      RETURNING *
    `

    return { task: result[0] }
  } catch (error) {
    console.error("[v0] Add care task error:", error)
    return { error: "Failed to add task" }
  }
}

export async function toggleTaskComplete(taskId: number, completed: boolean) {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }

    const result = await sql`
      UPDATE care_tasks 
      SET completed = ${completed},
          last_completed = ${completed ? new Date().toISOString() : null}
      WHERE id = ${taskId} AND user_id = ${user.id}
      RETURNING *
    `

    return { task: result[0] }
  } catch (error) {
    console.error("[v0] Toggle task error:", error)
    return { error: "Failed to update task" }
  }
}

export async function deleteCareTask(taskId: number) {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }

    await sql`
      DELETE FROM care_tasks 
      WHERE id = ${taskId} AND user_id = ${user.id}
    `

    return { success: true }
  } catch (error) {
    console.error("[v0] Delete task error:", error)
    return { error: "Failed to delete task" }
  }
}

export async function getUserPreferences() {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }

    const result = await sql`
      SELECT * FROM user_preferences WHERE user_id = ${user.id}
    `

    return { preferences: result[0] || null }
  } catch (error) {
    console.error("[v0] Get preferences error:", error)
    return { error: "Failed to fetch preferences" }
  }
}

export async function updateUserPreferences(preferences: any) {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated" }

    const result = await sql`
      INSERT INTO user_preferences (user_id, hardiness_zone, location_address, preferred_view)
      VALUES (${user.id}, ${preferences.hardinessZone || null}, ${preferences.locationAddress || null}, ${preferences.preferredView || "home"})
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        hardiness_zone = ${preferences.hardinessZone || null},
        location_address = ${preferences.locationAddress || null},
        preferred_view = ${preferences.preferredView || "home"},
        updated_at = NOW()
      RETURNING *
    `

    return { preferences: result[0] }
  } catch (error) {
    console.error("[v0] Update preferences error:", error)
    return { error: "Failed to update preferences" }
  }
}
