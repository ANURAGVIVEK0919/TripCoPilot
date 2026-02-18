"use client"

import React, { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { 
    HandCoins, 
    ArrowRight, 
    Check, 
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Users,
} from 'lucide-react'
import { useUserDetail } from '@/app/provider'
import { Id } from '@/convex/_generated/dataModel'

interface SettlementTrackerProps {
    tripId: string
    currency?: string
}

export default function SettlementTracker({ tripId, currency = 'USD' }: SettlementTrackerProps) {
    const { userDetail } = useUserDetail()
    const [selectedSettlement, setSelectedSettlement] = useState<any>(null)
    const [notes, setNotes] = useState('')
    const [isMarkingPaid, setIsMarkingPaid] = useState(false)

    // Queries
    const userDebts = useQuery(
        api.expenses.getUserDebts,
        userDetail?._id ? { tripId, userId: userDetail._id } : 'skip'
    )
    const userCredits = useQuery(
        api.expenses.getUserCredits,
        userDetail?._id ? { tripId, userId: userDetail._id } : 'skip'
    )
    const simplifiedDebts = useQuery(api.expenses.getSimplifiedDebts, { tripId })

    // Mutation
    const markSettlementPaid = useMutation(api.expenses.markSettlementPaid)

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount)
    }

    const handleMarkPaid = async () => {
        if (!selectedSettlement) return

        setIsMarkingPaid(true)
        try {
            await markSettlementPaid({
                settlementId: selectedSettlement._id,
                notes: notes || undefined,
            })

            setSelectedSettlement(null)
            setNotes('')
            alert('✅ Settlement marked as paid!')
        } catch (error) {
            console.error('Error marking settlement:', error)
            alert('Failed to mark settlement as paid')
        } finally {
            setIsMarkingPaid(false)
        }
    }

    const totalDebt = userDebts?.reduce((sum, debt) => sum + debt.amount, 0) || 0
    const totalCredit = userCredits?.reduce((sum, credit) => sum + credit.amount, 0) || 0
    const netBalance = totalCredit - totalDebt

    return (
        <div className="space-y-6">
            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-red-100 text-sm font-medium">You Owe</span>
                        <TrendingDown className="w-5 h-5 text-red-100" />
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(totalDebt)}</p>
                    <p className="text-red-100 text-xs mt-1">
                        {userDebts?.length || 0} settlement(s)
                    </p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-green-100 text-sm font-medium">You're Owed</span>
                        <TrendingUp className="w-5 h-5 text-green-100" />
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(totalCredit)}</p>
                    <p className="text-green-100 text-xs mt-1">
                        {userCredits?.length || 0} settlement(s)
                    </p>
                </div>

                <div className={`rounded-xl p-6 shadow-lg ${
                    netBalance >= 0
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                        : 'bg-gradient-to-br from-orange-500 to-orange-600'
                } text-white`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-100 text-sm font-medium">Net Balance</span>
                        <HandCoins className="w-5 h-5 text-blue-100" />
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(Math.abs(netBalance))}</p>
                    <p className="text-blue-100 text-xs mt-1">
                        {netBalance >= 0 ? 'In your favor' : 'Need to pay'}
                    </p>
                </div>
            </div>

            {/* What You Owe */}
            {userDebts && userDebts.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-md border">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <h3 className="text-lg font-semibold">What You Owe</h3>
                    </div>

                    <div className="space-y-3">
                        {userDebts.map((debt) => (
                            <div
                                key={debt._id}
                                className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-100 p-2 rounded-full">
                                        <ArrowRight className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Pay {debt.toUserName}</p>
                                        <p className="text-xs text-gray-600">Settlement pending</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-red-600">
                                        {formatCurrency(debt.amount)}
                                    </span>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setSelectedSettlement(debt)}
                                            >
                                                <Check className="w-4 h-4 mr-1" />
                                                Mark Paid
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Confirm Payment</DialogTitle>
                                                <DialogDescription>
                                                    Mark this settlement as paid
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-4 mt-4">
                                                <div className="bg-gray-50 rounded-lg p-4 border">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-gray-600">Amount</span>
                                                        <span className="font-bold text-lg">
                                                            {formatCurrency(debt.amount)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-600">To</span>
                                                        <span className="font-medium">{debt.toUserName}</span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium mb-2 block">
                                                        Payment Notes (Optional)
                                                    </label>
                                                    <Input
                                                        placeholder="e.g., Paid via Venmo, Cash"
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                    />
                                                </div>

                                                <Button
                                                    onClick={handleMarkPaid}
                                                    disabled={isMarkingPaid}
                                                    className="w-full bg-green-600 hover:bg-green-700"
                                                >
                                                    <Check className="w-4 h-4 mr-2" />
                                                    {isMarkingPaid ? 'Processing...' : 'Confirm Payment'}
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* What You're Owed */}
            {userCredits && userCredits.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-md border">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold">What You're Owed</h3>
                    </div>

                    <div className="space-y-3">
                        {userCredits.map((credit) => (
                            <div
                                key={credit._id}
                                className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-2 rounded-full">
                                        <ArrowRight className="w-4 h-4 text-green-600 rotate-180" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{credit.fromUserName} owes you</p>
                                        <p className="text-xs text-gray-600">Waiting for payment</p>
                                    </div>
                                </div>

                                <span className="text-lg font-bold text-green-600">
                                    {formatCurrency(credit.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Simplified Settlements */}
            {simplifiedDebts && simplifiedDebts.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-md border">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">Simplified Settlements</h3>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                        Optimized payment plan to settle all debts with minimum transactions
                    </p>

                    <div className="space-y-3">
                        {simplifiedDebts.map((debt, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <span className="font-medium">{debt.fromName}</span>
                                    <ArrowRight className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium">{debt.toName}</span>
                                </div>

                                <span className="text-lg font-bold text-blue-600">
                                    {formatCurrency(debt.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {(!userDebts || userDebts.length === 0) &&
             (!userCredits || userCredits.length === 0) && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                    <HandCoins className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">All Settled Up! 🎉</p>
                    <p className="text-sm text-gray-400">
                        No pending settlements for this trip
                    </p>
                </div>
            )}
        </div>
    )
}
