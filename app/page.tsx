"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { LandingPage } from "@/components/landing-page"
import { LoginForm } from "@/components/login-form"
import { Header } from "@/components/header"
import { Navigation } from "@/components/navigation"
import { HomeTab } from "@/components/home-tab"
import { FindPlantsTab } from "@/components/find-plants-tab"
import { MyGardenTab } from "@/components/my-garden-tab"
import { LayoutTab } from "@/components/layout-tab"
import { ScheduleTab } from "@/components/schedule-tab"
import { Toaster } from "@/components/ui/toaster"

export default function Page() {
  const [activeTab, setActiveTab] = useState("home")
  const [showAuth, setShowAuth] = useState(false)
  const { user } = useAuth()

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab onNavigate={setActiveTab} />
      case "find":
        return <FindPlantsTab />
      case "garden":
        return <MyGardenTab />
      case "layout":
        return <LayoutTab />
      case "schedule":
        return <ScheduleTab />
      default:
        return <HomeTab onNavigate={setActiveTab} />
    }
  }

  if (!user && !showAuth) {
    return (
      <>
        <Toaster />
        <LandingPage onGetStarted={() => setShowAuth(true)} />
      </>
    )
  }

  if (!user && showAuth) {
    return (
      <>
        <Toaster />
        <LoginForm />
      </>
    )
  }

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 pb-20 md:pb-0">{renderTab()}</main>
      </div>
    </>
  )
}
