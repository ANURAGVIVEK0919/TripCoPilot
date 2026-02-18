import { Button } from '@/components/ui/button'
import { Globe2 } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

function FinalUi({ viewTrip, disable }: any) {
    return (
        <div className="flex flex-col items-center justify-center mt-4 p-6 bg-card border border-border rounded-lg shadow-sm space-y-3">
            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe2 className="text-primary h-6 w-6" />
            </div>
            
            {/* Text */}
            <div className="text-center space-y-1">
                <h3 className="font-semibold text-foreground">
                    ✈️ Planning your dream trip...
                </h3>
                <p className="text-muted-foreground text-xs max-w-xs">
                    Gathering the best destinations, activities, and travel details for you.
                </p>
            </div>

            {/* Progress Indicator */}
            <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse w-3/4 transition-all"></div>
            </div>

            {/* View Trip Button */}
            <Button 
                disabled={disable} 
                onClick={viewTrip} 
                className='w-full shadow-sm hover:shadow-md transition-shadow'
            >
                View Trip
            </Button>
        </div>
    )
}

export default FinalUi