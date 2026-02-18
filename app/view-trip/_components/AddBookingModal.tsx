"use client"

import React, { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Checkbox } from '@/components/ui/checkbox'
import { Id } from '@/convex/_generated/dataModel'
import { Plane, Hotel, UtensilsCrossed, Ticket, Car, Calendar, FileText } from 'lucide-react'

interface Props {
    tripId: string
    userId: Id<"UserTable">
    onClose: () => void
}

type BookingType = 'flight' | 'hotel' | 'restaurant' | 'tour' | 'transportation' | 'event' | 'other'

function AddBookingModal({ tripId, userId, onClose }: Props) {
    const [bookingType, setBookingType] = useState<BookingType>('flight')
    const [loading, setLoading] = useState(false)

    // Common fields
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [endDate, setEndDate] = useState('')
    const [endTime, setEndTime] = useState('')
    const [location, setLocation] = useState('')
    const [confirmationNumber, setConfirmationNumber] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [website, setWebsite] = useState('')
    const [totalCost, setTotalCost] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [notes, setNotes] = useState('')

    // Flight-specific
    const [flightNumber, setFlightNumber] = useState('')
    const [airline, setAirline] = useState('')
    const [departureAirport, setDepartureAirport] = useState('')
    const [arrivalAirport, setArrivalAirport] = useState('')
    const [terminal, setTerminal] = useState('')
    const [gate, setGate] = useState('')
    const [seatNumber, setSeatNumber] = useState('')

    // Hotel-specific
    const [checkInTime, setCheckInTime] = useState('15:00')
    const [checkOutTime, setCheckOutTime] = useState('11:00')
    const [roomType, setRoomType] = useState('')
    const [roomNumber, setRoomNumber] = useState('')

    // Restaurant-specific
    const [reservationTime, setReservationTime] = useState('')
    const [partySize, setPartySize] = useState('')
    const [specialRequests, setSpecialRequests] = useState('')

    // Reminders
    const [sendReminders, setSendReminders] = useState(true)
    const [reminder24h, setReminder24h] = useState(true)
    const [reminder3h, setReminder3h] = useState(true)
    const [reminder2h, setReminder2h] = useState(false)
    const [customReminderHours, setCustomReminderHours] = useState('')

    const createBooking = useMutation(api.customBookings.createCustomBooking)
    const quickAddFlight = useMutation(api.customBookings.quickAddFlight)
    const quickAddHotel = useMutation(api.customBookings.quickAddHotel)
    const quickAddRestaurant = useMutation(api.customBookings.quickAddRestaurant)

    const handleQuickAdd = async () => {
        if (!date || !time) {
            alert('Please fill in required fields')
            return
        }

        setLoading(true)
        try {
            const dateTime = new Date(`${date}T${time}`).getTime()

            if (bookingType === 'flight') {
                await quickAddFlight({
                    tripId,
                    userId,
                    flightNumber: flightNumber || `Flight to ${arrivalAirport}`,
                    airline: airline || 'Airline',
                    departureDate: dateTime,
                    departureAirport,
                    arrivalAirport,
                    confirmationNumber: confirmationNumber || undefined,
                    totalCost: totalCost ? parseFloat(totalCost) : undefined,
                    currency: currency || 'USD',
                })
            } else if (bookingType === 'hotel') {
                await quickAddHotel({
                    tripId,
                    userId,
                    hotelName: title,
                    location,
                    checkInDate: dateTime,
                    checkOutDate: endDate && endTime ? new Date(`${endDate}T${endTime}`).getTime() : dateTime + (24 * 60 * 60 * 1000),
                    checkInTime: checkInTime || '15:00',
                    checkOutTime: checkOutTime || '11:00',
                    confirmationNumber: confirmationNumber || undefined,
                    totalCost: totalCost ? parseFloat(totalCost) : undefined,
                    currency: currency || 'USD',
                    phone: phone || undefined,
                })
            } else if (bookingType === 'restaurant') {
                await quickAddRestaurant({
                    tripId,
                    userId,
                    restaurantName: title,
                    location,
                    reservationDate: dateTime,
                    reservationTime: reservationTime || time,
                    partySize: partySize ? parseInt(partySize) : 2,
                    confirmationNumber: confirmationNumber || undefined,
                    phone: phone || undefined,
                    specialRequests: specialRequests || undefined,
                })
            }

            onClose()
        } catch (error) {
            console.error('Error creating booking:', error)
            alert('Failed to create booking')
        } finally {
            setLoading(false)
        }
    }

    const handleFullAdd = async () => {
        if (!title || !date || !time) {
            alert('Please fill in required fields')
            return
        }

        setLoading(true)
        try {
            const dateTime = new Date(`${date}T${time}`).getTime()
            const endDateTime = endDate && endTime ? new Date(`${endDate}T${endTime}`).getTime() : undefined

            // Build reminder times array
            const reminderTimes = []
            if (reminder24h) reminderTimes.push(24)
            if (reminder3h) reminderTimes.push(3)
            if (reminder2h) reminderTimes.push(2)
            if (customReminderHours) reminderTimes.push(parseInt(customReminderHours))

            await createBooking({
                tripId,
                userId,
                bookingType,
                title,
                description: description || undefined,
                date: dateTime,
                endDate: endDateTime,
                location: location || undefined,
                confirmationNumber: confirmationNumber || undefined,
                phone: phone || undefined,
                email: email || undefined,
                website: website || undefined,
                
                // Flight fields
                flightNumber: bookingType === 'flight' ? flightNumber || undefined : undefined,
                airline: bookingType === 'flight' ? airline || undefined : undefined,
                departureAirport: bookingType === 'flight' ? departureAirport || undefined : undefined,
                arrivalAirport: bookingType === 'flight' ? arrivalAirport || undefined : undefined,
                terminal: bookingType === 'flight' ? terminal || undefined : undefined,
                gate: bookingType === 'flight' ? gate || undefined : undefined,
                seatNumber: bookingType === 'flight' ? seatNumber || undefined : undefined,
                
                // Hotel fields
                checkInTime: bookingType === 'hotel' ? checkInTime || undefined : undefined,
                checkOutTime: bookingType === 'hotel' ? checkOutTime || undefined : undefined,
                roomType: bookingType === 'hotel' ? roomType || undefined : undefined,
                roomNumber: bookingType === 'hotel' ? roomNumber || undefined : undefined,
                
                // Restaurant fields
                reservationTime: bookingType === 'restaurant' ? reservationTime || time : undefined,
                partySize: bookingType === 'restaurant' && partySize ? parseInt(partySize) : undefined,
                specialRequests: bookingType === 'restaurant' ? specialRequests || undefined : undefined,
                
                // Financial
                totalCost: totalCost ? parseFloat(totalCost) : undefined,
                currency: currency || 'USD',
                
                // Reminders
                sendReminders,
                reminderTimes: reminderTimes.length > 0 ? reminderTimes : undefined,
                
                // Notes
                notes: notes || undefined,
                
                // Provider name
                providerName: bookingType === 'hotel' ? title : (airline || undefined),
                
                // From/To locations for flights
                fromLocation: bookingType === 'flight' ? departureAirport : undefined,
                toLocation: bookingType === 'flight' ? arrivalAirport : undefined,
            })

            onClose()
        } catch (error) {
            console.error('Error creating booking:', error)
            alert('Failed to create booking')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Booking</DialogTitle>
                    <DialogDescription>
                        Add your flight, hotel, restaurant, or activity booking to get automatic reminders
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="quick" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="quick">Quick Add</TabsTrigger>
                        <TabsTrigger value="full">Full Details</TabsTrigger>
                    </TabsList>

                    {/* Quick Add Tab */}
                    <TabsContent value="quick" className="space-y-4">
                        {/* Booking Type */}
                        <div className="space-y-2">
                            <Label>Booking Type *</Label>
                            <Select value={bookingType} onValueChange={(value: BookingType) => setBookingType(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="flight">✈️ Flight</SelectItem>
                                    <SelectItem value="hotel">🏨 Hotel</SelectItem>
                                    <SelectItem value="restaurant">🍽️ Restaurant</SelectItem>
                                    <SelectItem value="tour">🎭 Tour/Activity</SelectItem>
                                    <SelectItem value="transportation">🚗 Transportation</SelectItem>
                                    <SelectItem value="event">📅 Event</SelectItem>
                                    <SelectItem value="other">📝 Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Flight Quick Add */}
                        {bookingType === 'flight' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Flight Number</Label>
                                        <Input
                                            placeholder="AA123"
                                            value={flightNumber}
                                            onChange={(e) => setFlightNumber(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Airline</Label>
                                        <Input
                                            placeholder="American Airlines"
                                            value={airline}
                                            onChange={(e) => setAirline(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>From Airport *</Label>
                                        <Input
                                            placeholder="JFK"
                                            value={departureAirport}
                                            onChange={(e) => setDepartureAirport(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>To Airport *</Label>
                                        <Input
                                            placeholder="LAX"
                                            value={arrivalAirport}
                                            onChange={(e) => setArrivalAirport(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Hotel Quick Add */}
                        {bookingType === 'hotel' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Hotel Name *</Label>
                                    <Input
                                        placeholder="Grand Hotel"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Address *</Label>
                                    <Input
                                        placeholder="123 Main St, Paris"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Check-in Time</Label>
                                        <Input
                                            type="time"
                                            value={checkInTime}
                                            onChange={(e) => setCheckInTime(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Check-out Time</Label>
                                        <Input
                                            type="time"
                                            value={checkOutTime}
                                            onChange={(e) => setCheckOutTime(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Restaurant Quick Add */}
                        {bookingType === 'restaurant' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Restaurant Name *</Label>
                                    <Input
                                        placeholder="Le Jules Verne"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Address *</Label>
                                    <Input
                                        placeholder="Eiffel Tower, Paris"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Party Size</Label>
                                        <Input
                                            type="number"
                                            placeholder="2"
                                            value={partySize}
                                            onChange={(e) => setPartySize(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input
                                            placeholder="+33 1 45 55 61 44"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Common Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date *</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Time *</Label>
                                <Input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                />
                            </div>
                        </div>

                        {bookingType === 'hotel' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Check-out Date</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Check-out Time</Label>
                                    <Input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Confirmation Number</Label>
                            <Input
                                placeholder="ABC123XYZ"
                                value={confirmationNumber}
                                onChange={(e) => setConfirmationNumber(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Total Cost</Label>
                                <Input
                                    type="number"
                                    placeholder="150.00"
                                    value={totalCost}
                                    onChange={(e) => setTotalCost(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Select value={currency} onValueChange={setCurrency}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD $</SelectItem>
                                        <SelectItem value="EUR">EUR €</SelectItem>
                                        <SelectItem value="GBP">GBP £</SelectItem>
                                        <SelectItem value="JPY">JPY ¥</SelectItem>
                                        <SelectItem value="INR">INR ₹</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button onClick={handleQuickAdd} disabled={loading}>
                                {loading ? 'Adding...' : 'Add Booking'}
                            </Button>
                        </DialogFooter>
                    </TabsContent>

                    {/* Full Details Tab */}
                    <TabsContent value="full" className="space-y-4">
                        {/* Full form with all fields - Similar structure but with all fields enabled */}
                        <div className="space-y-2">
                            <Label>Booking Type *</Label>
                            <Select value={bookingType} onValueChange={(value: BookingType) => setBookingType(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="flight">✈️ Flight</SelectItem>
                                    <SelectItem value="hotel">🏨 Hotel</SelectItem>
                                    <SelectItem value="restaurant">🍽️ Restaurant</SelectItem>
                                    <SelectItem value="tour">🎭 Tour/Activity</SelectItem>
                                    <SelectItem value="transportation">🚗 Transportation</SelectItem>
                                    <SelectItem value="event">📅 Event</SelectItem>
                                    <SelectItem value="other">📝 Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                                placeholder="Flight to Paris"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                placeholder="Additional details..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date *</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Time *</Label>
                                <Input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Input
                                placeholder="Address or venue"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Confirmation Number</Label>
                            <Input
                                placeholder="ABC123"
                                value={confirmationNumber}
                                onChange={(e) => setConfirmationNumber(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    placeholder="+1 234 567 8900"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    placeholder="contact@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Website</Label>
                                <Input
                                    placeholder="https://..."
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Type-specific fields */}
                        {bookingType === 'flight' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Flight Number</Label>
                                        <Input value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Airline</Label>
                                        <Input value={airline} onChange={(e) => setAirline(e.target.value)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Departure Airport</Label>
                                        <Input value={departureAirport} onChange={(e) => setDepartureAirport(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Arrival Airport</Label>
                                        <Input value={arrivalAirport} onChange={(e) => setArrivalAirport(e.target.value)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Terminal</Label>
                                        <Input value={terminal} onChange={(e) => setTerminal(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Gate</Label>
                                        <Input value={gate} onChange={(e) => setGate(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Seat</Label>
                                        <Input value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Reminder Settings */}
                        <div className="space-y-3 border-t pt-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="sendReminders" 
                                    checked={sendReminders}
                                    onCheckedChange={(checked: boolean) => setSendReminders(checked)}
                                />
                                <Label htmlFor="sendReminders">Send reminders for this booking</Label>
                            </div>

                            {sendReminders && (
                                <div className="ml-6 space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id="reminder24h"
                                            checked={reminder24h}
                                            onCheckedChange={(checked: boolean) => setReminder24h(checked)}
                                        />
                                        <Label htmlFor="reminder24h">24 hours before</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id="reminder3h"
                                            checked={reminder3h}
                                            onCheckedChange={(checked: boolean) => setReminder3h(checked)}
                                        />
                                        <Label htmlFor="reminder3h">3 hours before</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id="reminder2h"
                                            checked={reminder2h}
                                            onCheckedChange={(checked: boolean) => setReminder2h(checked)}
                                        />
                                        <Label htmlFor="reminder2h">2 hours before</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Input 
                                            type="number"
                                            placeholder="Custom hours"
                                            className="w-32"
                                            value={customReminderHours}
                                            onChange={(e) => setCustomReminderHours(e.target.value)}
                                        />
                                        <Label>hours before</Label>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                placeholder="Personal notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button onClick={handleFullAdd} disabled={loading}>
                                {loading ? 'Adding...' : 'Add Booking'}
                            </Button>
                        </DialogFooter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

export default AddBookingModal
