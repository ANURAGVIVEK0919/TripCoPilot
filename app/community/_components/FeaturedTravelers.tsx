"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import {
    MapPin, Clock, BadgeCheck, Lightbulb,
    BookOpen, ChevronLeft, ChevronRight, Star, Globe2,
    ThumbsUp, Bookmark, Tag, Users
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURED_TRAVELERS = [
    {
        id: 'sofia',
        name: 'Sofia Reyes',
        avatar: '/traveler_sofia.png',
        location: 'Barcelona, Spain',
        tripsCount: 47,
        badge: 'Verified Local',
        tagline: 'Slow travel • Culture seeker • Foodie',
        destinations: ['Kyoto', 'Morocco', 'Patagonia', 'Iceland'],
        stories: [
            {
                id: 's1',
                title: 'Lost in the Bamboo Groves of Arashiyama',
                destination: 'Kyoto, Japan',
                image: '/story_kyoto.png',
                excerpt:
                    "I arrived at Arashiyama at 5:30 AM — before the tour buses, before the crowds. The bamboo towered overhead like a cathedral, sunlight cutting through in thin golden shafts. A local monk told me the secret: arrive at dawn, walk the lesser-known Jojakko-ji trail instead of the main path, and you'll have it almost entirely to yourself. The silence is something you carry home with you.",
                date: 'March 2024',
                readTime: '4 min read',
                tags: ['Culture', 'Nature', 'Solo Travel'],
            },
            {
                id: 's2',
                title: 'A Week in the Medina: Marrakech Unfiltered',
                destination: 'Marrakech, Morocco',
                image: '/story_morocco.png',
                excerpt:
                    "Forget what Instagram shows you. The real Marrakech is the sound of hammers on copper at 7 AM, the smell of cumin and rose water drifting through dusty alleyways, bargaining with a vendor who ends up inviting you for mint tea. I got hopelessly lost three times and each time stumbled onto something extraordinary — a hidden courtyard, a century-old pharmacy, a rooftop café no guidebook mentions.",
                date: 'January 2024',
                readTime: '6 min read',
                tags: ['Adventure', 'Culture', 'Food'],
            },
        ],
        tips: [
            {
                id: 't1',
                category: '🍽️ Food & Dining',
                title: 'Skip the Tourist Ramen, Find the Real Stuff',
                destination: 'Kyoto, Japan',
                content:
                    "Nishiki Market at lunch is elbow-to-elbow tourists. Instead, head to Fushimi district around 7 PM — tiny ramen shops run by retired salarymen who barely speak English but will beam with pride watching you slurp their broth. Look for the red lantern and handwritten menu. Cash only, seats 8 people, no reservation needed.",
                specificLocation: 'Fushimi District, Kyoto',
                bestTime: 'Weekday evenings 6–9 PM',
                priceRange: '$ Budget',
                helpful: 394,
                tags: ['ramen', 'local', 'hidden gem'],
                isLocal: true,
            },
            {
                id: 't2',
                category: '💎 Hidden Gems',
                title: 'The Secret Rooftop the Locals Love',
                destination: 'Marrakech, Morocco',
                content:
                    "Café des Épices in Djemaa el-Fna is full of tourists. Go instead to Café Kessabine on Rue Bab Doukkala — unmarked door, steep stairs, but the rooftop gives you a 360° view of the medina. Order the kefta tagine. They'll make you traditional Berber tea while you watch the sun set over the minarets. Magic.",
                specificLocation: 'Rue Bab Doukkala, Medina',
                bestTime: 'Sunset (6–7:30 PM)',
                priceRange: '$$ Moderate',
                helpful: 521,
                tags: ['rooftop', 'sunset', 'authentic'],
                isLocal: false,
            },
        ],
    },
    {
        id: 'marcus',
        name: 'Marcus Chen',
        avatar: '/traveler_marcus.png',
        location: 'Toronto, Canada',
        tripsCount: 31,
        badge: 'Top Contributor',
        tagline: 'Budget travel • Photography • Backpacker',
        destinations: ['Santorini', 'Bali', 'Colombia', 'Vietnam'],
        stories: [
            {
                id: 's3',
                title: "Santorini on $60 a Day: It's Actually Possible",
                destination: 'Santorini, Greece',
                image: '/story_santorini.png',
                excerpt:
                    "Everyone told me Santorini would bankrupt me. They weren't entirely wrong — but I found a way. I stayed in a guesthouse in Pyrgos village instead of Oia, rented a scooter instead of taxis, ate at family tavernas set back from the caldera. Total cost? Under €55/day. And the sunsets from Skaros Rock? Identical to the ones in Oia, minus 300 other phones in your shot.",
                date: 'May 2024',
                readTime: '5 min read',
                tags: ['Budget', 'Europe', 'Photography'],
            },
        ],
        tips: [
            {
                id: 't3',
                category: '💰 Budget Hacks',
                title: 'The €3 Gyro That Beats Every Restaurant in Oia',
                destination: 'Santorini, Greece',
                content:
                    "Walk 10 minutes from the main Fira square to a blue painted shop called Nikolas. No view, plastic chairs, run by the same family since 1950. Order the pork gyro with extra tzatziki. Locals queue here at midnight. Meanwhile tourists pay €45 for the same food with a view. Spend that saving on a sailing trip to the volcano instead — totally worth it.",
                specificLocation: 'Fira, near the bus station',
                bestTime: 'Anytime — always fresh',
                priceRange: '$ Budget',
                helpful: 677,
                tags: ['gyro', 'budget', 'locals favourite'],
                isLocal: false,
            },
            {
                id: 't4',
                category: '📸 Photography',
                title: "Best Spot for the Iconic Oia Sunset (Without the Crowd)",
                destination: 'Santorini, Greece',
                content:
                    "Everyone packs onto the Oia Castle ruins for sunset. Arrive 1.5 hours early or skip it entirely. Instead, walk to Imerovigli — 40 minutes south of Oia by the cliff path — and watch from Skaros Rock promontory. You get the exact same view of windmills and caldera, without a soul around. Golden hour hits around 8:15 PM in summer.",
                specificLocation: 'Skaros Rock, Imerovigli',
                bestTime: 'Arrive by 7 PM in summer',
                priceRange: 'Free',
                helpful: 489,
                tags: ['photography', 'sunset', 'uncrowded'],
                isLocal: false,
            },
        ],
    },
    {
        id: 'aiko',
        name: 'Aiko Tanaka',
        avatar: '/traveler_aiko.png',
        location: 'Tokyo, Japan',
        tripsCount: 63,
        badge: 'Verified Local',
        tagline: 'Luxury travel • Tea ceremonies • Minimalist',
        destinations: ['Bhutan', 'Maldives', 'Paris', 'New Zealand'],
        stories: [],
        tips: [
            {
                id: 't5',
                category: '🎭 Cultural Tips',
                title: "Onsen Etiquette: Don't Be That Tourist",
                destination: 'Kyoto, Japan',
                content:
                    "Tattoos are still prohibited in most traditional onsen — call ahead. Always wash thoroughly at the provided stations before entering the bath. No swimwear. No phones or cameras ever. Tie your hair up. The onsen is a place of zen silence — speaking above a whisper is considered rude. Do this right and locals will bow to you with genuine respect.",
                specificLocation: 'Any traditional ryokan onsen',
                bestTime: 'Early morning (6–8 AM) for empty baths',
                priceRange: '$$ Moderate',
                helpful: 1102,
                tags: ['onsen', 'etiquette', 'culture', 'wellness'],
                isLocal: true,
            },
            {
                id: 't6',
                category: '🚌 Transport',
                title: 'The IC Card Trick Every Tokyo Local Knows',
                destination: 'Tokyo, Japan',
                content:
                    "Buy a Suica or Pasmo IC card at any station (¥500 refundable deposit). Load ¥3,000 and tap in/out of every train, bus, and even 7-Eleven. Fares are 10–20% cheaper than buying individual tickets. Works across Japan. When leaving, refund the remaining balance at any JR station — zero waste. Also works at vending machines and some taxis.",
                specificLocation: 'Any JR station in Japan',
                bestTime: 'First thing after landing',
                priceRange: '$ Budget',
                helpful: 2341,
                tags: ['transport', 'IC card', 'money saving', 'essential'],
                isLocal: true,
            },
        ],
    },
]

