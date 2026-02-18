"use client"

import React, { useState, useEffect } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'

interface Props {
    booking: any
    onClose: () => void
}

function EditBookingModal({ booking, onClose }: Props) {
    const [loading, setLoading] = useState(false)
    
    const [title, setTitle] = useState(booking.title || '')
    const [description, setDescription] = useState(booking.description || '')
    const [location, setLocation] = useState(booking.location || '')
    const [confirmationNumber, setConfirmationNumber] = useState(booking.confirmationNumber || '')
    const [phone, setPhone] = useState(booking.phone || '')
    const [email, setEmail] = useState(booking.email || '')
    const [website, setWebsite] = useState(booking.website || '')
    const [notes, setNotes] = useState(booking.notes || '')
    const [sendReminders, setSendReminders] = useState(booking.sendReminders ?? true)

    const updateBooking = useMutation(api.customBookings.updateCustomBooking)

    const handleSave = async () => {
        setLoading(true)
        try {
            await updateBooking({
                bookingId: booking._id,
                title,
                description: description || undefined,
                location: location || undefined,
                confirmationNumber: confirmationNumber || undefined,
                phone: phone || undefined,
                email: email || undefined,
                website: website || undefined,
                notes: notes || undefined,
                sendReminders,
            })
            onClose()
        } catch (error) {
            console.error('Error updating booking:', error)
            alert('Failed to update booking')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Booking</DialogTitle>
                    <DialogDescription>
                        Update your booking details
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Confirmation Number</Label>
                        <Input
                            value={confirmationNumber}
                            onChange={(e) => setConfirmationNumber(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Website</Label>
                            <Input
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="sendReminders" 
                            checked={sendReminders}
                            onCheckedChange={(checked: boolean) => setSendReminders(checked)}
                        />
                        <Label htmlFor="sendReminders">Send reminders for this booking</Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default EditBookingModal
