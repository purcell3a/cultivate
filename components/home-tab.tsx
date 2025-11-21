"use client"

import { MapPin, Search, Sprout, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGarden } from "@/lib/garden-context"
import { HARDINESS_ZONES } from "@/lib/mock-data"
import { useState } from "react"

interface HomeTabProps {
  onNavigate: (tab: string) => void
}

export function HomeTab({ onNavigate }: HomeTabProps) {
  const { preferences, setPreferences, myGarden } = useGarden()
  const [addressInput, setAddressInput] = useState(preferences.address)
  const [showZoneInfo, setShowZoneInfo] = useState(false)

  const handleZoneLookup = () => {
    // Mock zone lookup - in production this would call USDA API
    const mockZone = "7b"
    setPreferences({ zone: mockZone, address: addressInput })
    setShowZoneInfo(true)
  }

  const zoneInfo = HARDINESS_ZONES.find((z) => z.zone === preferences.zone)

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        <div className="text-center space-y-3 md:space-y-4">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground text-balance">
            Welcome to Your Garden Journey
          </h2>
          <p className="text-base md:text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            Discover the perfect plants for your space, climate, and preferences. Start by entering your location to get
            personalized recommendations.
          </p>
        </div>

        {/* Zone Lookup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <MapPin className="h-5 w-5 text-primary" />
              Find Your Hardiness Zone
            </CardTitle>
            <CardDescription className="text-sm">
              Enter your address to discover which plants thrive in your climate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Enter your address"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleZoneLookup} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                <Search className="h-4 w-4 mr-2" />
                Find Zone
              </Button>
            </div>

            {showZoneInfo && zoneInfo && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base md:text-lg text-foreground">USDA Zone {zoneInfo.zone}</h3>
                  <span className="text-xs md:text-sm font-medium text-primary">{zoneInfo.temp}</span>
                </div>
                <p className="text-sm text-muted-foreground">{zoneInfo.description}</p>
                <div className="pt-2">
                  <Button onClick={() => onNavigate("find")} className="w-full">
                    Browse Plants for Zone {zoneInfo.zone}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                <div className="bg-primary/10 p-2 md:p-3 rounded-full">
                  <Sprout className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{myGarden.length}</p>
                  <p className="text-[10px] md:text-sm text-muted-foreground">Plants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                <div className="bg-secondary/10 p-2 md:p-3 rounded-full">
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-secondary" />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{preferences.zone || "-"}</p>
                  <p className="text-[10px] md:text-sm text-muted-foreground">Zone</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                <div className="bg-accent/10 p-2 md:p-3 rounded-full">
                  <Search className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xl md:text-2xl font-bold text-foreground">30+</p>
                  <p className="text-[10px] md:text-sm text-muted-foreground">Plants</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Get Started</CardTitle>
            <CardDescription className="text-sm">Follow these steps to plan your perfect garden</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-sm md:text-base text-foreground">Set Your Preferences</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Choose edible vs ornamental plants, growing seasons, and native plant options
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-sm md:text-base text-foreground">Browse Plant Recommendations</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Explore plants perfectly suited to your zone and preferences
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-sm md:text-base text-foreground">Build Your Garden</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Add plants to your garden and see companion planting suggestions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 shrink-0">
                4
              </div>
              <div>
                <p className="font-medium text-sm md:text-base text-foreground">Plan Your Layout</p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Design your garden layout with visual planning tools
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
