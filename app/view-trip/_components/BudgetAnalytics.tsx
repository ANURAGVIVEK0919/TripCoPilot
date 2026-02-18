"use client"

import React from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { TrendingUp, PieChart as PieChartIcon, BarChart3, DollarSign } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface BudgetAnalyticsProps {
    tripId: string
    currency?: string
}

export default function BudgetAnalytics({ tripId, currency = 'USD' }: BudgetAnalyticsProps) {
    const budgetSummary = useQuery(api.expenses.getBudgetSummary, { tripId })
    const statistics = useQuery(api.expenses.getExpenseStatistics, { tripId })

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount)
    }

    // Loading state (undefined means query is still running)
    if (budgetSummary === undefined || statistics === undefined) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-muted animate-pulse mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading analytics...</p>
                </div>
            </div>
        )
    }

    // No budget set
    if (budgetSummary === null) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Budget Set</h3>
                    <p className="text-muted-foreground mb-4">Set a budget in the Budget tab to view analytics</p>
                </div>
            </div>
        )
    }

    // No expenses yet
    if (statistics === null) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <PieChartIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Expenses Yet</h3>
                    <p className="text-muted-foreground mb-4">Add expenses in the Expenses tab to view analytics</p>
                </div>
            </div>
        )
    }

    // Prepare chart data
    const categoryData = Object.entries(budgetSummary.categorySpending)
        .map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            percentage: budgetSummary.totalSpent > 0 
                ? ((value / budgetSummary.totalSpent) * 100).toFixed(1)
                : '0'
        }))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value)

    // Chart colors using CSS variables
    const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280']

    return (
        <div className="space-y-6">
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Expenses */}
                <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-muted-foreground">Total Expenses</span>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-foreground mb-1">{statistics.totalExpenses}</p>
                    <p className="text-xs text-muted-foreground">Transactions recorded</p>
                </div>

                {/* Average Expense */}
                <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-muted-foreground">Average</span>
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-success" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-foreground mb-1">{formatCurrency(statistics.averageExpense)}</p>
                    <p className="text-xs text-muted-foreground">Per transaction</p>
                </div>

                {/* Highest Expense */}
                <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-muted-foreground">Highest</span>
                        <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-info" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-foreground mb-1">{formatCurrency(statistics.maxExpense)}</p>
                    <p className="text-xs text-muted-foreground">Single expense</p>
                </div>

                {/* Top Category */}
                <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-muted-foreground">Top Category</span>
                        <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                            <PieChartIcon className="w-5 h-5 text-warning" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground mb-1 truncate">
                        {statistics.topCategory?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                        {statistics.topCategory ? formatCurrency(statistics.topCategory.amount) : 'No data'}
                    </p>
                </div>
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown Chart */}
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="font-semibold text-foreground mb-1">Spending by Category</h3>
                        <p className="text-sm text-muted-foreground">Distribution of expenses across categories</p>
                    </div>

                    {categoryData.length > 0 ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value) => formatCurrency(value as number)}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '0.5rem',
                                            padding: '0.75rem'
                                        }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-80 flex items-center justify-center">
                            <div className="text-center">
                                <PieChartIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">No expense data available</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Category Details List */}
                <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="font-semibold text-foreground mb-1">Category Details</h3>
                        <p className="text-sm text-muted-foreground">Breakdown with budget comparison</p>
                    </div>

                    <div className="space-y-4">
                        {categoryData.length > 0 ? (
                            categoryData.map((category, index) => {
                                const budgetForCategory = budgetSummary.categoryBudgets?.[category.name.toLowerCase() as keyof typeof budgetSummary.categoryBudgets]
                                const percentageOfCategoryBudget = budgetForCategory 
                                    ? ((category.value / budgetForCategory) * 100).toFixed(1)
                                    : null
                                const isOverBudget = percentageOfCategoryBudget && parseFloat(percentageOfCategoryBudget) > 100

                                return (
                                    <div key={index} className="space-y-2 pb-4 border-b border-border last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                                <span className="font-medium text-foreground">{category.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-foreground">{formatCurrency(category.value)}</p>
                                                <p className="text-xs text-muted-foreground">{category.percentage}% of total</p>
                                            </div>
                                        </div>
                                        
                                        {budgetForCategory && (
                                            <div className="space-y-1">
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                            isOverBudget ? 'bg-error' : 'bg-success'
                                                        }`}
                                                        style={{ 
                                                            width: `${Math.min(parseFloat(percentageOfCategoryBudget || '0'), 100)}%` 
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">
                                                        Budget: {formatCurrency(budgetForCategory)}
                                                    </span>
                                                    <span className={isOverBudget ? 'text-error font-medium' : 'text-muted-foreground'}>
                                                        {percentageOfCategoryBudget}% used
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-sm text-muted-foreground">No category data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Budget Alert */}
            {budgetSummary.shouldAlert && (
                <div className={`rounded-lg p-4 border ${
                    budgetSummary.remainingBudget < 0 
                        ? 'bg-error-light border-error/20' 
                        : 'bg-warning-light border-warning/20'
                }`}>
                    <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            budgetSummary.remainingBudget < 0 ? 'bg-error/10' : 'bg-warning/10'
                        }`}>
                            <span className="text-lg">{budgetSummary.remainingBudget < 0 ? '🚨' : '⚠️'}</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-foreground mb-1">
                                {budgetSummary.remainingBudget < 0 
                                    ? 'Budget Exceeded' 
                                    : 'Approaching Budget Limit'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {budgetSummary.remainingBudget < 0
                                    ? `You've spent ${formatCurrency(Math.abs(budgetSummary.remainingBudget))} more than your budget.`
                                    : `You've used ${budgetSummary.percentageUsed.toFixed(1)}% of your total budget.`}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
