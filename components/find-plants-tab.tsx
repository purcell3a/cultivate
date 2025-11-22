"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Sun, Droplets, Sprout, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGarden } from "@/lib/garden-context"
import { useToast } from "@/hooks/use-toast"
import type { Plant } from "@/lib/types"

export function FindPlantsTab() {
  const { preferences, myGarden, addPlant } = useGarden()
  const { toast } = useToast()

  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const fetchPlants = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (debouncedQuery) params.append("q", debouncedQuery)
        if (preferences.zone) params.append("zone", preferences.zone)
        if (selectedType !== "all") {
          params.append("type", selectedType)
        }
        params.append("limit", "50")

        const response = await fetch(`/api/plants?${params}`)
        const data = await response.json()

        setPlants(data.plants || [])
      } catch (error) {
        console.error("Failed to fetch plants:", error)
        toast({
          title: "Error loading plants",
          description: "Please try again later",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPlants()
  }, [debouncedQuery, preferences.zone, selectedType, toast])

  const handleAddPlant = (plant: Plant) => {
    if (myGarden.some((p) => p.id === plant.id)) {
      toast({
        title: "Already in garden",
        description: `${plant.name} is already in your garden.`,
        variant: "destructive",
      })
      return
    }

    addPlant(plant)
    toast({
      title: "Plant added!",
      description: `${plant.name} has been added to your garden.`,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Find Your Perfect Plants</h2>
          <p className="text-muted-foreground mt-2">
            {preferences.zone
              ? `Browse plants suitable for zone ${preferences.zone}`
              : "Set your hardiness zone to see personalized recommendations"}
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search">Search Plants</Label>
                <div className="relative mt-1.5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name (e.g., tomato, rose, basil)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="type">Plant Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="type" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="edible">Edible</SelectItem>
                    <SelectItem value="ornamental">Ornamental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading plants...</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Showing {plants.length} plant{plants.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plants.map((plant) => {
                  const isInGarden = myGarden.some((p) => p.id === plant.id)
                  return (
                    <Card key={plant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-video bg-muted relative">
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
                        {plant.is_edible && (
                          <Badge className="absolute top-3 right-3" variant="default">
                            edible
                          </Badge>
                        )}
                      </div>
                      <CardHeader>
                        <CardTitle className="text-lg">{plant.name}</CardTitle>
                        <CardDescription className="italic">{plant.scientific_name}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {plant.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{plant.description}</p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {plant.sun_requirement && plant.sun_requirement.length > 0 && (
                            <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                              <Sun className="h-4 w-4" />
                              <span className="capitalize">{plant.sun_requirement[0]}</span>
                            </div>
                          )}
                          {plant.water_needs && (
                            <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                              <Droplets className="h-4 w-4" />
                              <span className="capitalize">{plant.water_needs}</span>
                            </div>
                          )}
                          {plant.min_zone && plant.max_zone && (
                            <Badge variant="outline" className="text-xs">
                              Zones {plant.min_zone}-{plant.max_zone}
                            </Badge>
                          )}
                        </div>

                        {plant.family && <div className="text-xs text-muted-foreground">Family: {plant.family}</div>}
                      </CardContent>
                      <CardFooter>
                        <Button
                          onClick={() => handleAddPlant(plant)}
                          disabled={isInGarden}
                          className="w-full"
                          variant={isInGarden ? "outline" : "default"}
                        >
                          {isInGarden ? (
                            <>
                              <Sprout className="h-4 w-4 mr-2" />
                              In Garden
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add to Garden
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>

              {plants.length === 0 && !loading && (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No plants found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? "Try a different search term or adjust your filters"
                        : "Start searching for plants to see results"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
