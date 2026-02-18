import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============ BUDGET MANAGEMENT ============

// Create or Update Trip Budget
export const setTripBudget = mutation({
    args: {
        tripId: v.string(),
        totalBudget: v.number(),
        currency: v.string(),
        categoryBudgets: v.optional(v.object({
            accommodation: v.optional(v.number()),
            food: v.optional(v.number()),
            transport: v.optional(v.number()),
            activities: v.optional(v.number()),
            shopping: v.optional(v.number()),
            other: v.optional(v.number()),
        })),
        alertThreshold: v.optional(v.number()),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        // Check if budget already exists
        const existing = await ctx.db.query('TripBudget')
            .withIndex('by_trip', q => q.eq('tripId', args.tripId))
            .first();

        const now = Date.now();

        if (existing) {
            // Update existing budget
            await ctx.db.patch(existing._id, {
                totalBudget: args.totalBudget,
                currency: args.currency,
                categoryBudgets: args.categoryBudgets,
                alertThreshold: args.alertThreshold,
                updatedAt: now,
            });
            return { success: true, budgetId: existing._id };
        } else {
            // Create new budget
            const budgetId = await ctx.db.insert('TripBudget', {
                tripId: args.tripId,
                totalBudget: args.totalBudget,
                currency: args.currency,
                categoryBudgets: args.categoryBudgets,
                alertThreshold: args.alertThreshold ?? 80,
                createdBy: args.userId,
                createdAt: now,
                updatedAt: now,
            });
            return { success: true, budgetId };
        }
    }
});

// Get Trip Budget
export const getTripBudget = query({
    args: { tripId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db.query('TripBudget')
            .withIndex('by_trip', q => q.eq('tripId', args.tripId))
            .first();
    }
});

// ============ EXPENSE MANAGEMENT ============

// Add New Expense
export const addExpense = mutation({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
        userName: v.string(),
        userImage: v.string(),
        amount: v.number(),
        currency: v.string(),
        convertedAmount: v.optional(v.number()),
        category: v.union(
            v.literal('accommodation'),
            v.literal('food'),
            v.literal('transport'),
            v.literal('activities'),
            v.literal('shopping'),
            v.literal('other')
        ),
        description: v.string(),
        date: v.number(),
        receiptUrl: v.optional(v.string()),
        location: v.optional(v.string()),
        paidBy: v.id('UserTable'),
        splitType: v.union(
            v.literal('equal'),
            v.literal('custom'),
            v.literal('none')
        ),
        participants: v.array(v.id('UserTable')),
        customSplit: v.optional(v.array(v.object({
            userId: v.id('UserTable'),
            amount: v.number(),
        }))),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        
        const expenseId = await ctx.db.insert('TripExpenses', {
            tripId: args.tripId,
            userId: args.userId,
            userName: args.userName,
            userImage: args.userImage,
            amount: args.amount,
            currency: args.currency,
            convertedAmount: args.convertedAmount,
            category: args.category,
            description: args.description,
            date: args.date,
            receiptUrl: args.receiptUrl,
            location: args.location,
            paidBy: args.paidBy,
            splitType: args.splitType,
            participants: args.participants,
            customSplit: args.customSplit,
            isSettled: args.splitType === 'none', // Personal expenses are auto-settled
            createdAt: now,
            updatedAt: now,
        });

        // Create settlement records if expense is split
        if (args.splitType !== 'none') {
            await createSettlements(ctx, {
                expenseId,
                tripId: args.tripId,
                paidBy: args.paidBy,
                amount: args.convertedAmount ?? args.amount,
                currency: args.currency,
                splitType: args.splitType,
                participants: args.participants,
                customSplit: args.customSplit,
            });
        }

        return { success: true, expenseId };
    }
});

// Helper function to create settlement records
async function createSettlements(
    ctx: any,
    data: {
        expenseId: any;
        tripId: string;
        paidBy: any;
        amount: number;
        currency: string;
        splitType: string;
        participants: any[];
        customSplit?: any[];
    }
) {
    const now = Date.now();
    
    // Get user details for participants
    const paidByUser = await ctx.db.get(data.paidBy);
    
    if (data.splitType === 'equal') {
        // Split equally among all participants (excluding payer)
        const otherParticipants = data.participants.filter(id => id !== data.paidBy);
        const sharePerPerson = data.amount / data.participants.length;

        for (const participantId of otherParticipants) {
            const participant = await ctx.db.get(participantId);
            
            await ctx.db.insert('ExpenseSettlements', {
                tripId: data.tripId,
                expenseId: data.expenseId,
                fromUserId: participantId,
                fromUserName: participant?.name ?? 'Unknown',
                toUserId: data.paidBy,
                toUserName: paidByUser?.name ?? 'Unknown',
                amount: sharePerPerson,
                currency: data.currency,
                isPaid: false,
                createdAt: now,
            });
        }
    } else if (data.splitType === 'custom' && data.customSplit) {
        // Custom split amounts
        for (const split of data.customSplit) {
            if (split.userId !== data.paidBy && split.amount > 0) {
                const participant = await ctx.db.get(split.userId);
                
                await ctx.db.insert('ExpenseSettlements', {
                    tripId: data.tripId,
                    expenseId: data.expenseId,
                    fromUserId: split.userId,
                    fromUserName: participant?.name ?? 'Unknown',
                    toUserId: data.paidBy,
                    toUserName: paidByUser?.name ?? 'Unknown',
                    amount: split.amount,
                    currency: data.currency,
                    isPaid: false,
                    createdAt: now,
                });
            }
        }
    }
}

