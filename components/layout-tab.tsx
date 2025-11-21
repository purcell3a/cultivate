"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, Grid3x3, Wand2, Pencil, Square, Move, Undo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useGarden } from "@/lib/garden-context"
import { useToast } from "@/hooks/use-toast"

export function LayoutTab() {
  const { layout, setLayout, myGarden } = useGarden()
  const { toast } = useToast()
  const [width, setWidth] = useState(layout.width || 20)
  const [length, setLength] = useState(layout.length || 30)
  const [showGrid, setShowGrid] = useState(false)
  const [shapeType, setShapeType] = useState<"rectangle" | "custom" | "l-shape" | "curved">(
    layout.shapeType || "rectangle",
  )
  const [isDrawing, setIsDrawing] = useState(false)
  const [points, setPoints] = useState<{ x: number; y: number }[]>(layout.customPoints || [])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 })

  const calculateArea = (pts: { x: number; y: number }[]) => {
    if (pts.length < 3) return 0
    let area = 0
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length
      area += pts[i].x * pts[j].y
      area -= pts[j].x * pts[i].y
    }
    return Math.abs(area / 2)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1
    for (let i = 0; i <= canvas.width; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }
    for (let i = 0; i <= canvas.height; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvas.width, i)
      ctx.stroke()
    }

    // Draw shape
    if (points.length > 0) {
      ctx.fillStyle = "rgba(34, 197, 94, 0.2)"
      ctx.strokeStyle = "#22c55e"
      ctx.lineWidth = 3

      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      if (!isDrawing) {
        ctx.closePath()
      }
      ctx.fill()
      ctx.stroke()

      // Draw points
      points.forEach((point, i) => {
        ctx.fillStyle = "#22c55e"
        ctx.beginPath()
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2)
        ctx.fill()
      })
    }
  }, [points, isDrawing])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (shapeType !== "custom") return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setPoints([...points, { x, y }])
    setIsDrawing(true)
  }

  const handleFinishDrawing = () => {
    if (points.length < 3) {
      toast({
        title: "Need more points",
        description: "Draw at least 3 points to create a shape.",
        variant: "destructive",
      })
      return
    }

    setIsDrawing(false)
    const area = calculateArea(points)
    const sqFt = Math.round((area / 2500) * (width * length))

    setLayout({
      shapeType: "custom",
      customPoints: points,
      area: sqFt,
      width,
      length,
    })

    setShowGrid(true)
    toast({
      title: "Custom shape created!",
      description: `Your garden area is approximately ${sqFt} sq ft.`,
    })
  }

  const handleClearShape = () => {
    setPoints([])
    setIsDrawing(false)
  }

  const handleGenerate = () => {
    if (shapeType === "rectangle" && (width === 0 || length === 0)) {
      toast({
        title: "Invalid dimensions",
        description: "Please enter valid garden dimensions.",
        variant: "destructive",
      })
      return
    }

    if (shapeType === "custom" && points.length < 3) {
      toast({
        title: "Draw your shape",
        description: "Please draw your garden shape on the canvas.",
        variant: "destructive",
      })
      return
    }

    setLayout({ width, length, shapeType })
    setShowGrid(true)
    toast({
      title: "Garden plan generated!",
      description: `Your ${shapeType === "rectangle" ? `${width}x${length} ft` : "custom"} garden layout is ready.`,
    })
  }

  const gridCells = Array.from({ length: 10 }, (_, i) => i)
  const plantsInGrid = myGarden.slice(0, 10)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Garden Layout Planner</h2>
          <p className="text-muted-foreground mt-2">Design your garden space - any shape works!</p>
        </div>

        <Tabs value={shapeType} onValueChange={(v) => setShapeType(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rectangle" className="gap-2">
              <Square className="h-4 w-4" />
              Rectangle
            </TabsTrigger>
            <TabsTrigger value="l-shape" className="gap-2">
              <Move className="h-4 w-4" />
              L-Shape
            </TabsTrigger>
            <TabsTrigger value="curved" className="gap-2">
              <Wand2 className="h-4 w-4" />
              Curved
            </TabsTrigger>
            <TabsTrigger value="custom" className="gap-2">
              <Pencil className="h-4 w-4" />
              Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rectangle" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Garden Dimensions</CardTitle>
                  <CardDescription>Enter your rectangular garden space in feet</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="width">Width (feet)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        min="1"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="length">Length (feet)</Label>
                      <Input
                        id="length"
                        type="number"
                        value={length}
                        onChange={(e) => setLength(Number(e.target.value))}
                        min="1"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <Button onClick={handleGenerate} className="w-full" size="lg">
                    <Wand2 className="h-5 w-5 mr-2" />
                    Generate Garden Plan
                  </Button>
                </CardContent>
              </Card>

              {/* Input Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Garden Dimensions</CardTitle>
                  <CardDescription>Enter your available garden space dimensions in feet</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="width">Width (feet)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        min="1"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="length">Length (feet)</Label>
                      <Input
                        id="length"
                        type="number"
                        value={length}
                        onChange={(e) => setLength(Number(e.target.value))}
                        min="1"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="photo">Garden Photo (Optional)</Label>
                    <div className="mt-1.5 border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  </div>

                  <Button onClick={handleGenerate} className="w-full" size="lg">
                    <Wand2 className="h-5 w-5 mr-2" />
                    Generate Garden Plan
                  </Button>
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Garden Stats</CardTitle>
                  <CardDescription>Overview of your garden space</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-2xl font-bold text-foreground">{width} ft</p>
                      <p className="text-sm text-muted-foreground">Width</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-2xl font-bold text-foreground">{length} ft</p>
                      <p className="text-sm text-muted-foreground">Length</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-2xl font-bold text-foreground">{width * length} sq ft</p>
                      <p className="text-sm text-muted-foreground">Total Area</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-2xl font-bold text-foreground">{myGarden.length}</p>
                      <p className="text-sm text-muted-foreground">Plants</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-foreground mb-3">Layout Tips</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Place tall plants on the north side to avoid shading others</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Group plants with similar water needs together</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Leave pathways for easy access and maintenance</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Consider companion planting for better growth</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Draw Your Garden Shape</CardTitle>
                <CardDescription>
                  Click on the canvas to trace your actual yard shape. Click "Finish Drawing" when done.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-border rounded-lg p-4 bg-muted/30">
                  <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onClick={handleCanvasClick}
                    className="w-full cursor-crosshair bg-background rounded"
                  />
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleFinishDrawing} disabled={points.length < 3} className="flex-1" size="lg">
                    <Wand2 className="h-5 w-5 mr-2" />
                    Finish Drawing
                  </Button>
                  <Button onClick={handleClearShape} variant="outline" size="lg">
                    <Undo className="h-5 w-5 mr-2" />
                    Clear
                  </Button>
                </div>

                {points.length > 0 && (
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{points.length} points</span> drawn
                      {points.length >= 3 && " - Ready to finish!"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="l-shape" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>L-Shaped Garden</CardTitle>
                <CardDescription>Perfect for corner lots or wraparound spaces</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Coming soon! For now, use the Custom shape tool to draw your L-shaped garden.
                </p>
                <Button onClick={() => setShapeType("custom")} variant="outline" className="w-full">
                  Switch to Custom Draw
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="curved" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Curved Garden</CardTitle>
                <CardDescription>For organic, flowing garden designs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Coming soon! For now, use the Custom shape tool to draw your curved garden.
                </p>
                <Button onClick={() => setShapeType("custom")} variant="outline" className="w-full">
                  Switch to Custom Draw
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Grid Visualization */}
        {showGrid && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3x3 className="h-5 w-5 text-primary" />
                Garden Layout Grid
              </CardTitle>
              <CardDescription>
                Visual representation of your {shapeType === "rectangle" ? `${width}x${length} ft` : shapeType} garden
                space
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-8 rounded-lg">
                <div className="grid grid-cols-5 gap-4 max-w-3xl mx-auto">
                  {gridCells.map((i) => {
                    const plant = plantsInGrid[i]
                    return (
                      <div
                        key={i}
                        className="aspect-square bg-card border-2 border-border rounded-lg p-3 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow"
                      >
                        {plant ? (
                          <>
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                              <span className="text-lg">🌱</span>
                            </div>
                            <p className="text-xs font-medium text-foreground line-clamp-2">{plant.name}</p>
                          </>
                        ) : (
                          <div className="text-muted-foreground">
                            <div className="w-10 h-10 bg-muted rounded-full mb-2" />
                            <p className="text-xs">Empty</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
