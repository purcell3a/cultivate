"use client"

import { Trash2, Users, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useGarden } from "@/lib/garden-context"
import { useToast } from "@/hooks/use-toast"
import { MOCK_PLANTS } from "@/lib/mock-data"

export function MyGardenTab() {
  const { myGarden, removePlant } = useGarden()
  const { toast } = useToast()

  const handleRemove = (plantId: string, plantName: string) => {
    removePlant(plantId)
    toast({
      title: "Plant removed",
      description: `${plantName} has been removed from your garden.`,
    })
  }

  const getCompanionPlants = (companions: string[]) => {
    return companions
      .map((companionId) => {
        const companion = MOCK_PLANTS.find((p) => p.name.toLowerCase() === companionId.toLowerCase())
        return companion?.name || companionId
      })
      .slice(0, 5)
  }

  if (myGarden.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="py-12">
            <CardContent className="text-center">
              <div className="bg-muted rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-2">Your garden is empty</h3>
              <p className="text-muted-foreground mb-6">
                Start building your dream garden by adding plants from our collection
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">My Garden</h2>
          <p className="text-muted-foreground mt-2">
            You have {myGarden.length} {myGarden.length === 1 ? "plant" : "plants"} in your garden
          </p>
        </div>

        <div className="space-y-6">
          {myGarden.map((plant) => {
            const companions = getCompanionPlants(plant.companions)
            return (
              <Card key={plant.id} className="overflow-hidden">
                <div className="grid md:grid-cols-[300px,1fr] gap-6">
                  <div className="aspect-video md:aspect-square bg-muted relative">
                    <img
                      src={`/.jpg?height=300&width=300&query=${encodeURIComponent(plant.imageQuery)}`}
                      alt={plant.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">{plant.name}</h3>
                        <p className="text-sm italic text-muted-foreground">{plant.scientificName}</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => handleRemove(plant.id, plant.name)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground">{plant.description}</p>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant={plant.type === "edible" ? "default" : "secondary"}>{plant.type}</Badge>
                      <Badge variant="outline">{plant.difficulty} to grow</Badge>
                      <Badge variant="outline" className="capitalize">
                        {plant.sunRequirement.replace("-", " ")}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {plant.waterNeeds} water
                      </Badge>
                    </div>

                    {companions.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold text-foreground">Companion Plants</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          These plants grow well together and can improve growth, repel pests, or attract beneficial
                          insects:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {companions.map((companion) => (
                            <Badge key={companion} variant="secondary" className="capitalize">
                              {companion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Growing Info</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Zones:</span>{" "}
                          <span className="font-medium text-foreground">
                            {plant.zones[0]}-{plant.zones[plant.zones.length - 1]}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Seasons:</span>{" "}
                          <span className="font-medium text-foreground capitalize">{plant.seasons.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
