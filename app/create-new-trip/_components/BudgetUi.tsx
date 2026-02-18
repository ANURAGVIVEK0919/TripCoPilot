import React from 'react'

export const SelectBudgetOptions = [
    {
        id: 1,
        title: 'Cheap',
        desc: 'Stay conscious of costs',
        icon: '💵',
        color: 'bg-green-100 text-green-600'
    },
    {
        id: 2,
        title: 'Moderate',
        desc: 'Keep cost on the average side',
        icon: '💰',
        color: 'bg-yellow-100 text-yellow-600'
    },
    {
        id: 3,
        title: 'Luxury',
        desc: 'Don’t worry about cost',
        icon: '💸',
        color: 'bg-purple-100 text-purple-600'
    },

]


function BudgetUi({ onSelectedOption }: any) {
    return (
        <div className='mt-4'>
            <div className='grid grid-cols-3 gap-3'>
                {SelectBudgetOptions.map((item, index) => (
                    <button
                        key={index}
                        className='p-4 border border-border rounded-lg bg-card hover:border-primary cursor-pointer flex flex-col items-center text-center transition-all duration-200 shadow-sm hover:shadow-md'
                        onClick={() => onSelectedOption(item.title + ":" + item.desc)}
                    >
                        <div className={`text-3xl p-3 rounded-full ${item.color} mb-2`}>{item.icon}</div>
                        <h3 className='font-semibold text-sm mb-1'>{item.title}</h3>
                        <p className='text-xs text-muted-foreground'>{item.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    )
}

export default BudgetUi