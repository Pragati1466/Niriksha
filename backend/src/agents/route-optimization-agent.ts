// Route Optimization Agent
import { AgentState, RouteOptimizationResult, RoutePoint, AlternativeRoute, TrafficAlert } from './types'
import prisma from '../utils/prisma'

export class RouteOptimizationAgent {
  private config = {
    name: 'route-optimization',
    version: '1.0.0',
    maxRetries: 3,
    timeout: 30000,
    memoryEnabled: true,
    tools: ['distance-calculation', 'traffic-analysis', 'priority-ranking', 'route-alternatives'],
  }

  // Tool: Calculate Distance Between Points
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  // Tool: Estimate Travel Time
  private estimateTravelTime(distance: number, trafficFactor: number = 1): number {
    const averageSpeed = 40 // km/h in urban areas
    const adjustedSpeed = averageSpeed / trafficFactor
    return (distance / adjustedSpeed) * 60 // Return in minutes
  }

  // Tool: Analyze Traffic Patterns
  private async analyzeTrafficPatterns(): Promise<TrafficAlert[]> {
    // In a real implementation, this would integrate with traffic APIs
    // For now, we'll simulate traffic data
    const alerts: TrafficAlert[] = []

    // Simulate some traffic conditions
    const currentHour = new Date().getHours()
    
    // Rush hour traffic
    if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)) {
      alerts.push({
        location: 'City Center',
        type: 'CONGESTION',
        severity: 'HIGH',
        estimatedDelay: 20,
      })
    }

    // Random construction zones
    if (Math.random() > 0.7) {
      alerts.push({
        location: 'Main Street',
        type: 'CONSTRUCTION',
        severity: 'MEDIUM',
        estimatedDelay: 15,
      })
    }

    return alerts
  }

  // Tool: Rank Inspections by Priority
  private rankInspectionsByPriority(inspections: any[]): any[] {
    return inspections.sort((a, b) => {
      // Priority factors: deadline, severity of previous violations, time since last inspection
      const aPriority = this.calculateInspectionPriority(a)
      const bPriority = this.calculateInspectionPriority(b)
      return bPriority - aPriority
    })
  }

  private calculateInspectionPriority(inspection: any): number {
    let priority = 0

    // Deadline urgency
    if (inspection.deadline) {
      const daysUntilDeadline = (new Date(inspection.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      if (daysUntilDeadline < 1) priority += 100
      else if (daysUntilDeadline < 3) priority += 75
      else if (daysUntilDeadline < 7) priority += 50
      else if (daysUntilDeadline < 14) priority += 25
    }

    // Previous violations
    const previousViolations = inspection.site?.inspections?.flatMap((i: any) => i.violations) || []
    const criticalViolations = previousViolations.filter((v: any) => v.severity === 'CRITICAL').length
    priority += criticalViolations * 20

    // Time since last inspection
    const lastInspection = inspection.site?.inspections?.[0]
    if (lastInspection) {
      const daysSinceLastInspection = (Date.now() - new Date(lastInspection.scheduledDate).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLastInspection > 90) priority += 30
      else if (daysSinceLastInspection > 60) priority += 20
      else if (daysSinceLastInspection > 30) priority += 10
    }

    return priority
  }

  // Tool: Generate Alternative Routes
  private generateAlternativeRoutes(
    optimizedRoute: RoutePoint[],
    trafficAlerts: TrafficAlert[]
  ): AlternativeRoute[] {
    const alternatives: AlternativeRoute[] = []

    // Alternative 1: Reverse order
    if (optimizedRoute.length > 2) {
      const reversedRoute = [...optimizedRoute].reverse()
      const reversedDistance = this.calculateTotalDistance(reversedRoute)
      const reversedTime = this.estimateTravelTime(reversedDistance, 1.1)

      alternatives.push({
        routeId: 'alt-1',
        points: reversedRoute,
        estimatedTime: reversedTime,
        distance: reversedDistance,
        reason: 'Reverse order to avoid traffic congestion',
      })
    }

    // Alternative 2: Skip high-traffic areas
    if (trafficAlerts.length > 0) {
      const filteredRoute = optimizedRoute.filter(point => 
        !trafficAlerts.some(alert => point.address.includes(alert.location))
      )

      if (filteredRoute.length > 0) {
        const filteredDistance = this.calculateTotalDistance(filteredRoute)
        const filteredTime = this.estimateTravelTime(filteredDistance, 0.8)

        alternatives.push({
          routeId: 'alt-2',
          points: filteredRoute,
          estimatedTime: filteredTime,
          distance: filteredDistance,
          reason: 'Avoid high-traffic areas',
        })
      }
    }

    return alternatives
  }

  private calculateTotalDistance(route: RoutePoint[]): number {
    let totalDistance = 0
    for (let i = 0; i < route.length - 1; i++) {
      const current = route[i]
      const next = route[i + 1]
      totalDistance += this.calculateDistance(
        current.coordinates.lat,
        current.coordinates.lng,
        next.coordinates.lat,
        next.coordinates.lng
      )
    }
    return totalDistance
  }

  // Node: Optimize Route
  private async optimizeRoute(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const { inspectorId } = state

      if (!inspectorId) {
        throw new Error('Inspector ID required for route optimization')
      }

      // Fetch inspector's assigned inspections
      const inspections = await prisma.inspection.findMany({
        where: {
          inspectorId,
          status: 'ASSIGNED',
        },
        include: {
          site: {
            include: {
              inspections: {
                include: {
                  violations: true,
                },
              },
            },
          },
        },
      })

      if (inspections.length === 0) {
        return {
          results: {
            ...state.results,
            routeOptimization: {
              optimizedRoute: [],
              estimatedTime: 0,
              distance: 0,
              fuelEstimate: 0,
              alternativeRoutes: [],
              trafficAlerts: [],
            },
          },
          currentAgent: this.config.name,
        }
      }

      // Rank inspections by priority
      const rankedInspections = this.rankInspectionsByPriority(inspections)

      // Get inspector's current location (default to first site)
      const currentLocation = {
        lat: rankedInspections[0].site.latitude || 0,
        lng: rankedInspections[0].site.longitude || 0,
      }

      // Analyze traffic
      const trafficAlerts = await this.analyzeTrafficPatterns()
      const trafficFactor = trafficAlerts.length > 0 ? 1.3 : 1.0

      // Generate route points
      const routePoints: RoutePoint[] = []
      let currentTime = new Date()
      let totalDistance = 0

      rankedInspections.forEach((inspection, index) => {
        const site = inspection.site
        const distanceFromPrevious = index === 0
          ? 0
          : this.calculateDistance(
              routePoints[index - 1].coordinates.lat,
              routePoints[index - 1].coordinates.lng,
              site.latitude || 0,
              site.longitude || 0
            )

        totalDistance += distanceFromPrevious
        const travelTime = this.estimateTravelTime(distanceFromPrevious, trafficFactor)
        const inspectionTime = 30 // Assume 30 minutes per inspection

        currentTime = new Date(currentTime.getTime() + (travelTime + inspectionTime) * 60 * 1000)

        routePoints.push({
          id: inspection.id,
          inspectionId: inspection.id,
          siteName: site.name,
          address: site.address,
          coordinates: {
            lat: site.latitude || 0,
            lng: site.longitude || 0,
          },
          priority: this.calculateInspectionPriority(inspection),
          estimatedArrival: new Date(currentTime),
          estimatedDuration: inspectionTime,
        })
      })

      // Calculate totals
      const estimatedTime = routePoints.reduce((acc, point) => acc + point.estimatedDuration, 0) +
                          this.estimateTravelTime(totalDistance, trafficFactor)
      const fuelEstimate = totalDistance * 0.1 // Assume 0.1L per km

      // Generate alternatives
      const alternativeRoutes = this.generateAlternativeRoutes(routePoints, trafficAlerts)

      const result: RouteOptimizationResult = {
        optimizedRoute: routePoints,
        estimatedTime,
        distance: totalDistance,
        fuelEstimate,
        alternativeRoutes,
        trafficAlerts,
      }

      return {
        results: {
          ...state.results,
          routeOptimization: result,
        },
        currentAgent: this.config.name,
      }
    } catch (error) {
      console.error('Route optimization error:', error)
      throw error
    }
  }

  // Execute Agent
  async execute(state: AgentState): Promise<AgentState> {
    let currentState = { ...state, currentAgent: this.config.name }
    const maxRetries = state.maxRetries || this.config.maxRetries

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        currentState.retryCount = attempt
        const result = await this.optimizeRoute(currentState)
        currentState = { ...currentState, ...result }

        if (!currentState.errors || currentState.errors.length === 0) {
          return currentState
        }
      } catch (error) {
        console.error(`Route optimization attempt ${attempt + 1} failed:`, error)
        currentState.errors = [
          ...(currentState.errors || []),
          `Attempt ${attempt + 1}: ${error}`,
        ]
      }
    }

    return currentState
  }

  // Get Configuration
  getConfig() {
    return this.config
  }
}
