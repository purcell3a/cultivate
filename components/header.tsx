"use client"

import { Leaf, MapPin, LogOut } from "lucide-react"
import { useGarden } from "@/lib/garden-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"

export function Header() {
  const { preferences, myGarden } = useGarden()
  const { user, signOut } = useAuth()

  return (
    <header className="border-b bg-card sticky top-0 z-40 backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-full p-1.5 md:p-2">
            <Leaf className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-foreground">Cultivate</h1>
            <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">Your Garden Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {preferences.zone && (
            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
              <MapPin className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              <div>
                <p className="font-medium text-foreground">Zone {preferences.zone}</p>
              </div>
            </div>
          )}

          {myGarden.length > 0 && (
            <div className="hidden lg:flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
              <Leaf className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {myGarden.length} {myGarden.length === 1 ? "Plant" : "Plants"}
              </span>
            </div>
          )}

          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
