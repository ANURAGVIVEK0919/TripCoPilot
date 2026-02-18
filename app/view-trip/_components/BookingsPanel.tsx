"use client"

import React, { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
    Plane, 
    Hotel, 
    UtensilsCrossed, 
    Ticket, 
    Car, 
    Calendar,
    Plus,
    Edit,
    Trash2,
    MapPin,
    Clock,
    CheckCircle2,
    XCircle,
    Filter,
    ChevronDown,
    ChevronUp,
    Phone,
    Mail,
    ExternalLink,
    FileText
} from 'lucide-react'
import { Id } from '@/convex/_generated/dataModel'
import AddBookingModal from './AddBookingModal'
import EditBookingModal from './EditBookingModal'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Props {
    tripId: string
    userId: Id<"UserTable">
}

type BookingType = 'flight' | 'hotel' | 'restaurant' | 'tour' | 'transportation' | 'event' | 'other'

function BookingsPanel({ tripId, userId }: Props) {
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingBooking, setEditingBooking] = useState<any>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
    const [filterType, setFilterType] = useState<BookingType | 'all'>('all')
    const [expandedBooking, setExpandedBooking] = useState<string | null>(null)

    // Fetch bookings
    const bookings = useQuery(api.customBookings.getTripBookings, { tripId })
    
    // Mutations
    const deleteBooking = useMutation(api.customBookings.deleteCustomBooking)
    const cancelBooking = useMutation(api.customBookings.cancelBooking)
    const completeBooking = useMutation(api.customBookings.completeBooking)

    // Filter bookings
    const filteredBookings = bookings?.filter(booking => 
        filterType === 'all' || booking.bookingType === filterType
    )

    // Group by date
    const groupedBookings = filteredBookings?.reduce((groups: any, booking: any) => {
        const date = new Date(booking.date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        })
        if (!groups[date]) groups[date] = []
        groups[date].push(booking)
        return groups
    }, {})

    const getBookingIcon = (type: BookingType) => {
        switch (type) {
            case 'flight': return <Plane className="w-5 h-5" />
            case 'hotel': return <Hotel className="w-5 h-5" />
            case 'restaurant': return <UtensilsCrossed className="w-5 h-5" />
            case 'tour': return <Ticket className="w-5 h-5" />
            case 'transportation': return <Car className="w-5 h-5" />
            case 'event': return <Calendar className="w-5 h-5" />
            default: return <FileText className="w-5 h-5" />
        }
    }

    const getBookingColor = (type: BookingType) => {
        switch (type) {
            case 'flight': return 'bg-blue-500'
            case 'hotel': return 'bg-purple-500'
            case 'restaurant': return 'bg-orange-500'
            case 'tour': return 'bg-green-500'
            case 'transportation': return 'bg-yellow-500'
            case 'event': return 'bg-pink-500'
            default: return 'bg-gray-500'
        }
    }

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    }

    const handleDelete = async (bookingId: Id<"CustomBookings">) => {
        await deleteBooking({ bookingId })
        setDeleteConfirm(null)
    }

    const handleComplete = async (bookingId: Id<"CustomBookings">) => {
        await completeBooking({ bookingId })
    }

    if (!bookings) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Bookings & Reservations</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your flights, hotels, restaurants, and activities
                    </p>
                </div>
                <Button 
                    onClick={() => setShowAddModal(true)}
                    className="gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Booking
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                            <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {bookings.filter(b => b.bookingType === 'flight').length}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Flights</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                            <Hotel className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {bookings.filter(b => b.bookingType === 'hotel').length}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Hotels</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
                            <UtensilsCrossed className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {bookings.filter(b => b.bookingType === 'restaurant').length}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Dining</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                            <Ticket className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {bookings.filter(b => b.bookingType === 'tour').length}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Tours</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                    variant={filterType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('all')}
                >
                    All ({bookings.length})
                </Button>
                <Button
                    variant={filterType === 'flight' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('flight')}
                    className="gap-2"
                >
                    <Plane className="w-4 h-4" />
                    Flights
                </Button>
                <Button
                    variant={filterType === 'hotel' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('hotel')}
                    className="gap-2"
                >
                    <Hotel className="w-4 h-4" />
                    Hotels
                </Button>
                <Button
                    variant={filterType === 'restaurant' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('restaurant')}
                    className="gap-2"
                >
                    <UtensilsCrossed className="w-4 h-4" />
                    Dining
                </Button>
                <Button
                    variant={filterType === 'tour' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('tour')}
                    className="gap-2"
                >
                    <Ticket className="w-4 h-4" />
                    Tours
                </Button>
                <Button
                    variant={filterType === 'transportation' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('transportation')}
                    className="gap-2"
                >
                    <Car className="w-4 h-4" />
                    Transport
                </Button>
                <Button
                    variant={filterType === 'event' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('event')}
                    className="gap-2"
                >
                    <Calendar className="w-4 h-4" />
                    Events
                </Button>
            </div>

            {/* Bookings Timeline */}
            {filteredBookings && filteredBookings.length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(groupedBookings || {}).map(([date, dateBookings]: [string, any]) => (
                        <div key={date}>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                {date}
                            </h3>
                            <div className="space-y-3">
                                {dateBookings.map((booking: any) => (
                                    <Card key={booking._id} className="p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className={`${getBookingColor(booking.bookingType)} p-3 rounded-lg text-white shrink-0`}>
                                                {getBookingIcon(booking.bookingType)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-lg">{booking.title}</h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            {formatTime(booking.date)}
                                                            {booking.endDate && ` - ${formatTime(booking.endDate)}`}
                                                        </p>
                                                    </div>

                                                    {/* Status Badges */}
                                                    <div className="flex items-center gap-2">
                                                        {booking.isCompleted && (
                                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                Completed
                                                            </Badge>
                                                        )}
                                                        {booking.isCancelled && (
                                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                Cancelled
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Quick Info */}
                                                <div className="mt-3 space-y-2">
                                                    {booking.location && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                            <MapPin className="w-4 h-4" />
                                                            {booking.location}
                                                        </div>
                                                    )}
                                                    
                                                    {booking.bookingType === 'flight' && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Badge variant="secondary">
                                                                {booking.flightNumber}
                                                            </Badge>
                                                            <span className="text-gray-600 dark:text-gray-400">
                                                                {booking.departureAirport} → {booking.arrivalAirport}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {booking.confirmationNumber && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <FileText className="w-4 h-4 text-gray-400" />
                                                            <span className="text-gray-600 dark:text-gray-400">
                                                                Confirmation: <span className="font-mono">{booking.confirmationNumber}</span>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Expanded Details */}
                                                {expandedBooking === booking._id && (
                                                    <div className="mt-4 pt-4 border-t space-y-3">
                                                        {booking.description && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {booking.description}
                                                            </p>
                                                        )}

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                            {booking.phone && (
                                                                <div className="flex items-center gap-2">
                                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                                    <a href={`tel:${booking.phone}`} className="text-blue-600 hover:underline">
                                                                        {booking.phone}
                                                                    </a>
                                                                </div>
                                                            )}
                                                            {booking.email && (
                                                                <div className="flex items-center gap-2">
                                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                                    <a href={`mailto:${booking.email}`} className="text-blue-600 hover:underline">
                                                                        {booking.email}
                                                                    </a>
                                                                </div>
                                                            )}
                                                            {booking.website && (
                                                                <div className="flex items-center gap-2">
                                                                    <ExternalLink className="w-4 h-4 text-gray-400" />
                                                                    <a href={booking.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                                        Website
                                                                    </a>
                                                                </div>
                                                            )}
                                                            {booking.totalCost && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-gray-400">Cost:</span>
                                                                    <span className="font-semibold">
                                                                        {booking.currency} {booking.totalCost}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {booking.notes && (
                                                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                    <strong>Notes:</strong> {booking.notes}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 mt-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setExpandedBooking(
                                                            expandedBooking === booking._id ? null : booking._id
                                                        )}
                                                    >
                                                        {expandedBooking === booking._id ? (
                                                            <>
                                                                <ChevronUp className="w-4 h-4 mr-1" />
                                                                Show Less
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDown className="w-4 h-4 mr-1" />
                                                                Show More
                                                            </>
                                                        )}
                                                    </Button>

                                                    {!booking.isCompleted && !booking.isCancelled && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setEditingBooking(booking)}
                                                            >
                                                                <Edit className="w-4 h-4 mr-1" />
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleComplete(booking._id)}
                                                            >
                                                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                                                Complete
                                                            </Button>
                                                        </>
                                                    )}

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDeleteConfirm(booking._id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full">
                            <Calendar className="w-12 h-12 text-gray-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Add your flights, hotels, and activities to get automatic reminders
                            </p>
                            <Button onClick={() => setShowAddModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Your First Booking
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Add Booking Modal */}
            {showAddModal && (
                <AddBookingModal
                    tripId={tripId}
                    userId={userId}
                    onClose={() => setShowAddModal(false)}
                />
            )}

            {/* Edit Booking Modal */}
            {editingBooking && (
                <EditBookingModal
                    booking={editingBooking}
                    onClose={() => setEditingBooking(null)}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Booking?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this booking? This action cannot be undone.
                            All reminders for this booking will also be removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => deleteConfirm && handleDelete(deleteConfirm as Id<"CustomBookings">)}
                        >
                            Delete Booking
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default BookingsPanel
