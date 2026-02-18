"use client"

import React, { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { 
    Plus, 
    DollarSign, 
    TrendingUp, 
    TrendingDown,
    Receipt,
    Upload,
    X,
    Calendar,
    MapPin,
    Users,
    Edit,
    Trash2,
    CheckCircle,
    AlertCircle,
    Camera,
    Scan,
} from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import { Id } from '@/convex/_generated/dataModel'
import ReceiptScanner from './ReceiptScanner'
import GroupSplitDialog from './GroupSplitDialog'
import { useUserDetail } from '@/app/provider'

interface ExpenseTrackerProps {
    tripId: string
    tripCurrency?: string
}

const CATEGORIES = [
    { value: 'accommodation', label: '🏨 Accommodation', color: 'bg-blue-500' },
    { value: 'food', label: '🍽️ Food & Dining', color: 'bg-green-500' },
    { value: 'transport', label: '🚗 Transport', color: 'bg-yellow-500' },
    { value: 'activities', label: '🎭 Activities', color: 'bg-purple-500' },
    { value: 'shopping', label: '🛍️ Shopping', color: 'bg-pink-500' },
    { value: 'other', label: '📦 Other', color: 'bg-gray-500' },
] as const

const CURRENCIES = [
    'USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'MXN', 
    'BRL', 'ZAR', 'SGD', 'NZD', 'KRW', 'THB', 'AED', 'SAR'
]

export default function ExpenseTracker({ tripId, tripCurrency = 'USD' }: ExpenseTrackerProps) {
    const { user } = useUser()
    const { userDetail } = useUserDetail()
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState(false)
    const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false)

    // Form state
    const [amount, setAmount] = useState('')
    const [currency, setCurrency] = useState(tripCurrency)
    const [category, setCategory] = useState<typeof CATEGORIES[number]['value']>('food')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [location, setLocation] = useState('')
    const [splitType, setSplitType] = useState<'none' | 'equal' | 'custom'>('none')
    const [participants, setParticipants] = useState<Id<"UserTable">[]>([])
    const [customSplit, setCustomSplit] = useState<{ userId: Id<"UserTable">; amount: number }[]>([])
    const [receiptFile, setReceiptFile] = useState<File | null>(null)
    const [receiptUrl, setReceiptUrl] = useState('')

    // Queries
    const expenses = useQuery(api.expenses.getTripExpenses, { tripId })
    const budgetSummary = useQuery(api.expenses.getBudgetSummary, { tripId })
    const statistics = useQuery(api.expenses.getExpenseStatistics, { tripId })

    // Mutations
    const addExpense = useMutation(api.expenses.addExpense)
    const deleteExpense = useMutation(api.expenses.deleteExpense)

    const handleReceiptExtracted = (data: { amount: number | null; description: string; date: string }) => {
        if (data.amount) setAmount(data.amount.toString())
        if (data.description) setDescription(data.description)
        if (data.date) setDate(data.date)
        setIsReceiptScannerOpen(false)
        setIsAddExpenseOpen(true)
    }

    const handleSplitConfirm = (data: {
        splitType: 'equal' | 'custom' | 'none'
        participants: Id<"UserTable">[]
        customSplit?: { userId: Id<"UserTable">; amount: number }[]
    }) => {
        setSplitType(data.splitType)
        setParticipants(data.participants)
        if (data.customSplit) {
            setCustomSplit(data.customSplit)
        }
    }

    const handleAddExpense = async () => {
        if (!user || !userDetail || !amount || parseFloat(amount) <= 0) {
            alert('Please fill in all required fields')
            return
        }

        setIsLoading(true)

        try {
            let convertedAmount = parseFloat(amount)

            // Convert to trip currency if different
            if (currency !== tripCurrency) {
                const conversionResponse = await axios.post('/api/currency', {
                    amount: parseFloat(amount),
                    from: currency,
                    to: tripCurrency,
                })

                if (conversionResponse.data.success) {
                    convertedAmount = conversionResponse.data.convertedAmount
                }
            }

            // Upload receipt if provided
            let uploadedReceiptUrl = receiptUrl
            if (receiptFile) {
                // TODO: Implement receipt upload using Uploadthing
                // For now, we'll skip this
                console.log('Receipt upload not yet implemented')
            }

            // Prepare participants list (include payer)
            const allParticipants = splitType === 'none' 
                ? [userDetail._id]
                : Array.from(new Set([...participants, userDetail._id]))

            await addExpense({
                tripId,
                userId: userDetail._id,
                userName: user.fullName || user.firstName || 'Anonymous',
                userImage: user.imageUrl,
                amount: parseFloat(amount),
                currency,
                convertedAmount,
                category,
                description,
                date: new Date(date).getTime(),
                location: location || undefined,
                receiptUrl: uploadedReceiptUrl || undefined,
                paidBy: userDetail._id,
                splitType,
                participants: allParticipants,
                customSplit: splitType === 'custom' ? customSplit : undefined,
            })

            // Reset form
            setAmount('')
            setDescription('')
            setLocation('')
            setReceiptFile(null)
            setReceiptUrl('')
            setSplitType('none')
            setParticipants([])
            setCustomSplit([])
            setIsAddExpenseOpen(false)

            alert('Expense added successfully!')
        } catch (error) {
            console.error('Error adding expense:', error)
            alert('Failed to add expense')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteExpense = async (expenseId: Id<"TripExpenses">) => {
        if (!user || !confirm('Are you sure you want to delete this expense?')) return

        try {
            await deleteExpense({
                expenseId,
                userId: user.id as Id<"UserTable">,
            })
        } catch (error) {
            console.error('Error deleting expense:', error)
            alert('Failed to delete expense')
        }
    }

    const formatCurrency = (amount: number, curr: string = tripCurrency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: curr,
        }).format(amount)
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    return (
        <div className="space-y-6">
            {/* Budget Overview */}
            {budgetSummary && (
                <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-semibold text-foreground mb-1">Budget Overview</h3>
                            <p className="text-sm text-muted-foreground">
                                {formatCurrency(budgetSummary.totalSpent)} of {formatCurrency(budgetSummary.budget)} spent
                            </p>
                        </div>
                        <div className={`text-2xl font-bold ${
                            budgetSummary.remainingBudget >= 0 ? 'text-success' : 'text-error'
                        }`}>
                            {budgetSummary.percentageUsed.toFixed(0)}%
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${
                                    budgetSummary.percentageUsed > 100 ? 'bg-error' :
                                    budgetSummary.percentageUsed > 80 ? 'bg-warning' :
                                    'bg-success'
                                }`}
                                style={{ width: `${Math.min(budgetSummary.percentageUsed, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-background rounded-lg border border-border">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Budget</span>
                            </div>
                            <p className="text-xl font-bold text-foreground">
                                {formatCurrency(budgetSummary.budget)}
                            </p>
                        </div>

                        <div className="text-center p-4 bg-background rounded-lg border border-border">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Spent</span>
                            </div>
                            <p className="text-xl font-bold text-foreground">
                                {formatCurrency(budgetSummary.totalSpent)}
                            </p>
                        </div>

                        <div className="text-center p-4 bg-background rounded-lg border border-border">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                {budgetSummary.remainingBudget >= 0 ? (
                                    <TrendingDown className="w-4 h-4 text-success" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-error" />
                                )}
                                <span className="text-xs font-medium text-muted-foreground">Remaining</span>
                            </div>
                            <p className={`text-xl font-bold ${
                                budgetSummary.remainingBudget >= 0 ? 'text-success' : 'text-error'
                            }`}>
                                {formatCurrency(Math.abs(budgetSummary.remainingBudget))}
                            </p>
                            {budgetSummary.remainingBudget < 0 && (
                                <p className="text-xs text-error mt-1">Over budget</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="font-bold text-foreground">Expense History</h2>
                    <p className="text-sm text-muted-foreground">
                        {expenses?.length || 0} {expenses?.length === 1 ? 'expense' : 'expenses'} recorded
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setIsReceiptScannerOpen(true)}
                        variant="outline"
                        size="sm"
                        className="shadow-sm"
                    >
                        <Camera className="w-4 h-4 mr-2" />
                        Scan Receipt
                    </Button>
                    <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="shadow-sm hover:shadow-md transition-shadow">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Expense
                            </Button>
                        </DialogTrigger>
                    </Dialog>
                </div>
            </div>

            {/* Add Expense Buttons */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Expenses</h2>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setIsReceiptScannerOpen(true)}
                        variant="outline"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                        <Camera className="w-4 h-4 mr-2" />
                        Scan Receipt
                    </Button>
                    <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Expense
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Expense</DialogTitle>
                            <DialogDescription>
                                Track your travel expenses and stay within budget
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            {/* Amount & Currency */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-sm font-medium">Amount *</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        step="0.01"
                                        min="0"
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Currency</Label>
                                    <select
                                        className="w-full px-3 py-2 border border-border rounded-md mt-1.5 bg-background"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                    >
                                        {CURRENCIES.map(curr => (
                                            <option key={curr} value={curr}>{curr}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <Label className="text-sm font-medium">Category *</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                                                category === cat.value
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/50'
                                            }`}
                                            onClick={() => setCategory(cat.value)}
                                        >
                                            <span className="text-sm font-medium">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <Label className="text-sm font-medium">Description *</Label>
                                <Textarea
                                    placeholder="What did you spend on?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    className="mt-1.5"
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <Label className="text-sm font-medium">Date</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="mt-1.5"
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <Label className="text-sm font-medium">Location (Optional)</Label>
                                <Input
                                    placeholder="Where was this expense?"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="mt-1.5"
                                />
                            </div>

                            {/* Split Expense */}
                            <div>
                                <Label className="text-sm font-medium">Split Expense</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-start mt-1.5"
                                    onClick={() => {
                                        if (!amount || parseFloat(amount) <= 0) {
                                            alert('Please enter amount first')
                                            return
                                        }
                                        setIsSplitDialogOpen(true)
                                    }}
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    {splitType === 'none' ? 'No Split (Personal)' :
                                     splitType === 'equal' ? `Split Equally (${participants.length} people)` :
                                     `Custom Split (${participants.length} people)`}
                                </Button>
                                {splitType !== 'none' && (
                                    <p className="text-xs text-success mt-1.5">
                                        ✓ Split configured with {participants.length} participant(s)
                                    </p>
                                )}
                            </div>

                            <Button
                                onClick={handleAddExpense}
                                disabled={isLoading || !amount || !description}
                                className="w-full shadow-sm"
                            >
                                {isLoading ? 'Adding...' : 'Add Expense'}
                            </Button>
                        </div>
                    </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Receipt Scanner Dialog */}
            {isReceiptScannerOpen && (
                <ReceiptScanner
                    onExtractData={handleReceiptExtracted}
                    onClose={() => setIsReceiptScannerOpen(false)}
                />
            )}

            {/* Group Split Dialog */}
            <GroupSplitDialog
                isOpen={isSplitDialogOpen}
                onClose={() => setIsSplitDialogOpen(false)}
                tripId={tripId}
                totalAmount={parseFloat(amount) || 0}
                currency={currency}
                onSplitConfirm={handleSplitConfirm}
            />

            {/* Expenses List */}
            <div className="space-y-3">
                {expenses && expenses.length > 0 ? (
                    expenses.map(expense => {
                        const categoryData = CATEGORIES.find(c => c.value === expense.category)
                        return (
                            <div
                                key={expense._id}
                                className="bg-card border border-border rounded-lg p-4 hover:shadow-md hover:border-primary/50 transition-all duration-200"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        {/* Category & Date */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                                                {categoryData?.label}
                                            </span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(expense.date)}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        <h3 className="font-semibold text-foreground mb-2 truncate">
                                            {expense.description}
                                        </h3>

                                        {/* Location */}
                                        {expense.location && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{expense.location}</span>
                                            </div>
                                        )}

                                        {/* Amount */}
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-2xl font-bold text-foreground">
                                                {formatCurrency(expense.convertedAmount ?? expense.amount)}
                                            </p>
                                            {expense.currency !== tripCurrency && (
                                                <span className="text-sm text-muted-foreground">
                                                    ({formatCurrency(expense.amount, expense.currency)})
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {user?.id === expense.userId && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteExpense(expense._id)}
                                            className="h-8 w-8 p-0 text-error hover:text-error hover:bg-error-light flex-shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 bg-card border border-dashed border-border rounded-lg">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Receipt className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">No expenses yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">Start tracking your trip expenses</p>
                        <Button onClick={() => setIsAddExpenseOpen(true)} className="shadow-sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Expense
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
