"use client"
import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery, useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
    Briefcase, Plus, Trash2, Edit, Check, X, Sparkles, 
    Package, Weight, Image as ImageIcon, Upload, CheckCircle2,
    Circle, AlertCircle, TrendingUp, Users, Clock, Shirt,
    Droplet, Smartphone, FileText, Heart, Watch, Popcorn,
    Utensils, MoreHorizontal
} from 'lucide-react'
import Image from 'next/image'
import { useUserDetail } from '@/app/provider'
import { Id } from '@/convex/_generated/dataModel'
import { useUploadThing } from '@/utils/uploadthing'

const CATEGORIES = [
    { value: 'clothing', label: 'Clothing', icon: Shirt, color: 'bg-blue-100 text-blue-700' },
    { value: 'toiletries', label: 'Toiletries', icon: Droplet, color: 'bg-pink-100 text-pink-700' },
    { value: 'electronics', label: 'Electronics', icon: Smartphone, color: 'bg-purple-100 text-purple-700' },
    { value: 'documents', label: 'Documents', icon: FileText, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'medical', label: 'Medical', icon: Heart, color: 'bg-red-100 text-red-700' },
    { value: 'accessories', label: 'Accessories', icon: Watch, color: 'bg-green-100 text-green-700' },
    { value: 'entertainment', label: 'Entertainment', icon: Popcorn, color: 'bg-indigo-100 text-indigo-700' },
    { value: 'food_snacks', label: 'Food & Snacks', icon: Utensils, color: 'bg-orange-100 text-orange-700' },
    { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'bg-gray-100 text-gray-700' },
]

const TEMPLATES = [
    { value: 'beach', label: '🏖️ Beach Vacation', description: 'Swimwear, sunscreen, beach essentials' },
    { value: 'skiing', label: '⛷️ Ski Trip', description: 'Winter gear, ski equipment, warm clothes' },
    { value: 'business', label: '💼 Business Trip', description: 'Formal wear, laptop, documents' },
    { value: 'backpacking', label: '🎒 Backpacking', description: 'Lightweight gear, camping equipment' },
    { value: 'city', label: '🏙️ City Break', description: 'Comfortable walking shoes, city clothes' },
    { value: 'camping', label: '⛺ Camping', description: 'Tent, sleeping bag, outdoor gear' },
]

interface PackingListProps {
    tripId: string
    tripDestination: string
    tripDuration?: number
    tripActivities?: string[]
}

