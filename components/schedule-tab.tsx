"use client"

import { useState } from "react"
import { Calendar, Plus, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useGarden } from "@/lib/garden-context"
import { useToast } from "@/hooks/use-toast"

export function ScheduleTab() {
  const { myGarden, careTasks, addCareTask, removeCareTask } = useGarden()
  const { toast } = useToast()

  const [selectedPlant, setSelectedPlant] = useState("")
  const [taskType, setTaskType] = useState("")
  const [frequency, setFrequency] = useState("")
  const [timeOfDay, setTimeOfDay] = useState("")

  const handleAddTask = () => {
    if (!selectedPlant || !taskType || !frequency || !timeOfDay) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields to add a care task.",
        variant: "destructive",
      })
      return
    }

    const plant = myGarden.find((p) => p.id === selectedPlant)
    if (!plant) return

    addCareTask({
      plantId: plant.id,
      plantName: plant.name,
      task: taskType,
      frequency,
      timeOfDay,
    })

    toast({
      title: "Task added!",
      description: `Care task for ${plant.name} has been scheduled.`,
    })

    // Reset form
    setSelectedPlant("")
    setTaskType("")
    setFrequency("")
    setTimeOfDay("")
  }

  const handleRemoveTask = (taskId: string, plantName: string) => {
    removeCareTask(taskId)
    toast({
      title: "Task removed",
      description: `Care task for ${plantName} has been removed.`,
    })
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (myGarden.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="py-12">
            <CardContent className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-foreground mb-2">No plants in garden</h3>
              <p className="text-muted-foreground">Add plants to your garden to schedule care tasks</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Plant Care Schedule</h2>
          <p className="text-muted-foreground mt-2">
            Manage watering, fertilizing, and maintenance tasks for your plants
          </p>
        </div>

        <div className="grid md:grid-cols-[2fr,3fr] gap-6">
          {/* Add Task Card */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule New Task</CardTitle>
              <CardDescription>Add a care task for your plants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="plant">Select Plant</Label>
                <Select value={selectedPlant} onValueChange={setSelectedPlant}>
                  <SelectTrigger id="plant" className="mt-1.5">
                    <SelectValue placeholder="Choose a plant" />
                  </SelectTrigger>
                  <SelectContent>
                    {myGarden.map((plant) => (
                      <SelectItem key={plant.id} value={plant.id}>
                        {plant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="task">Care Task</Label>
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger id="task" className="mt-1.5">
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="watering">Watering</SelectItem>
                    <SelectItem value="fertilizing">Fertilizing</SelectItem>
                    <SelectItem value="pruning">Pruning</SelectItem>
                    <SelectItem value="harvesting">Harvesting</SelectItem>
                    <SelectItem value="weeding">Weeding</SelectItem>
                    <SelectItem value="pest-control">Pest Control</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger id="frequency" className="mt-1.5">
                    <SelectValue placeholder="How often?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="time">Preferred Time</Label>
                <Select value={timeOfDay} onValueChange={setTimeOfDay}>
                  <SelectTrigger id="time" className="mt-1.5">
                    <SelectValue placeholder="Time of day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleAddTask} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </CardContent>
          </Card>

          {/* Tasks List */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Tasks</CardTitle>
              <CardDescription>
                {careTasks.length} {careTasks.length === 1 ? "task" : "tasks"} scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              {careTasks.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No tasks scheduled yet. Add your first care task to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {careTasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{task.plantName}</h4>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground capitalize">{task.task}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span className="capitalize">{task.frequency}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="capitalize">{task.timeOfDay}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">Next due: {formatDate(task.nextDue)}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveTask(task.id, task.plantName)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
