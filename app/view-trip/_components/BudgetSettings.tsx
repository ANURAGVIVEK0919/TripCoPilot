"use client"

import React, { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
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
    DialogTrigger,
} from "@/components/ui/dialog"
import { Settings, Save, DollarSign } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { Id } from '@/convex/_generated/dataModel'
import { useUserDetail } from '@/app/provider'

interface BudgetSettingsProps {
    tripId: string
}

const CURRENCIES = [
    'USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'MXN',
    'BRL', 'ZAR', 'SGD', 'NZD', 'KRW', 'THB', 'AED', 'SAR'
]

const CATEGORIES = [
    { key: 'accommodation', label: 'Accommodation', icon: '🏨' },
    { key: 'food', label: 'Food & Dining', icon: '🍽️' },
    { key: 'transport', label: 'Transport', icon: '🚗' },
    { key: 'activities', label: 'Activities', icon: '🎭' },
    { key: 'shopping', label: 'Shopping', icon: '🛍️' },
    { key: 'other', label: 'Other', icon: '📦' },
]

export default function BudgetSettings({ tripId }: BudgetSettingsProps) {
    const { user } = useUser()
    const { userDetail } = useUserDetail()
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [totalBudget, setTotalBudget] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [alertThreshold, setAlertThreshold] = useState('80')
    const [categoryBudgets, setCategoryBudgets] = useState({
        accommodation: '',
        food: '',
        transport: '',
        activities: '',
        shopping: '',
        other: '',
    })

    // Query existing budget
    const existingBudget = useQuery(api.expenses.getTripBudget, { tripId })
    
    // Mutation
    const setTripBudget = useMutation(api.expenses.setTripBudget)

    // Load existing budget data
    useEffect(() => {
        if (existingBudget) {
            setTotalBudget(existingBudget.totalBudget.toString())
            setCurrency(existingBudget.currency)
            setAlertThreshold((existingBudget.alertThreshold ?? 80).toString())
            
            if (existingBudget.categoryBudgets) {
                setCategoryBudgets({
                    accommodation: existingBudget.categoryBudgets.accommodation?.toString() || '',
                    food: existingBudget.categoryBudgets.food?.toString() || '',
                    transport: existingBudget.categoryBudgets.transport?.toString() || '',
                    activities: existingBudget.categoryBudgets.activities?.toString() || '',
                    shopping: existingBudget.categoryBudgets.shopping?.toString() || '',
                    other: existingBudget.categoryBudgets.other?.toString() || '',
                })
            }
        }
    }, [existingBudget])

    const handleSave = async () => {
        if (!userDetail?._id || !totalBudget || parseFloat(totalBudget) <= 0) {
            alert('Please enter a valid total budget')
            return
        }

        setIsLoading(true)

        try {
            // Parse category budgets
            const parsedCategoryBudgets = {
                accommodation: categoryBudgets.accommodation ? parseFloat(categoryBudgets.accommodation) : undefined,
                food: categoryBudgets.food ? parseFloat(categoryBudgets.food) : undefined,
                transport: categoryBudgets.transport ? parseFloat(categoryBudgets.transport) : undefined,
                activities: categoryBudgets.activities ? parseFloat(categoryBudgets.activities) : undefined,
                shopping: categoryBudgets.shopping ? parseFloat(categoryBudgets.shopping) : undefined,
                other: categoryBudgets.other ? parseFloat(categoryBudgets.other) : undefined,
            }

            await setTripBudget({
                tripId,
                totalBudget: parseFloat(totalBudget),
                currency,
                categoryBudgets: parsedCategoryBudgets,
                alertThreshold: parseFloat(alertThreshold),
                userId: userDetail._id,
            })

            setIsOpen(false)
            alert('Budget settings saved successfully!')
        } catch (error) {
            console.error('Error saving budget:', error)
            alert('Failed to save budget settings')
        } finally {
            setIsLoading(false)
        }
    }

    const getTotalCategoryBudget = () => {
        return Object.values(categoryBudgets).reduce((sum, val) => {
            return sum + (val ? parseFloat(val) : 0)
        }, 0)
    }

    const categoryTotal = getTotalCategoryBudget()
    const totalBudgetNum = parseFloat(totalBudget) || 0
    const isOverAllocated = categoryTotal > totalBudgetNum

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Settings className="w-4 h-4" />
                    {existingBudget ? 'Update Budget' : 'Set Budget'}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Budget Settings</DialogTitle>
                    <DialogDescription>
                        Set your trip budget and allocate amounts to different categories
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Total Budget */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <Label>Total Trip Budget *</Label>
                            <Input
                                type="number"
                                placeholder="5000"
                                value={totalBudget}
                                onChange={(e) => setTotalBudget(e.target.value)}
                                step="100"
                                min="0"
                            />
                        </div>
                        <div>
                            <Label>Currency</Label>
                            <select
                                className="w-full px-3 py-2 border rounded-md"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                            >
                                {CURRENCIES.map(curr => (
                                    <option key={curr} value={curr}>{curr}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Alert Threshold */}
                    <div>
                        <Label>Budget Alert Threshold (%)</Label>
                        <Input
                            type="number"
                            placeholder="80"
                            value={alertThreshold}
                            onChange={(e) => setAlertThreshold(e.target.value)}
                            min="0"
                            max="100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            You'll be alerted when you reach this percentage of your budget
                        </p>
                    </div>

                    {/* Category Budgets */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <Label>Category Budgets (Optional)</Label>
                            {totalBudgetNum > 0 && (
                                <span className={`text-sm ${
                                    isOverAllocated ? 'text-red-600 font-semibold' : 'text-gray-600'
                                }`}>
                                    Allocated: {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: currency,
                                    }).format(categoryTotal)} / {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: currency,
                                    }).format(totalBudgetNum)}
                                </span>
                            )}
                        </div>

                        {isOverAllocated && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                                <p className="text-sm text-red-800">
                                    ⚠️ Warning: Category budgets exceed total budget by{' '}
                                    {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: currency,
                                    }).format(categoryTotal - totalBudgetNum)}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            {CATEGORIES.map(cat => (
                                <div key={cat.key} className="space-y-1">
                                    <Label className="text-sm">
                                        {cat.icon} {cat.label}
                                    </Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={categoryBudgets[cat.key as keyof typeof categoryBudgets]}
                                        onChange={(e) => setCategoryBudgets({
                                            ...categoryBudgets,
                                            [cat.key]: e.target.value
                                        })}
                                        step="10"
                                        min="0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading || !totalBudget}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isLoading ? 'Saving...' : 'Save Budget'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
