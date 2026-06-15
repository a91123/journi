import { defineStore } from 'pinia'

export interface TripEntry {
  id: string
  date: string
  time: string
  category: 'attraction' | 'food' | 'transport' | 'hotel' | 'ticket' | 'other'
  name: string
  note?: string
  order?: number
}

export interface StandbyItem {
  id: string
  category: string
  name: string
  note?: string
  duration?: string | number
  time?: string
}

export interface Trip {
  id: string
  destination: string
  startDate: string
  endDate: string
  days: number
  budget?: string | number | null
  createdAt: string
  itinerary: TripEntry[]
  standby: StandbyItem[]
}

type NewTripInput = Omit<Trip, 'id' | 'createdAt' | 'itinerary' | 'standby'>

export const useTripsStore = defineStore('trips', {
  state: () => ({
    trips: [] as Trip[]
  }),

  actions: {
    load() {
      if (import.meta.client) {
        const saved = localStorage.getItem('journi_trips')
        if (saved) this.trips = JSON.parse(saved) as Trip[]
      }
    },

    save() {
      if (import.meta.client) {
        localStorage.setItem('journi_trips', JSON.stringify(this.trips))
      }
    },

    addTrip(tripData: NewTripInput): Trip {
      const newTrip: Trip = {
        ...tripData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        itinerary: [],
        standby: []
      }
      this.trips.unshift(newTrip)
      this.save()
      return newTrip
    },

    getTrip(id: string): Trip | undefined {
      return this.trips.find(t => t.id === id)
    },

    updateTrip(id: string, data: Partial<Trip>) {
      const index = this.trips.findIndex(t => t.id === id)
      if (index !== -1) {
        this.trips[index] = { ...this.trips[index], ...data } as Trip
        this.save()
      }
    },

    deleteTrip(id: string) {
      this.trips = this.trips.filter(t => t.id !== id)
      this.save()
    },

    addToStandby(tripId: string, item: Omit<StandbyItem, 'id'>) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return
      const standby = [...(trip.standby || []), { ...item, id: Date.now().toString() }]
      this.updateTrip(tripId, { standby })
    },

    removeFromStandby(tripId: string, itemId: string) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return
      const standby = (trip.standby || []).filter(i => i.id !== itemId)
      this.updateTrip(tripId, { standby })
    },

    moveToDay(tripId: string, itemId: string, date: string) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return
      const item = (trip.standby || []).find(i => i.id === itemId)
      if (!item) return
      const itinerary: TripEntry[] = [
        ...(trip.itinerary || []),
        {
          id: Date.now().toString(),
          date,
          time: item.time || '',
          category: (item.category as TripEntry['category']) || 'other',
          name: item.name,
          note: item.note
        }
      ]
      const standby = (trip.standby || []).filter(i => i.id !== itemId)
      this.updateTrip(tripId, { itinerary, standby })
    },

    updateTripDates(tripId: string, { destination, startDate, endDate, budget }: Pick<Trip, 'destination' | 'startDate' | 'endDate' | 'budget'>): number {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return 0

      const start = new Date(startDate)
      const end = new Date(endDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

      const validDates = new Set<string>()
      for (let i = 0; i < days; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        validDates.add(d.toISOString().substring(0, 10))
      }

      const displaced = (trip.itinerary || []).filter(e => !validDates.has(e.date))
      const remaining = (trip.itinerary || []).filter(e => validDates.has(e.date))
      const newStandby: StandbyItem[] = [
        ...(trip.standby || []),
        ...displaced.map((e, i) => ({ ...e, id: `${Date.now()}_${i}` }))
      ]

      this.updateTrip(tripId, {
        destination,
        budget: budget || null,
        startDate,
        endDate,
        days,
        itinerary: remaining,
        standby: newStandby
      })

      return displaced.length
    },

    reorderEntry(tripId: string, date: string, entryId: string, direction: 'up' | 'down') {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return
      const sorted = (trip.itinerary || [])
        .filter(e => e.date === date)
        .sort((a, b) => {
          const t = (a.time || '').localeCompare(b.time || '')
          return t !== 0 ? t : (a.order ?? 0) - (b.order ?? 0)
        })
      const idx = sorted.findIndex(e => e.id === entryId)
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return
      const orders = sorted.map((_, i) => i * 10)
      const a = orders[idx]!
      const b = orders[swapIdx]!
      orders[idx] = b
      orders[swapIdx] = a
      const orderMap = Object.fromEntries(sorted.map((e, i) => [e.id, orders[i]]))
      const newItinerary = trip.itinerary.map(e =>
        orderMap[e.id] !== undefined ? { ...e, order: orderMap[e.id] } : e
      )
      this.updateTrip(tripId, { itinerary: newItinerary })
    },

    moveEntryToDay(tripId: string, entryId: string, newDate: string) {
      const trip = this.trips.find(t => t.id === tripId)
      if (!trip) return
      const newItinerary = trip.itinerary.map(e =>
        e.id === entryId ? { ...e, date: newDate } : e
      )
      this.updateTrip(tripId, { itinerary: newItinerary })
    }
  }
})
