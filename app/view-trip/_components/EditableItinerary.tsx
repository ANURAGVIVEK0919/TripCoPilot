"use client"

import { useTripDetail, useUserDetail } from '@/app/provider'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import { useMutation } from 'convex/react'
import { Edit2, MapPin, Plus, Save, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'

type Activity = {
    place_name: string
    place_details: string
    place_image_url: string
    geo_coordinates: {
        latitude: number
        longitude: number
    }
    place_address: string
    ticket_pricing: string
    time_travel_each_location: string
    best_time_to_visit: string
}

type Day = {
    day: number
    day_plan: string
    best_time_to_visit_day: string
    activities: Activity[]
}

// Helper function to sanitize image URLs
const sanitizeImageUrl = (url: string | undefined | null): string => {
    if (!url) return '/placeholder.jpg'
    
    // Fix common URL malformations - replace ( with / after domain
    const fixedUrl = url.replace(/\.com\(/g, '.com/')
                        .replace(/\.net\(/g, '.net/')
                        .replace(/\.org\(/g, '.org/')
    
    // Validate URL format
    try {
        new URL(fixedUrl)
        return fixedUrl
    } catch {
        return '/placeholder.jpg'
    }
}

export default function EditableItinerary() {
    const { tripDetailInfo, setTripDetailInfo } = useTripDetail() as { 
        tripDetailInfo?: { itinerary?: Day[], tripId?: string } 
        setTripDetailInfo: (info: any) => void
    }
    const { userDetail } = useUserDetail()
    const { toast } = useToast()
    
    const [editingActivity, setEditingActivity] = useState<{
        dayIndex: number
        activityIndex: number
        activity: Activity
    } | null>(null)
    
    const [editingDay, setEditingDay] = useState<{
        dayIndex: number
        dayPlan: string
    } | null>(null)
    
    const [addingActivity, setAddingActivity] = useState<{
        dayIndex: number
    } | null>(null)
    
    const [newActivity, setNewActivity] = useState<Activity>({
        place_name: '',
        place_details: '',
        place_image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
        geo_coordinates: { latitude: 0, longitude: 0 },
        place_address: '',
        ticket_pricing: '',
        time_travel_each_location: '',
        best_time_to_visit: ''
    })

    const updateActivity = useMutation(api.tripDetail.updateItineraryActivity)
    const addActivity = useMutation(api.tripDetail.addItineraryActivity)
    const deleteActivity = useMutation(api.tripDetail.deleteItineraryActivity)
    const updateDayPlanMutation = useMutation(api.tripDetail.updateDayPlan)

    const handleUpdateActivity = async () => {
        if (!editingActivity || !userDetail?._id || !tripDetailInfo?.tripId) return

        try {
            const result = await updateActivity({
                tripId: tripDetailInfo.tripId,
                uid: userDetail._id,
                dayIndex: editingActivity.dayIndex,
                activityIndex: editingActivity.activityIndex,
                updatedActivity: editingActivity.activity
            })

            if (result.success) {
                setTripDetailInfo(result.tripDetail)
                setEditingActivity(null)
                toast({
                    title: "✅ Activity Updated",
                    description: "Your changes have been saved successfully"
                })
            }
        } catch (error) {
            console.error('Error updating activity:', error)
            toast({
                title: "❌ Error",
                description: "Failed to update activity. Please try again.",
                variant: "destructive"
            })
        }
    }

    const handleAddActivity = async () => {
        if (!addingActivity || !userDetail?._id || !tripDetailInfo?.tripId) return
        if (!newActivity.place_name.trim()) {
            toast({
                title: "⚠️ Missing Information",
                description: "Please enter at least a place name",
                variant: "destructive"
            })
            return
        }

        try {
            const result = await addActivity({
                tripId: tripDetailInfo.tripId,
                uid: userDetail._id,
                dayIndex: addingActivity.dayIndex,
                newActivity
            })

            if (result.success) {
                setTripDetailInfo(result.tripDetail)
                setAddingActivity(null)
                setNewActivity({
                    place_name: '',
                    place_details: '',
                    place_image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
                    geo_coordinates: { latitude: 0, longitude: 0 },
                    place_address: '',
                    ticket_pricing: '',
                    time_travel_each_location: '',
                    best_time_to_visit: ''
                })
                toast({
                    title: "✅ Activity Added",
                    description: "New activity has been added to your itinerary"
                })
            }
        } catch (error) {
            console.error('Error adding activity:', error)
            toast({
                title: "❌ Error",
                description: "Failed to add activity. Please try again.",
                variant: "destructive"
            })
        }
    }

    const handleDeleteActivity = async (dayIndex: number, activityIndex: number) => {
        if (!userDetail?._id || !tripDetailInfo?.tripId) return

        try {
            const result = await deleteActivity({
                tripId: tripDetailInfo.tripId,
                uid: userDetail._id,
                dayIndex,
                activityIndex
            })

            if (result.success) {
                setTripDetailInfo(result.tripDetail)
                toast({
                    title: "✅ Activity Deleted",
                    description: "Activity has been removed from your itinerary"
                })
            }
        } catch (error) {
            console.error('Error deleting activity:', error)
            toast({
                title: "❌ Error",
                description: "Failed to delete activity. Please try again.",
                variant: "destructive"
            })
        }
    }

    const handleUpdateDayPlan = async () => {
        if (!editingDay || !userDetail?._id || !tripDetailInfo?.tripId) return

        try {
            const result = await updateDayPlanMutation({
                tripId: tripDetailInfo.tripId,
                uid: userDetail._id,
                dayIndex: editingDay.dayIndex,
                dayPlan: editingDay.dayPlan
            })

            if (result.success) {
                setTripDetailInfo(result.tripDetail)
                setEditingDay(null)
                toast({
                    title: "✅ Day Plan Updated",
                    description: "Your day plan has been saved successfully"
                })
            }
        } catch (error) {
            console.error('Error updating day plan:', error)
            toast({
                title: "❌ Error",
                description: "Failed to update day plan. Please try again.",
                variant: "destructive"
            })
        }
    }

    if (!tripDetailInfo?.itinerary) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <span className="text-3xl">📅</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">No Itinerary Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                    Create a trip to see your personalized day-by-day itinerary here!
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {tripDetailInfo.itinerary.map((day: Day, dayIndex: number) => (
                <div key={dayIndex} className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                    {/* Day Header */}
                    <div className="bg-primary/5 border-b border-border p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                                        {day.day}
                                    </div>
                                    <h2 className="font-bold text-foreground">Day {day.day}</h2>
                                </div>
                                
                                {editingDay?.dayIndex === dayIndex ? (
                                    <div className="space-y-3 mt-3">
                                        <Textarea
                                            value={editingDay.dayPlan}
                                            onChange={(e) => setEditingDay({ ...editingDay, dayPlan: e.target.value })}
                                            className="w-full"
                                            rows={3}
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={handleUpdateDayPlan} className="shadow-sm">
                                                <Save className="h-3.5 w-3.5 mr-1.5" /> Save
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setEditingDay(null)}>
                                                <X className="h-3.5 w-3.5 mr-1.5" /> Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-muted-foreground text-sm leading-relaxed mt-2">{day.day_plan}</p>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="mt-3 h-8 text-xs"
                                            onClick={() => setEditingDay({ dayIndex, dayPlan: day.day_plan })}
                                        >
                                            <Edit2 className="h-3 w-3 mr-1.5" /> Edit Plan
                                        </Button>
                                    </>
                                )}
                                
                                <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                                    <span>🕐</span>
                                    <span>Best Time: {day.best_time_to_visit_day}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activities List */}
                    <div className="p-6 space-y-4">
                        {day.activities?.map((activity: Activity, activityIndex: number) => (
                            <div
                                key={activityIndex}
                                className="group bg-background border border-border rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex gap-4 p-4">
                                    {/* Activity Image */}
                                    <div className="w-28 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                                        <Image
                                            src={sanitizeImageUrl(activity.place_image_url)}
                                            alt={activity.place_name}
                                            width={112}
                                            height={112}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>

                                    {/* Activity Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-foreground mb-1 truncate">
                                                    {activity.place_name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                                                    {activity.place_details}
                                                </p>
                                                
                                                {/* Metadata Grid */}
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    {activity.place_address && (
                                                        <div className="flex items-start gap-1.5 text-muted-foreground">
                                                            <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                            <span className="truncate">{activity.place_address}</span>
                                                        </div>
                                                    )}
                                                    {activity.ticket_pricing && (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <span>💰</span>
                                                            <span>{activity.ticket_pricing}</span>
                                                        </div>
                                                    )}
                                                    {activity.time_travel_each_location && (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <span>⏱️</span>
                                                            <span>{activity.time_travel_each_location}</span>
                                                        </div>
                                                    )}
                                                    {activity.best_time_to_visit && (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <span>🕐</span>
                                                            <span>{activity.best_time_to_visit}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => setEditingActivity({ dayIndex, activityIndex, activity })}
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </DialogTrigger>
                                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>Edit Activity</DialogTitle>
                                                    </DialogHeader>
                                                    {editingActivity && (
                                                        <div className="space-y-4 mt-4">
                                                            <div>
                                                                <Label className="text-sm font-medium">Place Name *</Label>
                                                                <Input
                                                                    value={editingActivity.activity.place_name}
                                                                    onChange={(e) => setEditingActivity({
                                                                        ...editingActivity,
                                                                        activity: { ...editingActivity.activity, place_name: e.target.value }
                                                                    })}
                                                                    className="mt-1.5"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-sm font-medium">Place Details</Label>
                                                                <Textarea
                                                                    value={editingActivity.activity.place_details}
                                                                    onChange={(e) => setEditingActivity({
                                                                        ...editingActivity,
                                                                        activity: { ...editingActivity.activity, place_details: e.target.value }
                                                                    })}
                                                                    rows={3}
                                                                    className="mt-1.5"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-sm font-medium">Address</Label>
                                                                <Input
                                                                    value={editingActivity.activity.place_address}
                                                                    onChange={(e) => setEditingActivity({
                                                                        ...editingActivity,
                                                                        activity: { ...editingActivity.activity, place_address: e.target.value }
                                                                    })}
                                                                    className="mt-1.5"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <Label className="text-sm font-medium">Ticket Pricing</Label>
                                                                    <Input
                                                                        value={editingActivity.activity.ticket_pricing}
                                                                        onChange={(e) => setEditingActivity({
                                                                            ...editingActivity,
                                                                            activity: { ...editingActivity.activity, ticket_pricing: e.target.value }
                                                                        })}
                                                                        placeholder="e.g., $20 per person"
                                                                        className="mt-1.5"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-sm font-medium">Duration</Label>
                                                                    <Input
                                                                        value={editingActivity.activity.time_travel_each_location}
                                                                        onChange={(e) => setEditingActivity({
                                                                            ...editingActivity,
                                                                            activity: { ...editingActivity.activity, time_travel_each_location: e.target.value }
                                                                        })}
                                                                        placeholder="e.g., 2 hours"
                                                                        className="mt-1.5"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Label className="text-sm font-medium">Best Time to Visit</Label>
                                                                <Input
                                                                    value={editingActivity.activity.best_time_to_visit}
                                                                    onChange={(e) => setEditingActivity({
                                                                        ...editingActivity,
                                                                        activity: { ...editingActivity.activity, best_time_to_visit: e.target.value }
                                                                    })}
                                                                    placeholder="e.g., Morning 9-11 AM"
                                                                    className="mt-1.5"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-sm font-medium">Image URL</Label>
                                                                <Input
                                                                    value={editingActivity.activity.place_image_url}
                                                                    onChange={(e) => setEditingActivity({
                                                                        ...editingActivity,
                                                                        activity: { ...editingActivity.activity, place_image_url: e.target.value }
                                                                    })}
                                                                    placeholder="https://..."
                                                                    className="mt-1.5"
                                                                />
                                                            </div>
                                                            <div className="flex gap-2 pt-4 border-t">
                                                                <Button onClick={handleUpdateActivity} className="flex-1 shadow-sm">
                                                                    <Save className="h-4 w-4 mr-2" /> Save Changes
                                                                </Button>
                                                                <Button variant="outline" onClick={() => setEditingActivity(null)}>
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </DialogContent>
                                            </Dialog>
                                            
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.place_name)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                                            >
                                                <MapPin className="h-3.5 w-3.5" />
                                            </a>
                                            
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-error hover:text-error hover:bg-error-light"
                                                onClick={() => handleDeleteActivity(dayIndex, activityIndex)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ))}
                    </div>

                    {/* Add Activity Button */}
                    <div className="px-6 pb-6">
                        <Dialog open={addingActivity?.dayIndex === dayIndex} onOpenChange={(open) => !open && setAddingActivity(null)}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-dashed hover:border-primary hover:bg-primary/5 transition-colors"
                                    onClick={() => setAddingActivity({ dayIndex })}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add Activity to Day {day.day}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Add New Activity - Day {day.day}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                    <div>
                                        <Label className="text-sm font-medium">Place Name *</Label>
                                        <Input
                                            value={newActivity.place_name}
                                            onChange={(e) => setNewActivity({ ...newActivity, place_name: e.target.value })}
                                            placeholder="e.g., Eiffel Tower"
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Place Details</Label>
                                        <Textarea
                                            value={newActivity.place_details}
                                            onChange={(e) => setNewActivity({ ...newActivity, place_details: e.target.value })}
                                            rows={3}
                                            placeholder="Describe the activity..."
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Address</Label>
                                        <Input
                                            value={newActivity.place_address}
                                            onChange={(e) => setNewActivity({ ...newActivity, place_address: e.target.value })}
                                            placeholder="Full address"
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-medium">Ticket Pricing</Label>
                                            <Input
                                                value={newActivity.ticket_pricing}
                                                onChange={(e) => setNewActivity({ ...newActivity, ticket_pricing: e.target.value })}
                                                placeholder="e.g., $20 per person"
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">Duration</Label>
                                            <Input
                                                value={newActivity.time_travel_each_location}
                                                onChange={(e) => setNewActivity({ ...newActivity, time_travel_each_location: e.target.value })}
                                                placeholder="e.g., 2 hours"
                                                className="mt-1.5"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Best Time to Visit</Label>
                                        <Input
                                            value={newActivity.best_time_to_visit}
                                            onChange={(e) => setNewActivity({ ...newActivity, best_time_to_visit: e.target.value })}
                                            placeholder="e.g., Morning 9-11 AM"
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Image URL (Optional)</Label>
                                        <Input
                                            value={newActivity.place_image_url}
                                            onChange={(e) => setNewActivity({ ...newActivity, place_image_url: e.target.value })}
                                            placeholder="https://..."
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-4 border-t">
                                        <Button onClick={handleAddActivity} className="flex-1 shadow-sm">
                                            <Plus className="h-4 w-4 mr-2" /> Add Activity
                                        </Button>
                                        <Button variant="outline" onClick={() => setAddingActivity(null)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            ))}
        </div>
    )
}
