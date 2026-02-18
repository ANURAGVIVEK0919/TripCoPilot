"use client"
import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
    Lightbulb, MapPin, ThumbsUp, ThumbsDown, Bookmark, 
    Plus, Trash2, Edit, X, Upload, Tag, DollarSign, 
    Clock, Shield, BadgeCheck, Search, Filter, TrendingUp
} from 'lucide-react'
import Image from 'next/image'
import { useUserDetail } from '@/app/provider'
import { Id } from '@/convex/_generated/dataModel'
import { useUploadThing } from '@/utils/uploadthing'

const CATEGORIES = [
    { value: 'food', label: '🍽️ Food & Dining', icon: '🍽️' },
    { value: 'activities', label: '🎯 Activities', icon: '🎯' },
    { value: 'transport', label: '🚌 Transport', icon: '🚌' },
    { value: 'hidden_gems', label: '💎 Hidden Gems', icon: '💎' },
    { value: 'safety', label: '🛡️ Safety Tips', icon: '🛡️' },
    { value: 'budget', label: '💰 Budget Hacks', icon: '💰' },
    { value: 'cultural', label: '🎭 Cultural Tips', icon: '🎭' },
    { value: 'seasonal', label: '🌤️ Seasonal Tips', icon: '🌤️' },
]

const PRICE_RANGES = [
    { value: 'free', label: 'Free', icon: '🆓' },
    { value: 'budget', label: '$ Budget', icon: '$' },
    { value: 'moderate', label: '$$ Moderate', icon: '$$' },
    { value: 'expensive', label: '$$$ Expensive', icon: '$$$' },
]