// Get All Expenses for a Trip
export const getTripExpenses = query({
    args: { tripId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db.query('TripExpenses')
            .withIndex('by_trip', q => q.eq('tripId', args.tripId))
            .order('desc')
            .collect();
    }
});

// Get Expense by ID
export const getExpenseById = query({
    args: { expenseId: v.id('TripExpenses') },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.expenseId);
    }
});

// Update Expense
export const updateExpense = mutation({
    args: {
        expenseId: v.id('TripExpenses'),
        amount: v.optional(v.number()),
        currency: v.optional(v.string()),
        convertedAmount: v.optional(v.number()),
        category: v.optional(v.union(
            v.literal('accommodation'),
            v.literal('food'),
            v.literal('transport'),
            v.literal('activities'),
            v.literal('shopping'),
            v.literal('other')
        )),
        description: v.optional(v.string()),
        date: v.optional(v.number()),
        location: v.optional(v.string()),
        receiptUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { expenseId, ...updates } = args;
        
        await ctx.db.patch(expenseId, {
            ...updates,
            updatedAt: Date.now(),
        });

        return { success: true };
    }
});

// Delete Expense
export const deleteExpense = mutation({
    args: { 
        expenseId: v.id('TripExpenses'),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const expense = await ctx.db.get(args.expenseId);
        
        if (!expense) {
            throw new Error('Expense not found');
        }

        // Only creator can delete
        if (expense.userId !== args.userId) {
            throw new Error('Unauthorized to delete this expense');
        }

        // Delete associated settlements
        const settlements = await ctx.db.query('ExpenseSettlements')
            .withIndex('by_expense', q => q.eq('expenseId', args.expenseId))
            .collect();

        for (const settlement of settlements) {
            await ctx.db.delete(settlement._id);
        }

        // Delete expense
        await ctx.db.delete(args.expenseId);

        return { success: true };
    }
});

// ============ SETTLEMENT MANAGEMENT ============

// Get Settlements for a Trip
export const getTripSettlements = query({
    args: { tripId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db.query('ExpenseSettlements')
            .withIndex('by_trip', q => q.eq('tripId', args.tripId))
            .collect();
    }
});

// Get User's Debts (what they owe)
export const getUserDebts = query({
    args: { 
        tripId: v.string(),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        return await ctx.db.query('ExpenseSettlements')
            .withIndex('by_from_user', q => q.eq('fromUserId', args.userId))
            .filter(q => q.and(
                q.eq(q.field('tripId'), args.tripId),
                q.eq(q.field('isPaid'), false)
            ))
            .collect();
    }
});

// Get User's Credits (what they're owed)
export const getUserCredits = query({
    args: { 
        tripId: v.string(),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        return await ctx.db.query('ExpenseSettlements')
            .withIndex('by_to_user', q => q.eq('toUserId', args.userId))
            .filter(q => q.and(
                q.eq(q.field('tripId'), args.tripId),
                q.eq(q.field('isPaid'), false)
            ))
            .collect();
    }
});

// Mark Settlement as Paid
export const markSettlementPaid = mutation({
    args: {
        settlementId: v.id('ExpenseSettlements'),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.settlementId, {
            isPaid: true,
            paidAt: Date.now(),
            notes: args.notes,
        });

        // Check if all settlements for the expense are now paid
        const settlement = await ctx.db.get(args.settlementId);
        if (settlement) {
            const allSettlements = await ctx.db.query('ExpenseSettlements')
                .withIndex('by_expense', q => q.eq('expenseId', settlement.expenseId))
                .collect();

            const allPaid = allSettlements.every(s => s.isPaid);
            
            if (allPaid) {
                // Mark expense as settled
                await ctx.db.patch(settlement.expenseId, {
                    isSettled: true,
                    updatedAt: Date.now(),
                });
            }
        }

        return { success: true };
    }
});

// ============ ANALYTICS & STATISTICS ============

