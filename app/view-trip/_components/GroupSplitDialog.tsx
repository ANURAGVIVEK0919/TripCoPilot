"use client"

import React, { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Users, DollarSign, Percent, Check, X } from 'lucide-react'
import { Id } from '@/convex/_generated/dataModel'

interface GroupSplitDialogProps {
    isOpen: boolean
    onClose: () => void
    tripId: string
    totalAmount: number
    currency: string
    onSplitConfirm: (data: {
        splitType: 'equal' | 'custom' | 'none'
        participants: Id<"UserTable">[]
        customSplit?: { userId: Id<"UserTable">; amount: number }[]
    }) => void
}

export default function GroupSplitDialog({
    isOpen,
    onClose,
    tripId,
    totalAmount,
    currency,
    onSplitConfirm,
}: GroupSplitDialogProps) {
    const [splitType, setSplitType] = useState<'none' | 'equal' | 'custom'>('none')
    const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set())
    const [customAmounts, setCustomAmounts] = useState<{ [key: string]: string }>({})

    // Get trip collaborators
    const collaborators = useQuery(api.tripSharing.getCollaborators, { tripId })

    const toggleParticipant = (userId: string) => {
        const newSet = new Set(selectedParticipants)
        if (newSet.has(userId)) {
            newSet.delete(userId)
        } else {
            newSet.add(userId)
        }
        setSelectedParticipants(newSet)
    }

    const updateCustomAmount = (userId: string, amount: string) => {
        setCustomAmounts({
            ...customAmounts,
            [userId]: amount,
        })
    }

    const calculateSplitPreview = () => {
        const participants = Array.from(selectedParticipants)

        if (splitType === 'equal' && participants.length > 0) {
            const amountPerPerson = totalAmount / participants.length
            return participants.map(userId => ({
                userId,
                amount: amountPerPerson,
            }))
        }

        if (splitType === 'custom') {
            return participants.map(userId => ({
                userId,
                amount: parseFloat(customAmounts[userId] || '0'),
            }))
        }

        return []
    }

    const getTotalCustom = () => {
        return Object.values(customAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
    }

    const handleConfirm = () => {
        const participants = Array.from(selectedParticipants) as Id<"UserTable">[]

        if (splitType === 'none') {
            onSplitConfirm({ splitType: 'none', participants: [] })
        } else if (splitType === 'equal') {
            onSplitConfirm({ splitType: 'equal', participants })
        } else if (splitType === 'custom') {
            const customSplit = participants.map(userId => ({
                userId,
                amount: parseFloat(customAmounts[userId] || '0'),
            }))
            onSplitConfirm({ splitType: 'custom', participants, customSplit })
        }

        onClose()
    }

    const splitPreview = calculateSplitPreview()
    const totalCustom = getTotalCustom()
    const isCustomValid = splitType === 'custom' ? Math.abs(totalCustom - totalAmount) < 0.01 : true

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount)
    }

    if (!collaborators || collaborators.length <= 1) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Split Expense</DialogTitle>
                        <DialogDescription>
                            No collaborators found for this trip
                        </DialogDescription>
                    </DialogHeader>
                    <div className="text-center py-8">
                        <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-2">
                            This trip doesn't have any collaborators yet
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            Invite friends to split expenses with them
                        </p>
                        <Button onClick={onClose}>Got it</Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Split Expense</DialogTitle>
                    <DialogDescription>
                        Choose how to split {formatCurrency(totalAmount)} among participants
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Split Type Selection */}
                    <div>
                        <Label className="mb-3 block">Split Method</Label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setSplitType('none')}
                                className={`p-4 rounded-lg border-2 text-center transition-all ${
                                    splitType === 'none'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <X className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                                <p className="text-sm font-medium">No Split</p>
                                <p className="text-xs text-gray-500 mt-1">Personal expense</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSplitType('equal')}
                                className={`p-4 rounded-lg border-2 text-center transition-all ${
                                    splitType === 'equal'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                                <p className="text-sm font-medium">Split Equally</p>
                                <p className="text-xs text-gray-500 mt-1">Same amount each</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSplitType('custom')}
                                className={`p-4 rounded-lg border-2 text-center transition-all ${
                                    splitType === 'custom'
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <Percent className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                                <p className="text-sm font-medium">Custom Split</p>
                                <p className="text-xs text-gray-500 mt-1">Different amounts</p>
                            </button>
                        </div>
                    </div>

                    {/* Participant Selection */}
                    {splitType !== 'none' && (
                        <div>
                            <Label className="mb-3 block">Select Participants</Label>
                            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                                {collaborators.map((collab) => (
                                    <div
                                        key={collab.userId}
                                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                            selectedParticipants.has(collab.userId)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        onClick={() => toggleParticipant(collab.userId)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={collab.userImage}
                                                alt={collab.userName}
                                                className="w-10 h-10 rounded-full border-2 border-white shadow"
                                            />
                                            <div>
                                                <p className="font-medium">{collab.userName}</p>
                                                <p className="text-xs text-gray-500">{collab.userEmail}</p>
                                            </div>
                                        </div>

                                        {splitType === 'custom' && selectedParticipants.has(collab.userId) && (
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <DollarSign className="w-4 h-4 text-gray-500" />
                                                <Input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={customAmounts[collab.userId] || ''}
                                                    onChange={(e) => updateCustomAmount(collab.userId, e.target.value)}
                                                    className="w-24"
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </div>
                                        )}

                                        {selectedParticipants.has(collab.userId) && (
                                            <Check className="w-5 h-5 text-blue-600" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                {selectedParticipants.size} participant(s) selected
                            </p>
                        </div>
                    )}

                    {/* Split Preview */}
                    {splitType !== 'none' && selectedParticipants.size > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4 border">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium">Split Preview</h4>
                                {splitType === 'custom' && (
                                    <span className={`text-sm font-semibold ${
                                        isCustomValid ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {formatCurrency(totalCustom)} / {formatCurrency(totalAmount)}
                                    </span>
                                )}
                            </div>

                            {!isCustomValid && splitType === 'custom' && (
                                <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                                    <p className="text-xs text-red-800">
                                        ⚠️ Custom amounts must equal total: {formatCurrency(totalAmount)}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                {splitPreview.map((split) => {
                                    const participant = collaborators.find(c => c.userId === split.userId)
                                    return (
                                        <div
                                            key={split.userId}
                                            className="flex items-center justify-between text-sm bg-white rounded p-2"
                                        >
                                            <span className="font-medium">{participant?.userName}</span>
                                            <span className="text-blue-600 font-semibold">
                                                {formatCurrency(split.amount)}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={
                                splitType !== 'none' &&
                                (selectedParticipants.size === 0 || !isCustomValid)
                            }
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Confirm Split
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
