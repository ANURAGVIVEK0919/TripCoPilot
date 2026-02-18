import React, { useState } from 'react'
function SelectDays({ onSelectedOption }: any) {
    const [days, setDays] = useState(3)
    return (
        <div className="flex flex-col items-center mt-4 p-5 border border-border rounded-lg bg-card shadow-sm space-y-4">
            <h3 className="font-semibold text-sm">How many days do you want to travel?</h3>
            <div className="flex items-center gap-5">
                <button
                    className="h-10 w-10 flex items-center justify-center text-lg border border-border rounded-full hover:bg-accent hover:border-primary transition-colors"
                    onClick={() => setDays(prev => (prev > 1 ? prev - 1 : 1))}
                >➖</button>
                <span className="text-2xl font-bold min-w-[100px] text-center">{days} Days</span>
                <button
                    className="h-10 w-10 flex items-center justify-center text-lg border border-border rounded-full hover:bg-accent hover:border-primary transition-colors"
                    onClick={() => setDays(prev => prev + 1)}
                >➕</button>
            </div>
            <button
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
                onClick={() => onSelectedOption(`${days} Days`)}
            >
                Confirm
            </button>
        </div>
    )
}
export default SelectDays

