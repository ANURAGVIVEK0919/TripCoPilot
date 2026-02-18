"use client";
import React from 'react';
import { useTripDetail } from '@/app/provider';
// @ts-ignore
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

type GeoCoordinates = {
    latitude: number;
    longitude: number;
};

type Activity = {
    geo_coordinates: GeoCoordinates;
    place_name?: string;
};

type Day = {
    activities: Activity[];
};

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function GlobalMap() {
    const { tripDetailInfo } = useTripDetail() as { tripDetailInfo?: { itinerary?: Day[] } };
    const [error, setError] = React.useState<string | null>(null);
    const [hoveredMarker, setHoveredMarker] = React.useState<string | null>(null);
    const [zoom, setZoom] = React.useState(1);

    // Extract all coordinates from itinerary
    const markers = React.useMemo(() => {
        try {
            if (!tripDetailInfo?.itinerary) return [];

            const allMarkers: Array<{ name: string; coordinates: [number, number]; day: number; activityIndex: number }> = [];

            tripDetailInfo.itinerary.forEach((day: Day, dayIndex: number) => {
                day.activities.forEach((activity: Activity, activityIndex: number) => {
                    if (activity.geo_coordinates?.longitude && activity.geo_coordinates?.latitude) {
                        // Add slight offset to prevent exact overlaps (increased from 0.001 to 0.005)
                        const offset = activityIndex * 0.005; // Larger offset for better separation
                        allMarkers.push({
                            name: activity.place_name || 'Location',
                            coordinates: [
                                activity.geo_coordinates.longitude + offset,
                                activity.geo_coordinates.latitude + offset
                            ],
                            day: dayIndex + 1,
                            activityIndex: activityIndex
                        });
                    }
                });
            });

            return allMarkers;
        } catch (err) {
            console.error('Error processing markers:', err);
            setError('Error loading map markers');
            return [];
        }
    }, [tripDetailInfo]);

    // Calculate center point
    const center = React.useMemo(() => {
        if (markers.length === 0) return [78.9629, 20.5937]; // Default to India

        const avgLng = markers.reduce((sum, m) => sum + m.coordinates[0], 0) / markers.length;
        const avgLat = markers.reduce((sum, m) => sum + m.coordinates[1], 0) / markers.length;

        return [avgLng, avgLat];
    }, [markers]);

    // Calculate appropriate initial zoom based on marker spread
    const initialZoom = React.useMemo(() => {
        if (markers.length === 0) return 1;
        if (markers.length === 1) return 6; // City level for single location

        // Calculate bounding box
        const lngs = markers.map(m => m.coordinates[0]);
        const lats = markers.map(m => m.coordinates[1]);
        const maxLng = Math.max(...lngs);
        const minLng = Math.min(...lngs);
        const maxLat = Math.max(...lats);
        const minLat = Math.min(...lats);

        const lngDiff = maxLng - minLng;
        const latDiff = maxLat - minLat;
        const maxDiff = Math.max(lngDiff, latDiff);

        // Determine zoom level based on spread
        if (maxDiff < 0.1) return 8;  // Street/neighborhood level
        if (maxDiff < 1) return 6;    // City level
        if (maxDiff < 5) return 4;    // Regional level
        if (maxDiff < 20) return 3;   // Country level
        return 2;                      // Continental level
    }, [markers]);

    // Set initial zoom
    React.useEffect(() => {
        setZoom(initialZoom);
    }, [initialZoom]);

    // Generate colors for different days
    const getMarkerColor = (dayIndex: number) => {
        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];
        return colors[dayIndex % colors.length];
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev * 1.5, 16));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev / 1.5, 1));
    };

    const handleReset = () => {
        setZoom(initialZoom);
    };

    // Get zoom level description
    const getZoomDescription = () => {
        if (zoom >= 12) return "Street View";
        if (zoom >= 8) return "Neighborhood";
        if (zoom >= 6) return "City Level";
        if (zoom >= 4) return "Regional View";
        if (zoom >= 3) return "Country View";
        if (zoom >= 2) return "Continental";
        return "World View";
    };

    return (
        <div className='w-full h-full bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 rounded-xl overflow-hidden flex items-center justify-center relative border border-sky-200 shadow-inner'>
            {error ? (
                <div className='text-center p-4'>
                    <p className='text-red-600 font-semibold'>{error}</p>
                    <p className='text-gray-500 text-sm mt-2'>Please refresh the page</p>
                </div>
            ) : (
                <>
                    {/* Zoom Controls */}
                    <div className='absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg z-20 overflow-hidden border border-gray-200'>
                        <button
                            onClick={handleZoomIn}
                            disabled={zoom >= 16}
                            className='p-2.5 hover:bg-blue-50 transition-colors border-b border-gray-200 w-full flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed'
                            title="Zoom In"
                        >
                            <ZoomIn className='h-4 w-4 text-gray-600 group-hover:text-blue-600' />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            disabled={zoom <= 1}
                            className='p-2.5 hover:bg-blue-50 transition-colors border-b border-gray-200 w-full flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed'
                            title="Zoom Out"
                        >
                            <ZoomOut className='h-4 w-4 text-gray-600 group-hover:text-blue-600' />
                        </button>
                        <button
                            onClick={handleReset}
                            className='p-2.5 hover:bg-blue-50 transition-colors w-full flex items-center justify-center group'
                            title="Reset View"
                        >
                            <Maximize2 className='h-4 w-4 text-gray-600 group-hover:text-blue-600' />
                        </button>
                    </div>

                    {/* Zoom Level Indicator */}
                    <div className='absolute top-4 left-20 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 z-10 border border-gray-200'>
                        <p className='text-xs font-semibold text-gray-700'>{getZoomDescription()}</p>
                        <p className='text-[10px] text-gray-500'>Zoom: {zoom.toFixed(1)}x</p>
                    </div>

                    {/* Tooltip */}
                    {hoveredMarker && (
                        <div className='absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg z-50 pointer-events-none border border-gray-200'>
                            <p className='text-sm font-semibold text-gray-800'>{hoveredMarker}</p>
                        </div>
                    )}

                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={{
                            scale: 147,
                            center: center as [number, number]
                        }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <ZoomableGroup 
                            center={center as [number, number]} 
                            zoom={zoom}
                            minZoom={1}
                            maxZoom={16}
                        >
                            <Geographies geography={geoUrl}>
                                {({ geographies }: any) =>
                                    geographies.map((geo: any) => (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill="#E0F2FE"
                                            stroke="#7DD3FC"
                                            strokeWidth={0.5}
                                            style={{
                                                default: { 
                                                    fill: '#E0F2FE',
                                                    stroke: '#7DD3FC',
                                                    strokeWidth: 0.5,
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease'
                                                },
                                                hover: { 
                                                    fill: '#BAE6FD', 
                                                    stroke: '#38BDF8',
                                                    strokeWidth: 0.7,
                                                    outline: 'none',
                                                    transition: 'all 0.2s ease'
                                                },
                                                pressed: { 
                                                    fill: '#7DD3FC', 
                                                    stroke: '#0EA5E9',
                                                    strokeWidth: 0.8,
                                                    outline: 'none' 
                                                }
                                            }}
                                        />
                                    ))
                                }
                            </Geographies>

                            {/* Markers with different colors per day */}
                            {markers.map((marker, index) => {
                                // Calculate marker size based on zoom level (reduced sizes)
                                const baseSize = zoom >= 8 ? 5 : zoom >= 6 ? 4 : zoom >= 4 ? 3 : 3;
                                const glowSize = zoom >= 8 ? 8 : zoom >= 6 ? 7 : zoom >= 4 ? 6 : 5;
                                const isHovered = hoveredMarker === `${marker.name} (Day ${marker.day})`;
                                
                                return (
                                    <Marker key={index} coordinates={marker.coordinates}>
                                        <g
                                            onMouseEnter={() => setHoveredMarker(`${marker.name} (Day ${marker.day})`)}
                                            onMouseLeave={() => setHoveredMarker(null)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {/* Outer glow circle - only show on hover */}
                                            {isHovered && (
                                                <circle 
                                                    r={glowSize + 3} 
                                                    fill={getMarkerColor(marker.day - 1)} 
                                                    opacity={0.3}
                                                    style={{ transition: 'all 0.2s ease' }}
                                                />
                                            )}
                                            {/* Main marker circle */}
                                            <circle 
                                                r={isHovered ? baseSize + 1.5 : baseSize} 
                                                fill={getMarkerColor(marker.day - 1)} 
                                                stroke="#fff" 
                                                strokeWidth={zoom >= 6 ? 1.5 : 1.2}
                                                style={{
                                                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            />
                                            {/* Day number inside marker (only at higher zoom levels) */}
                                            {zoom >= 6 && (
                                                <text
                                                    textAnchor="middle"
                                                    y={0.5}
                                                    dy={1}
                                                    style={{ 
                                                        fontFamily: 'system-ui', 
                                                        fill: '#fff',
                                                        fontSize: zoom >= 8 ? '7px' : '6px',
                                                        fontWeight: 'bold',
                                                        pointerEvents: 'none',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    {marker.day}
                                                </text>
                                            )}
                                            {/* Place name label at high zoom levels */}
                                            {zoom >= 10 && (
                                                <text
                                                    textAnchor="middle"
                                                    y={baseSize + 12}
                                                    style={{ 
                                                        fontFamily: 'system-ui', 
                                                        fill: '#1F2937',
                                                        fontSize: '8px',
                                                        fontWeight: '600',
                                                        pointerEvents: 'none',
                                                        textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                                                    }}
                                                >
                                                    {marker.name.length > 15 ? marker.name.substring(0, 15) + '...' : marker.name}
                                                </text>
                                            )}
                                        </g>
                                    </Marker>
                                );
                            })}
                        </ZoomableGroup>
                    </ComposableMap>

                    {/* Legend */}
                    {markers.length > 0 && (
                        <div className='absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10 border border-gray-200'>
                            <p className='text-xs font-semibold text-gray-700 mb-2'>Trip Days</p>
                            <div className='flex flex-col gap-1.5'>
                                {Array.from(new Set(markers.map(m => m.day))).sort((a, b) => a - b).map((day) => (
                                    <div key={day} className='flex items-center gap-2 hover:bg-gray-50 rounded px-1 py-0.5 transition-colors'>
                                        <div 
                                            className='w-3 h-3 rounded-full shadow-sm' 
                                            style={{ backgroundColor: getMarkerColor(day - 1) }}
                                        />
                                        <span className='text-xs text-gray-600 font-medium'>Day {day}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Info Badge */}
                    {markers.length > 0 && (
                        <div className='absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 z-10 border border-gray-200'>
                            <p className='text-xs text-gray-600'>
                                <span className='font-semibold text-gray-800'>{markers.length}</span> locations
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default GlobalMap;