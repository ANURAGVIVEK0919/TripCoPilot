"use client"
import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useConvex, useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Heart, MessageCircle, Plus, Trash2, Edit, Send, X, Upload, Image as ImageIcon, Lightbulb, BookOpen } from 'lucide-react'
import Image from 'next/image'
import { useUserDetail } from '../provider'
import { Id } from '@/convex/_generated/dataModel'
import { useUploadThing } from '@/utils/uploadthing'
import LocalInsiderTips from './_components/LocalInsiderTips'
import FeaturedTravelers from './_components/FeaturedTravelers'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

function CommunityPage() {
    const { user } = useUser()
    const { userDetail } = useUserDetail()
    const convex = useConvex()
    
    const [activeTab, setActiveTab] = useState<'stories' | 'tips'>('stories')
    
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingStory, setEditingStory] = useState<any>(null)
    const [selectedStory, setSelectedStory] = useState<any>(null)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [previewImageIndex, setPreviewImageIndex] = useState<number>(0)
    const [isUploading, setIsUploading] = useState(false)
    
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        destination: '',
    })

    // Uploadthing hook
    const { startUpload } = useUploadThing("imageUploader")

    // Queries and Mutations
    const stories = useQuery(api.communityStories.getAllStories)
    const createStory = useMutation(api.communityStories.createStory)
    const updateStory = useMutation(api.communityStories.updateStory)
    const deleteStory = useMutation(api.communityStories.deleteStory)
    const toggleLike = useMutation(api.communityStories.toggleLike)
    const addComment = useMutation(api.communityStories.addComment)
    const deleteComment = useMutation(api.communityStories.deleteComment)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length > 0) {
            // Limit to 5 images
            const limitedFiles = files.slice(0, 5)
            setSelectedFiles(limitedFiles)
            
            // Create previews for all files
            const previews: string[] = []
            let loadedCount = 0
            
            limitedFiles.forEach((file) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    previews.push(reader.result as string)
                    loadedCount++
                    
                    if (loadedCount === limitedFiles.length) {
                        setImagePreviews(previews)
                        setPreviewImageIndex(0)
                    }
                }
                reader.readAsDataURL(file)
            })
        }
    }

    const handleRemoveImage = (index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index)
        const newPreviews = imagePreviews.filter((_, i) => i !== index)
        setSelectedFiles(newFiles)
        setImagePreviews(newPreviews)
        
        // Adjust preview index if needed
        if (previewImageIndex >= newPreviews.length) {
            setPreviewImageIndex(Math.max(0, newPreviews.length - 1))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userDetail?._id) {
            alert('Your user details are still loading from the database. Please wait a moment and try again.')
            return
        }

        setIsUploading(true)
        let imageUrls: string[] = []
        let previewImageUrl = ''

        try {
            // Upload images if files are selected
            if (selectedFiles.length > 0) {
                const uploadedFiles = await startUpload(selectedFiles)
                if (uploadedFiles && uploadedFiles.length > 0) {
                    imageUrls = uploadedFiles.map(f => f.url)
                    // Set preview image based on selected index
                    previewImageUrl = imageUrls[previewImageIndex] || imageUrls[0]
                }
            }

            if (editingStory) {
                await updateStory({
                    storyId: editingStory._id,
                    title: formData.title,
                    content: formData.content,
                    imageUrl: previewImageUrl || undefined,
                    images: imageUrls.length > 0 ? imageUrls : undefined,
                    destination: formData.destination,
                })
                setEditingStory(null)
            } else {
                await createStory({
                    title: formData.title,
                    content: formData.content,
                    imageUrl: previewImageUrl || undefined,
                    images: imageUrls.length > 0 ? imageUrls : undefined,
                    destination: formData.destination,
                    userId: userDetail._id,
                    userName: user?.fullName || user?.firstName || 'Anonymous',
                    userImage: user?.imageUrl || '',
                })
            }

            setFormData({ title: '', content: '', destination: '' })
            setImagePreviews([])
            setSelectedFiles([])
            setPreviewImageIndex(0)
            setShowCreateForm(false)
        } catch (error) {
            console.error('Error submitting story:', error)
            alert('Failed to submit story. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleEdit = (story: any) => {
        setEditingStory(story)
        setFormData({
            title: story.title,
            content: story.content,
            destination: story.destination,
        })
        // Load existing images as previews
        if (story.images && story.images.length > 0) {
            setImagePreviews(story.images)
            // Find which image is the preview
            const previewIndex = story.images.findIndex((img: string) => img === story.imageUrl)
            setPreviewImageIndex(previewIndex >= 0 ? previewIndex : 0)
        } else {
            setImagePreviews([])
        }
        setSelectedFiles([])
        setShowCreateForm(true)
    }

    const handleDelete = async (storyId: Id<"CommunityStories">) => {
        if (confirm('Are you sure you want to delete this story?')) {
            await deleteStory({ storyId })
        }
    }

    const handleLike = async (storyId: Id<"CommunityStories">) => {
        if (!userDetail?._id) {
            alert('Please sign in to like stories')
            return
        }
        try {
            await toggleLike({ storyId, userId: userDetail._id })
        } catch (error) {
            console.error('Error toggling like:', error)
            alert('Failed to like story. Please try again.')
        }
    }

    const handleAddComment = async (storyId: Id<"CommunityStories">, localCommentText: string, setLocalCommentText: (text: string) => void, setComments: (comments: any[]) => void) => {
        if (!userDetail?._id || !localCommentText.trim()) return
        
        try {
            await addComment({
                storyId,
                userId: userDetail._id,
                userName: user?.fullName || user?.firstName || 'Anonymous',
                userImage: user?.imageUrl || '',
                comment: localCommentText,
            })
            
            setLocalCommentText('')
            
            // Reload comments after adding
            const updatedComments = await loadComments(storyId)
            setComments(updatedComments)
        } catch (error) {
            console.error('Error adding comment:', error)
            alert('Failed to add comment. Please try again.')
        }
    }

    const loadComments = async (storyId: Id<"CommunityStories">) => {
        const comments = await convex.query(api.communityStories.getCommentsByStoryId, { storyId })
        return comments
    }

    const StoryCard = ({ story }: { story: any }) => {
        const [showComments, setShowComments] = useState(false)
        const [comments, setComments] = useState<any[]>([])
        const [localCommentText, setLocalCommentText] = useState('')
        const [currentImageIndex, setCurrentImageIndex] = useState(0)
        const [isLiking, setIsLiking] = useState(false)
        
        // Get comment count from database
        const commentCount = useQuery(api.communityStories.getCommentCount, { storyId: story._id })
        
        // Compute like status from server data
        const isLiked = userDetail?._id ? (story.likes || []).includes(userDetail._id) : false
        const likesCount = (story.likes || []).length
        
        const isOwner = userDetail?._id === story.userId
        const hasMultipleImages = story.images && story.images.length > 1

        const handleLikeClick = async () => {
            if (!userDetail?._id || isLiking) return
            
            setIsLiking(true)
            
            try {
                await handleLike(story._id)
            } catch (error) {
                console.error('Error toggling like:', error)
            } finally {
                // Small delay to ensure Convex has propagated the change
                setTimeout(() => {
                    setIsLiking(false)
                }, 300)
            }
        }

        const handleShowComments = async () => {
            if (!showComments) {
                const loadedComments = await loadComments(story._id)
                setComments(loadedComments)
            }
            setShowComments(!showComments)
        }

        const nextImage = () => {
            if (story.images) {
                setCurrentImageIndex((prev) => (prev + 1) % story.images.length)
            }
        }

        const prevImage = () => {
            if (story.images) {
                setCurrentImageIndex((prev) => (prev - 1 + story.images.length) % story.images.length)
            }
        }

        return (
            <Card className='hover:shadow-xl transition-shadow'>
                <CardHeader>
                    <div className='flex items-start justify-between'>
                        <div className='flex items-center gap-3'>
                            <Image
                                src={story.userImage || '/placeholder.jpg'}
                                alt={story.userName}
                                width={40}
                                height={40}
                                className='rounded-full'
                            />
                            <div>
                                <CardTitle className='text-lg'>{story.title}</CardTitle>
                                <CardDescription>
                                    by {story.userName} • {story.destination} • {new Date(story.createdAt).toLocaleDateString()}
                                </CardDescription>
                            </div>
                        </div>
                        {isOwner && (
                            <div className='flex gap-2'>
                                <Button
                                    size='sm'
                                    variant='ghost'
                                    onClick={() => handleEdit(story)}
                                >
                                    <Edit size={16} />
                                </Button>
                                <Button
                                    size='sm'
                                    variant='ghost'
                                    onClick={() => handleDelete(story._id)}
                                >
                                    <Trash2 size={16} className='text-red-500' />
                                </Button>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {story.images && story.images.length > 0 ? (
                        <div className='mb-4 space-y-2'>
                            {/* Main Image Display */}
                            <div className='relative w-full h-64 rounded-lg overflow-hidden group'>
                                <Image
                                    src={story.images[currentImageIndex]}
                                    alt={`${story.title} - Image ${currentImageIndex + 1}`}
                                    fill
                                    className='object-cover'
                                />
                                
                                {/* Navigation Arrows for Multiple Images */}
                                {hasMultipleImages && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className='absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity'
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className='absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity'
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                        
                                        {/* Image Counter */}
                                        <div className='absolute bottom-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm'>
                                            {currentImageIndex + 1} / {story.images.length}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Thumbnail Gallery for Multiple Images */}
                            {hasMultipleImages && (
                                <div className='flex gap-2 overflow-x-auto pb-2'>
                                    {story.images.map((img: string, index: number) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                                currentImageIndex === index
                                                    ? 'border-primary scale-110'
                                                    : 'border-gray-200 hover:border-gray-400'
                                            }`}
                                        >
                                            <Image
                                                src={img}
                                                alt={`Thumbnail ${index + 1}`}
                                                fill
                                                className='object-cover'
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : story.imageUrl && (
                        <div className='relative w-full h-64 mb-4 rounded-lg overflow-hidden'>
                            <Image
                                src={story.imageUrl}
                                alt={story.title}
                                fill
                                className='object-cover'
                            />
                        </div>
                    )}
                    <p className='text-gray-700 whitespace-pre-wrap mb-4'>{story.content}</p>
                    
                    <div className='flex items-center gap-4 pt-4 border-t'>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                                if (!userDetail?._id) {
                                    alert('Please sign in to like stories')
                                    return
                                }
                                handleLikeClick()
                            }}
                            className={isLiked ? 'text-red-500' : ''}
                            disabled={isLiking}
                        >
                            <Heart size={18} className={isLiked ? 'fill-current' : ''} />
                            <span className='ml-2'>{likesCount}</span>
                        </Button>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                                if (!userDetail?._id) {
                                    alert('Please sign in to view comments')
                                    return
                                }
                                handleShowComments()
                            }}
                        >
                            <MessageCircle size={18} />
                            <span className='ml-2'>{commentCount ?? 0}</span>
                        </Button>
                    </div>

                    {showComments && (
                        <div className='mt-4 pt-4 border-t space-y-4'>
                            {/* Add Comment */}
                            <div className='flex gap-2'>
                                <Input
                                    placeholder='Write a comment...'
                                    value={localCommentText}
                                    onChange={(e) => setLocalCommentText(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleAddComment(story._id, localCommentText, setLocalCommentText, setComments)
                                        }
                                    }}
                                />
                                <Button
                                    size='sm'
                                    onClick={() => handleAddComment(story._id, localCommentText, setLocalCommentText, setComments)}
                                    disabled={!localCommentText.trim()}
                                >
                                    <Send size={16} />
                                </Button>
                            </div>

                            {/* Comments List */}
                            <div className='space-y-3'>
                                {comments.map((comment) => (
                                    <div key={comment._id} className='flex gap-2 bg-gray-50 p-3 rounded-lg'>
                                        <Image
                                            src={comment.userImage || '/placeholder.jpg'}
                                            alt={comment.userName}
                                            width={32}
                                            height={32}
                                            className='rounded-full'
                                        />
                                        <div className='flex-1'>
                                            <div className='flex items-center justify-between'>
                                                <p className='font-semibold text-sm'>{comment.userName}</p>
                                                {userDetail?._id === comment.userId && (
                                                    <Button
                                                        size='sm'
                                                        variant='ghost'
                                                        onClick={async () => {
                                                            await deleteComment({ commentId: comment._id })
                                                            // Reload comments after deleting
                                                            const updatedComments = await loadComments(story._id)
                                                            setComments(updatedComments)
                                                        }}
                                                    >
                                                        <Trash2 size={14} className='text-red-500' />
                                                    </Button>
                                                )}
                                            </div>
                                            <p className='text-sm text-gray-700'>{comment.comment}</p>
                                            <p className='text-xs text-gray-500 mt-1'>
                                                {new Date(comment.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                        <CardDescription>
                            Please sign in to view and share travel stories
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-orange-50/50 via-white/80 to-pink-50/50 backdrop-blur-md py-8 px-4'>
            <div className='max-w-6xl mx-auto'>
                {/* Header */}
                <div className='mb-8'>
                    <div className='flex justify-between items-start flex-wrap gap-4 mb-6'>
                        <div>
                            <h1 className='text-4xl font-bold text-gray-900 mb-2'>
                                Travel Community
                            </h1>
                            <p className='text-gray-600'>
                                Share your travel experiences and get inspired by others
                            </p>
                        </div>
                        {activeTab === 'stories' && (
                            <Button
                                size='lg'
                                onClick={() => {
                                    setShowCreateForm(true)
                                    setEditingStory(null)
                                    setFormData({ title: '', content: '', destination: '' })
                                    setImagePreviews([])
                                    setSelectedFiles([])
                                    setPreviewImageIndex(0)
                                }}
                            >
                                <Plus size={20} className='mr-2' />
                                Share Your Story
                            </Button>
                        )}
                    </div>
                    
                    {/* Tabs */}
                    <div className='flex gap-2 border-b'>
                        <button
                            onClick={() => setActiveTab('stories')}
                            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all ${
                                activeTab === 'stories'
                                    ? 'border-blue-600 text-blue-600 font-semibold'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <BookOpen size={20} />
                            Travel Stories
                        </button>
                        <button
                            onClick={() => setActiveTab('tips')}
                            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all ${
                                activeTab === 'tips'
                                    ? 'border-blue-600 text-blue-600 font-semibold'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <Lightbulb size={20} />
                            Local Insider Tips
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'tips' ? (
                    <LocalInsiderTips />
                ) : (
                    <>
                        {/* Featured Travelers showcase */}
                        <FeaturedTravelers />

                        {/* Divider */}
                        <div className='flex items-center gap-4 my-8'>
                            <div className='flex-1 h-px bg-gray-200' />
                            <span className='text-gray-500 text-sm font-medium'>Community Stories</span>
                            <div className='flex-1 h-px bg-gray-200' />
                        </div>


                        <Dialog open={showCreateForm} onOpenChange={(open) => {
                            if (!open) {
                                setShowCreateForm(false)
                                setEditingStory(null)
                                setFormData({ title: '', content: '', destination: '' })
                                setImagePreviews([])
                                setSelectedFiles([])
                                setPreviewImageIndex(0)
                            } else {
                                setShowCreateForm(true)
                            }
                        }}>
                            <DialogContent className='max-w-2xl overflow-y-auto max-h-[90vh]'>
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingStory ? 'Edit Story' : 'Create New Story'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Share your travel story with the community.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className='space-y-4'>
                                    <div className='space-y-2'>
                                        <Label htmlFor='title'>Story Title *</Label>
                                        <Input
                                            id='title'
                                            name='title'
                                            placeholder='My Amazing Trip to...'
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className='space-y-2'>
                                        <Label htmlFor='destination'>Destination *</Label>
                                        <Input
                                            id='destination'
                                            name='destination'
                                            placeholder='Paris, France'
                                            value={formData.destination}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className='space-y-2'>
                                        <Label htmlFor='images'>Upload Images (up to 5 images, optional)</Label>
                                        <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors'>
                                            <input
                                                id='images'
                                                type='file'
                                                accept='image/*'
                                                multiple
                                                onChange={handleFileChange}
                                                className='hidden'
                                            />
                                            <label htmlFor='images' className='cursor-pointer'>
                                                {imagePreviews.length > 0 ? (
                                                    <div className='space-y-4'>
                                                        {/* Main Preview */}
                                                        <div className='relative w-full h-64 mx-auto rounded-lg overflow-hidden'>
                                                            {imagePreviews[previewImageIndex] && (
                                                                <Image
                                                                    src={imagePreviews[previewImageIndex]}
                                                                    alt='Preview'
                                                                    fill
                                                                    className='object-cover'
                                                                />
                                                            )}
                                                            <div className='absolute top-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm'>
                                                                Preview Image
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Thumbnails */}
                                                        <div className='flex gap-2 flex-wrap justify-center'>
                                                            {imagePreviews.map((preview, index) => (
                                                                <div key={index} className='relative group'>
                                                                    <div
                                                                        className={`relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 ${
                                                                            previewImageIndex === index
                                                                                ? 'border-primary'
                                                                                : 'border-transparent hover:border-gray-300'
                                                                        }`}
                                                                        onClick={(e) => {
                                                                            e.preventDefault()
                                                                            setPreviewImageIndex(index)
                                                                        }}
                                                                    >
                                                                        {preview && (
                                                                            <Image
                                                                                src={preview}
                                                                                alt={`Thumbnail ${index + 1}`}
                                                                                fill
                                                                                className='object-cover'
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        type='button'
                                                                        onClick={(e) => {
                                                                            e.preventDefault()
                                                                            handleRemoveImage(index)
                                                                        }}
                                                                        className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                    {previewImageIndex === index && (
                                                                        <div className='absolute bottom-0 left-0 right-0 bg-primary text-white text-xs text-center py-0.5'>
                                                                            Preview
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <p className='text-sm text-gray-600'>
                                                            Click thumbnails to set preview • Click X to remove • Click here to add more
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className='space-y-2'>
                                                        <div className='flex justify-center'>
                                                            <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center'>
                                                                <ImageIcon className='text-gray-400' size={32} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className='text-sm font-medium text-gray-700'>
                                                                Click to upload images
                                                            </p>
                                                            <p className='text-xs text-gray-500 mt-1'>
                                                                PNG, JPG, WEBP up to 4MB each • Max 5 images
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    <div className='space-y-2'>
                                        <Label htmlFor='content'>Your Story *</Label>
                                        <Textarea
                                            id='content'
                                            name='content'
                                            placeholder='Share your travel experience, tips, and memories...'
                                            value={formData.content}
                                            onChange={handleInputChange}
                                            required
                                            className='min-h-[200px]'
                                        />
                                    </div>

                                    <Button type='submit' className='w-full' disabled={isUploading || !userDetail?._id}>
                                        {isUploading ? (
                                            <>
                                                <Upload className='mr-2 animate-spin' size={18} />
                                                Uploading...
                                            </>
                                        ) : !userDetail?._id ? (
                                            'Loading User Profile...'
                                        ) : (
                                            editingStory ? 'Update Story' : 'Publish Story'
                                        )}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                {/* Stories Grid */}
                <div className='grid md:grid-cols-2 gap-6'>
                    {stories?.map((story) => (
                        <StoryCard key={story._id} story={story} />
                    ))}
                </div>

                {stories?.length === 0 && (
                    <Card>
                        <CardContent className='py-12 text-center'>
                            <p className='text-gray-500 mb-4'>
                                No stories yet. Be the first to share your travel experience!
                            </p>
                            <Button onClick={() => setShowCreateForm(true)}>
                                <Plus size={20} className='mr-2' />
                                Create First Story
                            </Button>
                        </CardContent>
                    </Card>
                )}
                    </>
                )}

            </div>
        </div>
    )
}

export default CommunityPage