// Get Budget Summary
export const getBudgetSummary = query({
    args: { tripId: v.string() },
    handler: async (ctx, args) => {
        // Get budget
        const budget = await ctx.db.query('TripBudget')
            .withIndex('by_trip', q => q.eq('tripId', args.tripId))
            .first();

        if (!budget) {
            return null;
        }

        // Get all expenses
        const expenses = await ctx.db.query('TripExpenses')
            .withIndex('by_trip', q => q.eq('tripId', args.tripId))
            .collect();

        // Calculate totals
        const totalSpent = expenses.reduce((sum, exp) => 
            sum + (exp.convertedAmount ?? exp.amount), 0
        );

        // Category-wise spending
        const categorySpending = {
            accommodation: 0,
            food: 0,
            transport: 0,
            activities: 0,
            shopping: 0,
            other: 0,
        };

        expenses.forEach(exp => {
            categorySpending[exp.category] += (exp.convertedAmount ?? exp.amount);
        });

        // Calculate remaining budget
        const remainingBudget = budget.totalBudget - totalSpent;
        const percentageUsed = (totalSpent / budget.totalBudget) * 100;

        // Check if alert should be triggered
        const shouldAlert = percentageUsed >= (budget.alertThreshold ?? 80);

        return {
            budget: budget.totalBudget,
            totalSpent,
            remainingBudget,
            percentageUsed,
            shouldAlert,
            currency: budget.currency,
            categorySpending,
            categoryBudgets: budget.categoryBudgets,
            expenseCount: expenses.length,
        };
    }
});

// Get Expense Statistics
export const getExpenseStatistics = query({
    args: { tripId: v.string() },
    handler: async (ctx, args) => {
        const expenses = await ctx.db.query('TripExpenses')
            .withIndex('by_trip', q => q.eq('tripId', args.tripId))
            .collect();

        if (expenses.length === 0) {
            return null;
        }

        // Calculate statistics
        const totalAmount = expenses.reduce((sum, exp) => 
            sum + (exp.convertedAmount ?? exp.amount), 0
        );

        const averageExpense = totalAmount / expenses.length;

        const maxExpense = Math.max(...expenses.map(exp => 
            exp.convertedAmount ?? exp.amount
        ));

        const minExpense = Math.min(...expenses.map(exp => 
            exp.convertedAmount ?? exp.amount
        ));

        // Group by date for daily spending
        const dailySpending: { [key: string]: number } = {};
        expenses.forEach(exp => {
            const date = new Date(exp.date).toLocaleDateString();
            dailySpending[date] = (dailySpending[date] || 0) + 
                (exp.convertedAmount ?? exp.amount);
        });

        // Most expensive category
        const categoryTotals: { [key: string]: number } = {};
        expenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + 
                (exp.convertedAmount ?? exp.amount);
        });

        const topCategory = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            totalExpenses: expenses.length,
            totalAmount,
            averageExpense,
            maxExpense,
            minExpense,
            dailySpending,
            categoryTotals,
            topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
        };
    }
});

// Calculate Simplified Debts (who owes whom - optimized)
export const getSimplifiedDebts = query({
    args: { tripId: v.string() },
    handler: async (ctx, args) => {
        const settlements = await ctx.db.query('ExpenseSettlements')
            .withIndex('by_trip', q => q.eq('tripId', args.tripId))
            .filter(q => q.eq(q.field('isPaid'), false))
            .collect();

        // Calculate net balance for each user
        const balances: { [userId: string]: { amount: number; name: string } } = {};

        settlements.forEach(settlement => {
            // Debtor (owes money)
            if (!balances[settlement.fromUserId]) {
                balances[settlement.fromUserId] = {
                    amount: 0,
                    name: settlement.fromUserName
                };
            }
            balances[settlement.fromUserId].amount -= settlement.amount;

            // Creditor (is owed money)
            if (!balances[settlement.toUserId]) {
                balances[settlement.toUserId] = {
                    amount: 0,
                    name: settlement.toUserName
                };
            }
            balances[settlement.toUserId].amount += settlement.amount;
        });

        // Simplify debts using greedy algorithm
        const debtors = Object.entries(balances)
            .filter(([_, data]) => data.amount < 0)
            .map(([userId, data]) => ({ userId, amount: -data.amount, name: data.name }))
            .sort((a, b) => b.amount - a.amount);

        const creditors = Object.entries(balances)
            .filter(([_, data]) => data.amount > 0)
            .map(([userId, data]) => ({ userId, amount: data.amount, name: data.name }))
            .sort((a, b) => b.amount - a.amount);

        const simplifiedDebts: Array<{
            from: string;
            fromName: string;
            to: string;
            toName: string;
            amount: number;
        }> = [];

        let i = 0, j = 0;
        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];

            const settleAmount = Math.min(debtor.amount, creditor.amount);

            simplifiedDebts.push({
                from: debtor.userId,
                fromName: debtor.name,
                to: creditor.userId,
                toName: creditor.name,
                amount: settleAmount,
            });

            debtor.amount -= settleAmount;
            creditor.amount -= settleAmount;

            if (debtor.amount === 0) i++;
            if (creditor.amount === 0) j++;
        }

        return simplifiedDebts;
    }
});
