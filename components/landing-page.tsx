"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Leaf, Sprout, Calendar, Layout } from "lucide-react"

interface LandingPageProps {
  onGetStarted: () => void
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-2">
              <Leaf className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Cultivate</h1>
            </div>
            <Button onClick={onGetStarted} size="lg" className="font-semibold">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground text-balance leading-tight">
            Grow your dream garden with confidence
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            Plan, track, and nurture your garden with personalized recommendations, companion planting tips, and smart
            care schedules
          </p>
          <div className="pt-4">
            <Button onClick={onGetStarted} size="lg" className="text-base md:text-lg h-12 md:h-14 px-8 font-semibold">
              Start Planning Your Garden
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <FeatureCard
            icon={<Sprout className="w-8 h-8 text-primary" />}
            title="Smart Plant Recommendations"
            description="Find the perfect plants for your climate zone and growing conditions"
          />
          <FeatureCard
            icon={<Leaf className="w-8 h-8 text-primary" />}
            title="Companion Planting"
            description="Discover which plants grow best together for a thriving garden"
          />
          <FeatureCard
            icon={<Layout className="w-8 h-8 text-primary" />}
            title="Custom Garden Layouts"
            description="Design your garden with our flexible layout planner for any yard shape"
          />
          <FeatureCard
            icon={<Calendar className="w-8 h-8 text-primary" />}
            title="Care Schedules"
            description="Never miss watering or maintenance with personalized reminders"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="max-w-3xl mx-auto bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12 text-center space-y-6">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
            Ready to cultivate your perfect garden?
          </h3>
          <p className="text-base md:text-lg text-muted-foreground text-pretty leading-relaxed">
            Join gardeners who are growing smarter, not harder
          </p>
          <Button onClick={onGetStarted} size="lg" className="text-base md:text-lg h-12 md:h-14 px-8 font-semibold">
            Get Started - It's Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-12 md:mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">© 2025 Cultivate. All rights reserved.</span>
            </div>
            <p className="text-sm text-muted-foreground">Made for gardeners, by gardeners</p>

            <p className="text-xs text-muted-foreground">
              Plant data provided by{' '}
              <a href="https://trefle.io" target="_blank" rel="noopener">Trefle.io</a> (CC BY-SA 4.0),{' '}
              <a href="https://openfarm.cc" target="_blank" rel="noopener">OpenFarm</a> (CC0), and{' '}
              USDA Plants Database (Public Domain)
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4 hover:border-primary/40 transition-colors">
      <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center">{icon}</div>
      <h4 className="text-lg font-semibold text-foreground">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
