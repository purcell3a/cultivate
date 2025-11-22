"use client"

import { Trash2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useGarden } from "@/lib/garden-context"
import { useToast } from "@/hooks/use-toast"
import { Sprout } from "lucide-react"

export function MyGardenTab() {
  const { myGarden, removePlant } = useGarden()
  const { toast } = useToast()

  const handleRemove = (plantId: number, plantName: string) => {
    removePlant(plantId)
    toast({
      title: "Plant removed",
      description: `${plantName} has been removed from your garden.`,
    })
  }

  if (myGarden.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="py-12">
            <CardContent className="text-center">
              <div className="bg-muted rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Sprout className="h-10 w-10 text-muted-foreground" />
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
            return (
              <Card key={plant.id} className="overflow-hidden">
                <div className="grid md:grid-cols-[300px,1fr] gap-6">
                  <div className="aspect-video md:aspect-square bg-muted relative">
                    {plant.image_url ? (
                      <img
                        src={plant.image_url || "/placeholder.svg"}
                        alt={plant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sprout className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">{plant.name}</h3>
                        <p className="text-sm italic text-muted-foreground">{plant.scientific_name}</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => handleRemove(plant.id, plant.name)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>

                    {plant.description && <p className="text-sm text-muted-foreground">{plant.description}</p>}

                    <div className="flex flex-wrap gap-2">
                      {plant.is_edible && <Badge variant="default">Edible</Badge>}
                      {plant.plant_type && <Badge variant="secondary">{plant.plant_type}</Badge>}
                      {plant.sun_requirement && plant.sun_requirement.length > 0 && (
                        <Badge variant="outline" className="capitalize">
                          {plant.sun_requirement[0]}
                        </Badge>
                      )}
                      {plant.water_needs && (
                        <Badge variant="outline" className="capitalize">
                          {plant.water_needs} water
                        </Badge>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Growing Info</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {plant.min_zone && plant.max_zone && (
                          <div>
                            <span className="text-muted-foreground">Zones:</span>{" "}
                            <span className="font-medium text-foreground">
                              {plant.min_zone}-{plant.max_zone}
                            </span>
                          </div>
                        )}
                        {plant.family && (
                          <div>
                            <span className="text-muted-foreground">Family:</span>{" "}
                            <span className="font-medium text-foreground">{plant.family}</span>
                          </div>
                        )}
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