function PackingListManager({ tripId, tripDestination, tripDuration, tripActivities }: PackingListProps) {
    const { user } = useUser()
    const { userDetail } = useUserDetail()
    
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [showAIGenerator, setShowAIGenerator] = useState(false)
    const [showAddItem, setShowAddItem] = useState(false)
    const [selectedList, setSelectedList] = useState<any>(null)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [filterCategory, setFilterCategory] = useState<string>('all')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>('')
    const [isGenerating, setIsGenerating] = useState(false)
    
    const [formData, setFormData] = useState({
        name: '',
        category: 'clothing' as any,
        quantity: 1,
        isEssential: false,
        weight: '',
        notes: '',
        assignedTo: '',
    })

    const [aiFormData, setAIFormData] = useState({
        destination: tripDestination,
        duration: tripDuration || 7,
        activities: tripActivities?.join(', ') || '',
        weather: '',
        tripType: 'city',
    })

    const { startUpload } = useUploadThing("imageUploader")

    // Queries
    const packingLists = useQuery(api.packingList.getPackingListsByTrip, { tripId })
    const listWithItems = useQuery(
        api.packingList.getPackingListWithItems,
        selectedList ? { listId: selectedList._id } : 'skip'
    )
    const progress = useQuery(
        api.packingList.getPackingProgress,
        selectedList ? { listId: selectedList._id } : 'skip'
    )
    const templates = useQuery(api.packingList.getTemplatesByType, {})

    // Mutations
    const createList = useMutation(api.packingList.createPackingList)
    const deleteList = useMutation(api.packingList.deletePackingList)
    const addItem = useMutation(api.packingList.addPackingItem)
    const updateItem = useMutation(api.packingList.updatePackingItem)
    const deleteItem = useMutation(api.packingList.deletePackingItem)
    const togglePacked = useMutation(api.packingList.toggleItemPacked)
    const applyTemplate = useMutation(api.packingList.applyTemplate)
    
    // Actions
    const generateAI = useAction(api.packingList.generatePackingListAI)

    // Auto-select first list
    React.useEffect(() => {
        if (packingLists && packingLists.length > 0 && !selectedList) {
            setSelectedList(packingLists[0])
        }
    }, [packingLists, selectedList])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleAIInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setAIFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleCreateList = async () => {
        if (!userDetail?._id) return
        try {
            const listId = await createList({
                tripId,
                name: `Packing List ${(packingLists?.length || 0) + 1}`,
                isAIGenerated: false,
                createdBy: userDetail._id,
            })
            const newList = await new Promise<any>((resolve) => {
                const checkList = setInterval(() => {
                    const found = packingLists?.find((l: any) => l._id === listId)
                    if (found) {
                        clearInterval(checkList)
                        resolve(found)
                    }
                }, 100)
            })
            setSelectedList(newList)
            setShowCreateForm(false)
        } catch (error) {
            console.error('Error creating list:', error)
            alert('Failed to create packing list')
        }
    }

    const handleGenerateAI = async () => {
        if (!userDetail?._id) return
        setIsGenerating(true)
        try {
            const activities = aiFormData.activities.split(',').map(a => a.trim()).filter(a => a)
            const result = await generateAI({
                tripId,
                destination: aiFormData.destination,
                duration: aiFormData.duration,
                activities,
                weather: aiFormData.weather || undefined,
                tripType: aiFormData.tripType,
                userId: userDetail._id,
            })
            alert(`✨ AI generated ${result.itemCount} items!`)
            setShowAIGenerator(false)
            // Refresh and select new list
            setTimeout(() => {
                const newList = packingLists?.find((l: any) => l._id === result.listId)
                if (newList) setSelectedList(newList)
            }, 500)
        } catch (error) {
            console.error('AI generation error:', error)
            alert('Failed to generate packing list. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleAddItem = async () => {
        if (!userDetail?._id || !selectedList) return
        
        let imageUrl = undefined
        if (selectedFile) {
            const uploaded = await startUpload([selectedFile])
            if (uploaded && uploaded[0]) {
                imageUrl = uploaded[0].url
            }
        }

        await addItem({
            packingListId: selectedList._id,
            tripId,
            category: formData.category,
            name: formData.name,
            quantity: formData.quantity,
            isEssential: formData.isEssential,
            weight: formData.weight ? parseFloat(formData.weight) : undefined,
            notes: formData.notes || undefined,
            imageUrl,
            addedBy: userDetail._id,
        })

        // Reset form
        setFormData({
            name: '',
            category: 'clothing',
            quantity: 1,
            isEssential: false,
            weight: '',
            notes: '',
            assignedTo: '',
        })
        setSelectedFile(null)
        setImagePreview('')
        setShowAddItem(false)
    }

    const handleTogglePacked = async (itemId: Id<"PackingItems">) => {
        if (!userDetail?._id) return
        await togglePacked({ itemId, userId: userDetail._id })
    }

    const handleApplyTemplate = async (templateId: Id<"PackingTemplates">) => {
        if (!userDetail?._id || !selectedList) return
        try {
            await applyTemplate({
                packingListId: selectedList._id,
                tripId,
                templateId,
                userId: userDetail._id,
            })
            alert('✅ Template applied successfully!')
        } catch (error) {
            alert('Failed to apply template')
        }
    }

    const getCategoryIcon = (category: string) => {
        const cat = CATEGORIES.find(c => c.value === category)
        return cat ? <cat.icon size={16} /> : <Package size={16} />
    }

    const getCategoryColor = (category: string) => {
        return CATEGORIES.find(c => c.value === category)?.color || 'bg-gray-100 text-gray-700'
    }

    const filteredItems = listWithItems?.items?.filter((item: any) => 
        filterCategory === 'all' || item.category === filterCategory
    ) || []

    const packedCount = filteredItems.filter((item: any) => item.isPacked).length
    const progressPercentage = filteredItems.length > 0 
        ? Math.round((packedCount / filteredItems.length) * 100) 
        : 0

    if (!user || !userDetail) {
        return (
            <Card>
                <CardContent className='py-12 text-center'>
                    <Package className='mx-auto mb-4 text-gray-300' size={48} />
                    <p className='text-gray-500'>Please sign in to use packing lists</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
                        <Briefcase className='text-blue-600' size={28} />
                        Packing Lists
                    </h2>
                    <p className='text-gray-600 mt-1'>Never forget important items for your trip</p>
                </div>
                <div className='flex gap-2'>
                    <Button onClick={() => setShowAIGenerator(true)} variant='outline'>
                        <Sparkles size={18} className='mr-2 text-purple-600' />
                        AI Generate
                    </Button>
                    <Button onClick={handleCreateList}>
                        <Plus size={18} className='mr-2' />
                        New List
                    </Button>
                </div>
            </div>

            {/* AI Generator Dialog */}
            {showAIGenerator && (
                <Card className='border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50'>
                    <CardHeader>
                        <div className='flex items-center justify-between'>
                            <CardTitle className='flex items-center gap-2'>
                                <Sparkles className='text-purple-600' />
                                AI Packing List Generator
                            </CardTitle>
                            <Button variant='ghost' size='sm' onClick={() => setShowAIGenerator(false)}>
                                <X size={20} />
                            </Button>
                        </div>
                        <CardDescription>
                            Let AI create a personalized packing list based on your trip details
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='grid md:grid-cols-2 gap-4'>
                            <div>
                                <Label>Destination</Label>
                                <Input
                                    name='destination'
                                    value={aiFormData.destination}
                                    onChange={handleAIInputChange}
                                    placeholder='Paris, France'
                                />
                            </div>
                            <div>
                                <Label>Duration (days)</Label>
                                <Input
                                    type='number'
                                    name='duration'
                                    value={aiFormData.duration}
                                    onChange={handleAIInputChange}
                                    min='1'
                                />
                            </div>
                            <div>
                                <Label>Trip Type</Label>
                                <select
                                    name='tripType'
                                    value={aiFormData.tripType}
                                    onChange={handleAIInputChange}
                                    className='w-full px-3 py-2 border rounded-md'
                                >
                                    {TEMPLATES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label>Weather (optional)</Label>
                                <Input
                                    name='weather'
                                    value={aiFormData.weather}
                                    onChange={handleAIInputChange}
                                    placeholder='Warm, sunny'
                                />
                            </div>
                            <div className='md:col-span-2'>
                                <Label>Activities (comma-separated)</Label>
                                <Input
                                    name='activities'
                                    value={aiFormData.activities}
                                    onChange={handleAIInputChange}
                                    placeholder='sightseeing, dining, museums, shopping'
                                />
                            </div>
                        </div>
                        <Button 
                            onClick={handleGenerateAI} 
                            className='w-full mt-4'
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Sparkles className='mr-2 animate-spin' size={18} />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className='mr-2' size={18} />
                                    Generate Packing List
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* List Selector */}
            {packingLists && packingLists.length > 0 && (
                <div className='flex gap-2 overflow-x-auto pb-2'>
                    {packingLists.map((list: any) => (
                        <button
                            key={list._id}
                            onClick={() => setSelectedList(list)}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all ${
                                selectedList?._id === list._id
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {list.isAIGenerated && <Sparkles size={14} className='inline mr-1' />}
                            {list.name}
                        </button>
                    ))}
                </div>
            )}

            {selectedList && listWithItems && progress && (
                <>
                    {/* Progress Overview */}
                    <Card className='bg-gradient-to-r from-blue-50 to-green-50'>
                        <CardContent className='pt-6'>
                            <div className='grid md:grid-cols-4 gap-4'>
                                <div className='text-center'>
                                    <div className='text-3xl font-bold text-blue-600'>{progress.percentage}%</div>
                                    <div className='text-sm text-gray-600 mt-1'>Packed</div>
                                    <div className='text-xs text-gray-500'>{progress.packedItems} / {progress.totalItems} items</div>
                                </div>
                                <div className='text-center'>
                                    <div className='text-3xl font-bold text-green-600'>{progress.essentialPercentage}%</div>
                                    <div className='text-sm text-gray-600 mt-1'>Essentials</div>
                                    <div className='text-xs text-gray-500'>{progress.packedEssential} / {progress.essentialItems}</div>
                                </div>
                                <div className='text-center'>
                                    <div className='text-3xl font-bold text-purple-600'>{progress.totalWeight.toFixed(1)} kg</div>
                                    <div className='text-sm text-gray-600 mt-1'>Total Weight</div>
                                    <div className='text-xs text-gray-500'>{progress.packedWeight.toFixed(1)} kg packed</div>
                                </div>
                                <div className='text-center'>
                                    <div className='text-3xl font-bold text-orange-600'>{progress.categoryProgress.length}</div>
                                    <div className='text-sm text-gray-600 mt-1'>Categories</div>
                                    <div className='text-xs text-gray-500'>Organized</div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className='mt-4'>
                                <div className='flex items-center justify-between text-sm mb-1'>
                                    <span className='text-gray-600'>Overall Progress</span>
                                    <span className='font-semibold text-gray-900'>{progressPercentage}%</span>
                                </div>
                                <div className='w-full bg-gray-200 rounded-full h-3 overflow-hidden'>
                                    <div 
                                        className='bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-500'
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category Filter & Add Item */}
                    <div className='flex items-center justify-between'>
                        <div className='flex gap-2 overflow-x-auto'>
                            <button
                                onClick={() => setFilterCategory('all')}
                                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                                    filterCategory === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                All ({listWithItems.items?.length || 0})
                            </button>
                            {CATEGORIES.map(cat => {
                                const count = listWithItems.items?.filter((item: any) => item.category === cat.value).length || 0
                                if (count === 0) return null
                                return (
                                    <button
                                        key={cat.value}
                                        onClick={() => setFilterCategory(cat.value)}
                                        className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex items-center gap-1 ${
                                            filterCategory === cat.value
                                                ? cat.color
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        <cat.icon size={14} />
                                        {cat.label} ({count})
                                    </button>
                                )
                            })}
                        </div>
                        <Button onClick={() => setShowAddItem(true)} size='sm'>
                            <Plus size={16} className='mr-1' />
                            Add Item
                        </Button>
                    </div>

                    {/* Add Item Form */}
                    {showAddItem && (
                        <Card className='border-green-200 bg-green-50'>
                            <CardHeader>
                                <div className='flex items-center justify-between'>
                                    <CardTitle>Add Item</CardTitle>
                                    <Button variant='ghost' size='sm' onClick={() => setShowAddItem(false)}>
                                        <X size={20} />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className='grid md:grid-cols-2 gap-4'>
                                    <div>
                                        <Label>Item Name *</Label>
                                        <Input
                                            name='name'
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder='T-shirts'
                                        />
                                    </div>
                                    <div>
                                        <Label>Category *</Label>
                                        <select
                                            name='category'
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className='w-full px-3 py-2 border rounded-md'
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Quantity</Label>
                                        <Input
                                            type='number'
                                            name='quantity'
                                            value={formData.quantity}
                                            onChange={handleInputChange}
                                            min='1'
                                        />
                                    </div>
                                    <div>
                                        <Label>Weight (kg)</Label>
                                        <Input
                                            type='number'
                                            name='weight'
                                            value={formData.weight}
                                            onChange={handleInputChange}
                                            step='0.1'
                                            placeholder='0.5'
                                        />
                                    </div>
                                    <div className='md:col-span-2'>
                                        <Label>Notes</Label>
                                        <Textarea
                                            name='notes'
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            placeholder='Any special notes...'
                                            rows={2}
                                        />
                                    </div>
                                    <div className='md:col-span-2'>
                                        <Label>Photo (optional)</Label>
                                        <div className='border-2 border-dashed rounded-lg p-4'>
                                            <input
                                                type='file'
                                                accept='image/*'
                                                onChange={handleFileChange}
                                                className='hidden'
                                                id='item-image'
                                            />
                                            <label htmlFor='item-image' className='cursor-pointer block text-center'>
                                                {imagePreview ? (
                                                    <div className='relative w-32 h-32 mx-auto'>
                                                        <Image src={imagePreview} alt='Preview' fill className='object-cover rounded' />
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <ImageIcon className='mx-auto text-gray-400 mb-2' size={32} />
                                                        <p className='text-sm text-gray-600'>Click to upload photo</p>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                    <div className='md:col-span-2 flex items-center gap-2'>
                                        <input
                                            type='checkbox'
                                            name='isEssential'
                                            checked={formData.isEssential}
                                            onChange={handleInputChange}
                                            className='w-4 h-4'
                                        />
                                        <Label className='cursor-pointer'>
                                            Mark as Essential (don't forget!)
                                        </Label>
                                    </div>
                                </div>
                                <Button onClick={handleAddItem} className='w-full mt-4'>
                                    Add to List
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Items List */}
                    <div className='space-y-3'>
                        {filteredItems.length === 0 ? (
                            <Card>
                                <CardContent className='py-12 text-center'>
                                    <Package className='mx-auto mb-4 text-gray-300' size={48} />
                                    <p className='text-gray-500 mb-4'>
                                        {listWithItems.items?.length === 0 
                                            ? 'No items yet. Add your first item or use AI to generate a list!'
                                            : 'No items in this category'
                                        }
                                    </p>
                                    <div className='flex gap-2 justify-center'>
                                        <Button onClick={() => setShowAddItem(true)}>
                                            <Plus size={16} className='mr-2' />
                                            Add Item
                                        </Button>
                                        <Button onClick={() => setShowAIGenerator(true)} variant='outline'>
                                            <Sparkles size={16} className='mr-2' />
                                            Generate with AI
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredItems.map((item: any) => (
                                <Card key={item._id} className={item.isPacked ? 'bg-gray-50 opacity-75' : ''}>
                                    <CardContent className='py-4'>
                                        <div className='flex items-center gap-3'>
                                            {/* Checkbox */}
                                            <button
                                                onClick={() => handleTogglePacked(item._id)}
                                                className='flex-shrink-0'
                                            >
                                                {item.isPacked ? (
                                                    <CheckCircle2 className='text-green-600' size={24} />
                                                ) : (
                                                    <Circle className='text-gray-300 hover:text-gray-400' size={24} />
                                                )}
                                            </button>

                                            {/* Photo */}
                                            {item.imageUrl && (
                                                <div className='relative w-16 h-16 flex-shrink-0 rounded overflow-hidden'>
                                                    <Image src={item.imageUrl} alt={item.name} fill className='object-cover' />
                                                </div>
                                            )}

                                            {/* Item Details */}
                                            <div className='flex-1 min-w-0'>
                                                <div className='flex items-center gap-2 flex-wrap'>
                                                    <h3 className={`font-semibold ${item.isPacked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                                        {item.name}
                                                    </h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${getCategoryColor(item.category)}`}>
                                                        {getCategoryIcon(item.category)}
                                                        {CATEGORIES.find(c => c.value === item.category)?.label}
                                                    </span>
                                                    {item.isEssential && (
                                                        <span className='px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1'>
                                                            <AlertCircle size={12} />
                                                            Essential
                                                        </span>
                                                    )}
                                                    <span className='text-sm text-gray-500'>× {item.quantity}</span>
                                                    {item.weight && (
                                                        <span className='text-sm text-gray-500 flex items-center gap-1'>
                                                            <Weight size={12} />
                                                            {item.weight} kg
                                                        </span>
                                                    )}
                                                </div>
                                                {item.notes && (
                                                    <p className='text-sm text-gray-600 mt-1'>{item.notes}</p>
                                                )}
                                                {item.isPacked && item.packedAt && (
                                                    <p className='text-xs text-gray-500 mt-1 flex items-center gap-1'>
                                                        <Check size={12} />
                                                        Packed {new Date(item.packedAt).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className='flex gap-1 flex-shrink-0'>
                                                <Button
                                                    size='sm'
                                                    variant='ghost'
                                                    onClick={() => deleteItem({ itemId: item._id })}
                                                >
                                                    <Trash2 size={16} className='text-red-500' />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Templates Section */}
                    {templates && templates.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Templates</CardTitle>
                                <CardDescription>Apply a template to quickly populate your list</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className='grid md:grid-cols-3 gap-3'>
                                    {templates.slice(0, 6).map((template: any) => (
                                        <button
                                            key={template._id}
                                            onClick={() => handleApplyTemplate(template._id)}
                                            className='p-3 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left'
                                        >
                                            <div className='font-semibold text-sm mb-1'>{template.name}</div>
                                            <div className='text-xs text-gray-600 mb-2'>{template.description}</div>
                                            <div className='text-xs text-gray-500'>
                                                {template.items.length} items • Used {template.useCount} times
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {(!packingLists || packingLists.length === 0) && (
                <Card>
                    <CardContent className='py-12 text-center'>
                        <Briefcase className='mx-auto mb-4 text-gray-300' size={64} />
                        <h3 className='text-xl font-semibold mb-2'>No Packing Lists Yet</h3>
                        <p className='text-gray-600 mb-6'>
                            Create your first packing list or let AI generate one for you!
                        </p>
                        <div className='flex gap-3 justify-center'>
                            <Button onClick={handleCreateList} size='lg'>
                                <Plus size={20} className='mr-2' />
                                Create Manual List
                            </Button>
                            <Button onClick={() => setShowAIGenerator(true)} size='lg' variant='outline'>
                                <Sparkles size={20} className='mr-2 text-purple-600' />
                                Generate with AI
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default PackingListManager
