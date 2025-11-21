"use client"

import { Home, Search, Sprout, LayoutGrid, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "find", label: "Find", icon: Search },
  { id: "garden", label: "Garden", icon: Sprout },
  { id: "layout", label: "Layout", icon: LayoutGrid },
  { id: "schedule", label: "Schedule", icon: Calendar },
]

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm z-50 md:relative md:border-b md:border-t-0">
      <div className="container mx-auto px-2 md:px-4">
        <div className="flex md:gap-1 md:overflow-x-auto justify-around md:justify-start">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium transition-colors whitespace-nowrap md:border-b-2 min-w-[60px] md:min-w-0",
                  activeTab === item.id
                    ? "md:border-primary text-primary"
                    : "md:border-transparent text-muted-foreground hover:text-foreground md:hover:border-border",
                )}
              >
                <Icon className={cn("h-5 w-5 md:h-4 md:w-4", activeTab === item.id && "text-primary")} />
                <span className="md:inline">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