function LocalInsiderTips() {
    const { user } = useUser()
    const { userDetail } = useUserDetail()
    
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingTip, setEditingTip] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDestination, setSelectedDestination] = useState<string>('')
    const [selectedCategory, setSelectedCategory] = useState<string>('')
    const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'bookmarked'>('helpful')
    const [showLocalClaim, setShowLocalClaim] = useState(false)
    const [claimDestination, setClaimDestination] = useState('')
    
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [isUploading, setIsUploading] = useState(false)
    
    const [formData, setFormData] = useState({
        destination: '',
        category: 'food' as any,
        title: '',
        content: '',
        specificLocation: '',
        priceRange: undefined as any,
        bestTime: '',
        tags: '',
    })

    const { startUpload } = useUploadThing("imageUploader")

    // Queries
    const tips = useQuery(api.insiderTips.getAllTips, {
        destination: selectedDestination || undefined,
        category: selectedCategory || undefined,
        sortBy,
    })
    const popularDestinations = useQuery(api.insiderTips.getPopularDestinations)
    const trendingTips = useQuery(api.insiderTips.getTrendingTips, { limit: 5 })
    const userLocalDestinations = useQuery(
        api.insiderTips.getUserLocalDestinations,
        userDetail?._id ? { userId: userDetail._id } : 'skip'
    )

    // Mutations
    const createTip = useMutation(api.insiderTips.createTip)
    const updateTip = useMutation(api.insiderTips.updateTip)
    const deleteTip = useMutation(api.insiderTips.deleteTip)
    const toggleHelpfulVote = useMutation(api.insiderTips.toggleHelpfulVote)
    const toggleNotHelpfulVote = useMutation(api.insiderTips.toggleNotHelpfulVote)
    const toggleBookmark = useMutation(api.insiderTips.toggleBookmark)
    const claimLocalStatus = useMutation(api.insiderTips.claimLocalStatus)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length > 0) {
            const limitedFiles = files.slice(0, 3)
            setSelectedFiles(limitedFiles)
            
            const previews: string[] = []
            let loadedCount = 0
            
            limitedFiles.forEach((file) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    previews.push(reader.result as string)
                    loadedCount++
                    if (loadedCount === limitedFiles.length) {
                        setImagePreviews(previews)
                    }
                }
                reader.readAsDataURL(file)
            })
        }
    }

    const handleRemoveImage = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
        setImagePreviews(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userDetail?._id) return

        setIsUploading(true)
        let imageUrls: string[] = []

        try {
            if (selectedFiles.length > 0) {
                const uploadedFiles = await startUpload(selectedFiles)
                if (uploadedFiles && uploadedFiles.length > 0) {
                    imageUrls = uploadedFiles.map(f => f.url)
                }
            }

            const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t)

            if (editingTip) {
                await updateTip({
                    tipId: editingTip._id,
                    title: formData.title,
                    content: formData.content,
                    images: imageUrls.length > 0 ? imageUrls : editingTip.images,
                    specificLocation: formData.specificLocation || undefined,
                    priceRange: formData.priceRange || undefined,
                    bestTime: formData.bestTime || undefined,
                    tags,
                })
                setEditingTip(null)
            } else {
                await createTip({
                    destination: formData.destination,
                    category: formData.category,
                    title: formData.title,
                    content: formData.content,
                    images: imageUrls.length > 0 ? imageUrls : undefined,
                    specificLocation: formData.specificLocation || undefined,
                    priceRange: formData.priceRange || undefined,
                    bestTime: formData.bestTime || undefined,
                    tags,
                    userId: userDetail._id,
                    userName: user?.fullName || user?.firstName || 'Anonymous',
                    userImage: user?.imageUrl || '',
                })
            }

            resetForm()
        } catch (error) {
            console.error('Error submitting tip:', error)
            alert('Failed to submit tip. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            destination: '',
            category: 'food',
            title: '',
            content: '',
            specificLocation: '',
            priceRange: undefined,
            bestTime: '',
            tags: '',
        })
        setImagePreviews([])
        setSelectedFiles([])
        setEditingTip(null)
        setShowCreateForm(false)
    }

    const handleEdit = (tip: any) => {
        setEditingTip(tip)
        setFormData({
            destination: tip.destination,
            category: tip.category,
            title: tip.title,
            content: tip.content,
            specificLocation: tip.specificLocation || '',
            priceRange: tip.priceRange,
            bestTime: tip.bestTime || '',
            tags: tip.tags.join(', '),
        })
        if (tip.images && tip.images.length > 0) {
            setImagePreviews(tip.images)
        }
        setSelectedFiles([])
        setShowCreateForm(true)
    }

    const handleDelete = async (tipId: Id<"InsiderTips">) => {
        if (confirm('Are you sure you want to delete this tip?')) {
            await deleteTip({ tipId })
        }
    }

    const handleHelpfulVote = async (tipId: Id<"InsiderTips">) => {
        if (!userDetail?._id) return
        await toggleHelpfulVote({ tipId, userId: userDetail._id })
    }

    const handleNotHelpfulVote = async (tipId: Id<"InsiderTips">) => {
        if (!userDetail?._id) return
        await toggleNotHelpfulVote({ tipId, userId: userDetail._id })
    }

    const handleBookmarkToggle = async (tipId: Id<"InsiderTips">) => {
        if (!userDetail?._id) return
        await toggleBookmark({ tipId, userId: userDetail._id })
    }

    const handleClaimLocal = async () => {
        if (!userDetail?._id || !claimDestination.trim()) return
        try {
            await claimLocalStatus({ userId: userDetail._id, destination: claimDestination })
            alert(`✓ You're now a verified local for ${claimDestination}!`)
            setShowLocalClaim(false)
            setClaimDestination('')
        } catch (error: any) {
            alert(error.message || 'Failed to claim local status')
        }
    }

    const getCategoryIcon = (category: string) => {
        return CATEGORIES.find(c => c.value === category)?.icon || '📍'
    }

    const getPriceIcon = (priceRange?: string) => {
        return PRICE_RANGES.find(p => p.value === priceRange)?.icon || ''
    }

    const filteredTips = tips?.filter(tip => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            tip.title.toLowerCase().includes(query) ||
            tip.content.toLowerCase().includes(query) ||
            tip.destination.toLowerCase().includes(query) ||
            tip.tags.some(tag => tag.toLowerCase().includes(query))
        )
    })

    const TipCard = ({ tip }: { tip: any }) => {
        const isOwner = userDetail?._id === tip.userId
        const hasVotedHelpful = userDetail?._id ? tip.helpfulVotes.includes(userDetail._id) : false
        const hasVotedNotHelpful = userDetail?._id ? tip.notHelpfulVotes.includes(userDetail._id) : false

        return (
            <Card className='hover:shadow-xl transition-shadow'>
                <CardHeader>
                    <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-2'>
                                <span className='text-2xl'>{getCategoryIcon(tip.category)}</span>
                                <span className='px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full'>
                                    {CATEGORIES.find(c => c.value === tip.category)?.label.split(' ')[1]}
                                </span>
                                {tip.isVerifiedLocal && (
                                    <span className='flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full'>
                                        <BadgeCheck size={12} />
                                        Local
                                    </span>
                                )}
                                {tip.priceRange && (
                                    <span className='px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full'>
                                        {getPriceIcon(tip.priceRange)}
                                    </span>
                                )}
                            </div>
                            <CardTitle className='text-xl mb-1'>{tip.title}</CardTitle>
                            <CardDescription className='flex items-center gap-2 flex-wrap'>
                                <span className='flex items-center gap-1'>
                                    <MapPin size={14} />
                                    {tip.destination}
                                </span>
                                {tip.specificLocation && (
                                    <span className='text-gray-500'>• {tip.specificLocation}</span>
                                )}
                                {tip.bestTime && (
                                    <span className='flex items-center gap-1 text-gray-500'>
                                        <Clock size={14} />
                                        {tip.bestTime}
                                    </span>
                                )}
                            </CardDescription>
                        </div>
                        {isOwner && (
                            <div className='flex gap-2'>
                                <Button size='sm' variant='ghost' onClick={() => handleEdit(tip)}>
                                    <Edit size={16} />
                                </Button>
                                <Button size='sm' variant='ghost' onClick={() => handleDelete(tip._id)}>
                                    <Trash2 size={16} className='text-red-500' />
                                </Button>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {tip.images && tip.images.length > 0 && (
                        <div className='flex gap-2 overflow-x-auto'>
                            {tip.images.map((img: string, index: number) => (
                                <div key={index} className='relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden'>
                                    <Image src={img} alt={`${tip.title} ${index + 1}`} fill className='object-cover' />
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <p className='text-gray-700 whitespace-pre-wrap'>{tip.content}</p>
                    
                    {tip.tags.length > 0 && (
                        <div className='flex flex-wrap gap-2'>
                            {tip.tags.map((tag: string, index: number) => (
                                <span key={index} className='px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center gap-1'>
                                    <Tag size={12} />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    
                    <div className='flex items-center gap-2 text-sm text-gray-500 border-t pt-3'>
                        <Image
                            src={tip.userImage || '/placeholder.jpg'}
                            alt={tip.userName}
                            width={24}
                            height={24}
                            className='rounded-full'
                        />
                        <span>{tip.userName}</span>
                        <span>•</span>
                        <span>{new Date(tip.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className='flex items-center gap-3 pt-3 border-t'>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleHelpfulVote(tip._id)}
                            className={hasVotedHelpful ? 'text-green-600' : ''}
                        >
                            <ThumbsUp size={18} className={hasVotedHelpful ? 'fill-current' : ''} />
                            <span className='ml-2'>{tip.helpfulVotes.length}</span>
                        </Button>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleNotHelpfulVote(tip._id)}
                            className={hasVotedNotHelpful ? 'text-red-600' : ''}
                        >
                            <ThumbsDown size={18} className={hasVotedNotHelpful ? 'fill-current' : ''} />
                        </Button>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleBookmarkToggle(tip._id)}
                        >
                            <Bookmark size={18} />
                            <span className='ml-2'>{tip.bookmarkCount}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!user) {
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <Card>
                    <CardHeader>
                        <CardTitle>Sign in Required</CardTitle>
                        <CardDescription>Please sign in to view and share local insider tips</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-3xl font-bold text-gray-900 flex items-center gap-2'>
                        <Lightbulb className='text-yellow-500' size={32} />
                        Local Insider Tips
                    </h2>
                    <p className='text-gray-600 mt-1'>
                        Get authentic recommendations from locals and experienced travelers
                    </p>
                </div>
                <div className='flex gap-2'>
                    <Button onClick={() => setShowLocalClaim(true)} variant='outline'>
                        <BadgeCheck size={18} className='mr-2' />
                        Claim Local Status
                    </Button>
                    <Button onClick={() => { setShowCreateForm(true); setEditingTip(null); }} size='lg'>
                        <Plus size={20} className='mr-2' />
                        Share a Tip
                    </Button>
                </div>
            </div>

            {/* Local Claim Dialog */}
            {showLocalClaim && (
                <Card className='border-green-200 bg-green-50'>
                    <CardHeader>
                        <div className='flex items-center justify-between'>
                            <CardTitle className='flex items-center gap-2'>
                                <BadgeCheck className='text-green-600' />
                                Claim Verified Local Status
                            </CardTitle>
                            <Button variant='ghost' size='sm' onClick={() => setShowLocalClaim(false)}>
                                <X size={20} />
                            </Button>
                        </div>
                        <CardDescription>
                            Are you a local? Get a verified badge and help travelers with authentic insights!
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='flex gap-2'>
                            <Input
                                placeholder='Enter city/country (e.g., Paris, France)'
                                value={claimDestination}
                                onChange={(e) => setClaimDestination(e.target.value)}
                            />
                            <Button onClick={handleClaimLocal}>Claim</Button>
                        </div>
                        {userLocalDestinations && userLocalDestinations.length > 0 && (
                            <div className='mt-3'>
                                <p className='text-sm font-semibold mb-2'>Your Local Destinations:</p>
                                <div className='flex flex-wrap gap-2'>
                                    {userLocalDestinations.map((local) => (
                                        <span key={local._id} className='px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1'>
                                            <BadgeCheck size={14} />
                                            {local.destination}
                                            <span className='text-xs'>({local.tipCount} tips)</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Trending Tips */}
            {trendingTips && trendingTips.length > 0 && (
                <Card className='bg-gradient-to-r from-orange-50 to-yellow-50'>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                            <TrendingUp className='text-orange-600' />
                            Trending This Week
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='flex gap-3 overflow-x-auto pb-2'>
                            {trendingTips.map((tip) => (
                                <div
                                    key={tip._id}
                                    className='flex-shrink-0 w-64 p-3 bg-white rounded-lg border cursor-pointer hover:shadow-md transition-shadow'
                                    onClick={() => {
                                        setSelectedDestination(tip.destination)
                                        setSelectedCategory(tip.category)
                                    }}
                                >
                                    <div className='flex items-center gap-2 mb-2'>
                                        <span className='text-xl'>{getCategoryIcon(tip.category)}</span>
                                        <span className='font-semibold text-sm'>{tip.title}</span>
                                    </div>
                                    <div className='flex items-center gap-2 text-xs text-gray-600'>
                                        <MapPin size={12} />
                                        {tip.destination}
                                        <span>•</span>
                                        <ThumbsUp size={12} />
                                        {tip.helpfulVotes.length}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card>
                <CardContent className='pt-6'>
                    <div className='grid md:grid-cols-4 gap-4'>
                        <div>
                            <Label>Search</Label>
                            <div className='relative'>
                                <Search className='absolute left-3 top-3 text-gray-400' size={16} />
                                <Input
                                    placeholder='Search tips...'
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className='pl-9'
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Destination</Label>
                            <select
                                value={selectedDestination}
                                onChange={(e) => setSelectedDestination(e.target.value)}
                                className='w-full px-3 py-2 border rounded-md'
                            >
                                <option value=''>All Destinations</option>
                                {popularDestinations?.map((dest) => (
                                    <option key={dest.destination} value={dest.destination}>
                                        {dest.destination} ({dest.count})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Category</Label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className='w-full px-3 py-2 border rounded-md'
                            >
                                <option value=''>All Categories</option>
                                {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Sort By</Label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className='w-full px-3 py-2 border rounded-md'
                            >
                                <option value='helpful'>Most Helpful</option>
                                <option value='recent'>Most Recent</option>
                                <option value='bookmarked'>Most Bookmarked</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Create/Edit Form */}
            {showCreateForm && (
                <Card className='shadow-xl'>
                    <CardHeader>
                        <div className='flex items-center justify-between'>
                            <CardTitle>{editingTip ? 'Edit Tip' : 'Share a Local Tip'}</CardTitle>
                            <Button variant='ghost' size='sm' onClick={resetForm}>
                                <X size={20} />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className='space-y-4'>
                            <div className='grid md:grid-cols-2 gap-4'>
                                <div>
                                    <Label htmlFor='destination'>Destination *</Label>
                                    <Input
                                        id='destination'
                                        name='destination'
                                        placeholder='Paris, France'
                                        value={formData.destination}
                                        onChange={handleInputChange}
                                        required
                                        disabled={!!editingTip}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor='category'>Category *</Label>
                                    <select
                                        id='category'
                                        name='category'
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                        disabled={!!editingTip}
                                        className='w-full px-3 py-2 border rounded-md'
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor='title'>Tip Title *</Label>
                                <Input
                                    id='title'
                                    name='title'
                                    placeholder='Best croissant in Le Marais'
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor='content'>Detailed Tip *</Label>
                                <Textarea
                                    id='content'
                                    name='content'
                                    placeholder='Share your insider knowledge...'
                                    value={formData.content}
                                    onChange={handleInputChange}
                                    required
                                    className='min-h-[150px]'
                                />
                            </div>

                            <div className='grid md:grid-cols-3 gap-4'>
                                <div>
                                    <Label htmlFor='specificLocation'>Exact Location</Label>
                                    <Input
                                        id='specificLocation'
                                        name='specificLocation'
                                        placeholder='23 Rue des Rosiers'
                                        value={formData.specificLocation}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor='priceRange'>Price Range</Label>
                                    <select
                                        id='priceRange'
                                        name='priceRange'
                                        value={formData.priceRange || ''}
                                        onChange={handleInputChange}
                                        className='w-full px-3 py-2 border rounded-md'
                                    >
                                        <option value=''>Select...</option>
                                        {PRICE_RANGES.map((price) => (
                                            <option key={price.value} value={price.value}>
                                                {price.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor='bestTime'>Best Time</Label>
                                    <Input
                                        id='bestTime'
                                        name='bestTime'
                                        placeholder='Morning 7-9 AM'
                                        value={formData.bestTime}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor='tags'>Tags (comma-separated)</Label>
                                <Input
                                    id='tags'
                                    name='tags'
                                    placeholder='bakery, breakfast, authentic'
                                    value={formData.tags}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <Label htmlFor='images'>Images (up to 3)</Label>
                                <div className='border-2 border-dashed border-gray-300 rounded-lg p-4'>
                                    <input
                                        id='images'
                                        type='file'
                                        accept='image/*'
                                        multiple
                                        onChange={handleFileChange}
                                        className='hidden'
                                    />
                                    <label htmlFor='images' className='cursor-pointer block text-center'>
                                        {imagePreviews.length > 0 ? (
                                            <div className='flex gap-2 flex-wrap justify-center'>
                                                {imagePreviews.map((preview, index) => (
                                                    <div key={index} className='relative group'>
                                                        <div className='relative w-24 h-24 rounded-lg overflow-hidden'>
                                                            <Image src={preview} alt={`Preview ${index + 1}`} fill className='object-cover' />
                                                        </div>
                                                        <button
                                                            type='button'
                                                            onClick={(e) => { e.preventDefault(); handleRemoveImage(index) }}
                                                            className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center'
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className='text-gray-500'>
                                                <Upload className='mx-auto mb-2' size={32} />
                                                <p>Click to upload images</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <Button type='submit' className='w-full' disabled={isUploading}>
                                {isUploading ? 'Uploading...' : editingTip ? 'Update Tip' : 'Share Tip'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Tips Grid */}
            <div className='grid md:grid-cols-2 gap-6'>
                {filteredTips?.map((tip) => (
                    <TipCard key={tip._id} tip={tip} />
                ))}
            </div>

            {filteredTips?.length === 0 && (
                <Card>
                    <CardContent className='py-12 text-center'>
                        <Lightbulb className='mx-auto mb-4 text-gray-300' size={48} />
                        <p className='text-gray-500 mb-4'>
                            {searchQuery || selectedDestination || selectedCategory
                                ? 'No tips found. Try adjusting your filters.'
                                : 'No tips yet. Be the first to share a local insight!'}
                        </p>
                        <Button onClick={() => { setShowCreateForm(true); setEditingTip(null); }}>
                            <Plus size={20} className='mr-2' />
                            Share First Tip
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default LocalInsiderTips
