"use client"

import { useState, useMemo } from "react"
import { Search, Filter, Plus, Sun, Droplets, Sprout } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGarden } from "@/lib/garden-context"
import { MOCK_PLANTS, type Plant } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"

export function FindPlantsTab() {
  const { preferences, setPreferences, myGarden, addPlant } = useGarden()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedSeason, setSelectedSeason] = useState<string>("all")

  const filteredPlants = useMemo(() => {
    return MOCK_PLANTS.filter((plant) => {
      // Search filter
      if (searchQuery && !plant.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Zone filter
      if (preferences.zone) {
        const zoneNum = Number.parseInt(preferences.zone)
        if (!plant.zones.includes(zoneNum)) {
          return false
        }
      }

      // Type filter
      if (selectedType !== "all" && plant.type !== selectedType) {
        return false
      }

      // Season filter
      if (selectedSeason !== "all") {
        if (!plant.seasons.includes(selectedSeason as any)) {
          return false
        }
      }

      // Native filter
      if (preferences.nativeOnly && !plant.isSunNative) {
        return false
      }

      return true
    })
  }, [searchQuery, preferences.zone, preferences.nativeOnly, selectedType, selectedSeason])

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

  const getSunIcon = (requirement: string) => {
    return <Sun className="h-4 w-4" />
  }

  const getWaterIcon = (needs: string) => {
    return <Droplets className="h-4 w-4" />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Find Your Perfect Plants</h2>
          <p className="text-muted-foreground mt-2">
            Browse our collection of {MOCK_PLANTS.length} plants suited for your garden
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search">Search Plants</Label>
                <div className="relative mt-1.5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name..."
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

              <div>
                <Label htmlFor="season">Season</Label>
                <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                  <SelectTrigger id="season" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Seasons</SelectItem>
                    <SelectItem value="spring">Spring</SelectItem>
                    <SelectItem value="summer">Summer</SelectItem>
                    <SelectItem value="fall">Fall</SelectItem>
                    <SelectItem value="winter">Winter</SelectItem>
                    <SelectItem value="year-round">Year-Round</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          <p className="text-sm text-muted-foreground mb-4">Showing {filteredPlants.length} plants</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlants.map((plant) => {
              const isInGarden = myGarden.some((p) => p.id === plant.id)
              return (
                <Card key={plant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={`/.jpg?height=200&width=400&query=${encodeURIComponent(plant.imageQuery)}`}
                      alt={plant.name}
                      className="w-full h-full object-cover"
                    />
                    <Badge
                      className="absolute top-3 right-3"
                      variant={plant.type === "edible" ? "default" : "secondary"}
                    >
                      {plant.type}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{plant.name}</CardTitle>
                    <CardDescription className="italic">{plant.scientificName}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{plant.description}</p>

                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                        {getSunIcon(plant.sunRequirement)}
                        <span className="capitalize">{plant.sunRequirement.replace("-", " ")}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                        {getWaterIcon(plant.waterNeeds)}
                        <span className="capitalize">{plant.waterNeeds}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {plant.difficulty}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {plant.seasons.slice(0, 3).map((season) => (
                        <Badge key={season} variant="secondary" className="text-xs">
                          {season}
                        </Badge>
                      ))}
                    </div>
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

          {filteredPlants.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No plants found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search query</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