// ─── StorySlider ───────────────────────────────────────────────────────────────

function StorySlider({ stories }: { stories: typeof FEATURED_TRAVELERS[0]['stories'] }) {
    const [idx, setIdx] = useState(0)
    const [expanded, setExpanded] = useState(false)
    if (stories.length === 0) return null
    const story = stories[idx]

    const handleSlide = (newIdx: number) => {
        setIdx(newIdx)
        setExpanded(false)
    }

    return (
        <div className="featured-story-card">
            <div className="relative h-52 rounded-xl overflow-hidden">
                <Image src={story.image} alt={story.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {stories.length > 1 && (
                    <div className="absolute top-3 right-3 flex gap-1">
                        <button
                            onClick={() => handleSlide((idx - 1 + stories.length) % stories.length)}
                            className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-all"
                        >
                            <ChevronLeft size={14} className="text-white" />
                        </button>
                        <button
                            onClick={() => handleSlide((idx + 1) % stories.length)}
                            className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-all"
                        >
                            <ChevronRight size={14} className="text-white" />
                        </button>
                    </div>
                )}

                {stories.length > 1 && (
                    <div className="absolute top-3 left-3 flex gap-1">
                        {stories.map((_, i) => (
                            <button key={i} onClick={() => handleSlide(i)}
                                className={`h-2 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/50 w-2'}`}
                            />
                        ))}
                    </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex gap-1 flex-wrap mb-2">
                        {story.tags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <h4 className="text-white font-bold text-base leading-tight">{story.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-white/80 text-xs flex items-center gap-1">
                            <MapPin size={11} /> {story.destination}
                        </span>
                        <span className="text-white/80 text-xs flex items-center gap-1">
                            <Clock size={11} /> {story.readTime}
                        </span>
                        <span className="text-white/80 text-xs">{story.date}</span>
                    </div>
                </div>
            </div>

            <div className="p-4">
                {/* Excerpt — clamps to 3 lines when collapsed, full when expanded */}
                <p className={`text-sm text-gray-600 leading-relaxed transition-all duration-300 ${
                    expanded ? '' : 'line-clamp-3'
                }`}>
                    {story.excerpt}
                </p>
                <div className="flex items-center justify-end mt-3">
                    <button
                        onClick={() => setExpanded(prev => !prev)}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                    >
                        {expanded ? '▲ Show less' : 'Read full story →'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── TipPill ──────────────────────────────────────────────────────────────────

function TipPill({ tip }: { tip: typeof FEATURED_TRAVELERS[0]['tips'][0] }) {
    const [expanded, setExpanded] = useState(false)
    const priceColors: Record<string, string> = {
        'Free': 'bg-green-100 text-green-700',
        '$ Budget': 'bg-emerald-100 text-emerald-700',
        '$$ Moderate': 'bg-amber-100 text-amber-700',
        '$$$ Expensive': 'bg-red-100 text-red-700',
    }

    return (
        <div
            className={`featured-tip-card cursor-pointer ${expanded ? 'ring-2 ring-blue-400' : 'hover:shadow-md'}`}
            onClick={() => setExpanded(!expanded)}
        >
            <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                                {tip.category}
                            </span>
                            {tip.isLocal && (
                                <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                    <BadgeCheck size={11} /> Local Expert
                                </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${priceColors[tip.priceRange] || 'bg-gray-100 text-gray-600'}`}>
                                {tip.priceRange}
                            </span>
                        </div>
                        <h5 className="font-semibold text-gray-900 text-sm leading-tight">{tip.title}</h5>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin size={11} /> {tip.destination}
                            {tip.bestTime && <> • <Clock size={11} /> {tip.bestTime}</>}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 text-xs font-semibold shrink-0">
                        <ThumbsUp size={13} />
                        {tip.helpful}
                    </div>
                </div>

                <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-96 mt-3' : 'max-h-0'}`}>
                    <p className="text-sm text-gray-700 leading-relaxed border-t pt-3">{tip.content}</p>
                    {tip.specificLocation && (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <MapPin size={11} className="text-orange-400" />
                            <span className="font-medium">Exact spot:</span> {tip.specificLocation}
                        </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {tip.tags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
                                <Tag size={9} /> {tag}
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium">
                            <ThumbsUp size={13} /> Helpful
                        </button>
                        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium">
                            <Bookmark size={13} /> Save
                        </button>
                    </div>
                </div>

                <p className="text-xs text-blue-500 mt-2 font-medium">
                    {expanded ? '▲ Show less' : '▼ Tap to expand'}
                </p>
            </div>
        </div>
    )
}

// ─── TravelerCard ─────────────────────────────────────────────────────────────

function TravelerCard({ traveler }: { traveler: typeof FEATURED_TRAVELERS[0] }) {
    const [activeTab, setActiveTab] = useState<'stories' | 'tips'>('stories')

    return (
        <div className="traveler-card">
            {/* Banner */}
            <div className="h-24 rounded-t-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                />
                <Globe2 className="absolute right-4 bottom-2 text-white/20" size={56} />
            </div>

            <div className="px-5 pb-5">
                {/* Avatar row */}
                <div className="flex items-end -mt-10 mb-4">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                            <Image src={traveler.avatar} alt={traveler.name} width={80} height={80} className="object-cover w-full h-full" />
                        </div>
                        {traveler.badge === 'Verified Local' && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                                <BadgeCheck size={14} className="text-white" />
                            </div>
                        )}
                        {traveler.badge === 'Top Contributor' && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white">
                                <Star size={12} className="text-white fill-current" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="mb-4">
                    <h3 className="font-bold text-xl text-gray-900">{traveler.name}</h3>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
                        <MapPin size={13} /> {traveler.location}
                    </p>
                    <p className="text-gray-500 text-sm mt-1 italic">"{traveler.tagline}"</p>

                    <div className="flex gap-4 mt-3">
                        <div className="text-center">
                            <p className="font-bold text-gray-900 text-base">{traveler.tripsCount}</p>
                            <p className="text-gray-500 text-xs">Trips</p>
                        </div>
                        <div className="w-px bg-gray-200" />
                        <div className="text-center">
                            <p className="font-bold text-gray-900 text-base">{traveler.stories.length}</p>
                            <p className="text-gray-500 text-xs">Stories</p>
                        </div>
                        <div className="w-px bg-gray-200" />
                        <div className="text-center">
                            <p className="font-bold text-gray-900 text-base">{traveler.tips.length}</p>
                            <p className="text-gray-500 text-xs">Tips</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {traveler.destinations.map(d => (
                            <span key={d} className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                                ✈ {d}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Tab switcher */}
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
                    <button
                        onClick={() => setActiveTab('stories')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'stories'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <BookOpen size={15} /> Stories
                        {traveler.stories.length > 0 && (
                            <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                                {traveler.stories.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('tips')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'tips'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Lightbulb size={15} /> Tips
                        {traveler.tips.length > 0 && (
                            <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">
                                {traveler.tips.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'stories' ? (
                    traveler.stories.length > 0 ? (
                        <StorySlider stories={traveler.stories} />
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No stories yet</p>
                        </div>
                    )
                ) : (
                    <div className="space-y-3">
                        {traveler.tips.map(tip => (
                            <TipPill key={tip.id} tip={tip} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function FeaturedTravelers() {
    return (
        <section className="featured-travelers-section">
            {/* Header */}
            <div className="featured-header">
                <div className="featured-header-badge">
                    <Users size={16} />
                    <span>Community Spotlight</span>
                </div>
                <h2 className="featured-title">
                    Meet Our Top <span className="featured-title-highlight">Travelers</span>
                </h2>
                <p className="featured-subtitle">
                    Real stories and insider tips from passionate explorers around the world.
                    Tap any tip card to reveal the full scoop.
                </p>
            </div>

            {/* Cards */}
            <div className="featured-grid">
                {FEATURED_TRAVELERS.map(traveler => (
                    <TravelerCard key={traveler.id} traveler={traveler} />
                ))}
            </div>
        </section>
    )
}
