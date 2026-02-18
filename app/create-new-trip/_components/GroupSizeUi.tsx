import React from 'react'
export const SelectTravelesList = [
    {
        id: 1,
        title: 'Just Me',
        desc: 'A sole traveles in exploration',
        icon: '✈️',
        people: '1'
    },
    {
        id: 2,
        title: 'A Couple',
        desc: 'Two traveles in tandem',
        icon: '🥂',
        people: '2 People'
    },
    {
        id: 3,
        title: 'Family',
        desc: 'A group of fun loving adv',
        icon: '🏡',
        people: '3 to 5 People'
    },
    {
        id: 4,
        title: 'Friends',
        desc: 'A bunch of thrill-seekes',
        icon: '⛵',
        people: '5 to 10 People'
    },

]


function GroupSizeUi({ onSelectedOption }: any) {
    return (
        <div className='grid grid-cols-2 gap-3 mt-4'>
            {SelectTravelesList.map((item, index) => (
                <button
                    key={index}
                    className='p-4 border border-border rounded-lg bg-card hover:border-primary cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md text-left'
                    onClick={() => onSelectedOption(item.title + ":" + item.people)}
                >
                    <div className='text-2xl mb-2'>{item.icon}</div>
                    <h3 className='font-semibold text-sm mb-1'>{item.title}</h3>
                    <p className='text-xs text-muted-foreground'>{item.people}</p>
                </button>
            ))}
        </div>
    )
}

export default GroupSizeUi