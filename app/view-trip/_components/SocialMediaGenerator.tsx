"use client"

import React, { useState } from 'react'
import { useQuery, useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Instagram, Facebook, MessageCircle, Download, Sparkles, Loader2, Upload, Image as ImageIcon, MapPin, Hash, Copy, Check, X } from 'lucide-react'
import { Id } from '@/convex/_generated/dataModel'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UploadButton } from '@/utils/uploadthing'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Props {
    tripId: string
    userId: Id<"UserTable">
}

interface GeneratedPost {
    caption: string
    hashtags: string[]
    location: string
    selectedPhotos: string[] // URLs of photos selected by AI
    photoArrangement: string // Description of how to arrange photos
}

export default function SocialMediaGenerator({ tripId, userId }: Props) {
    const [isGenerating, setIsGenerating] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [selectedPlatform, setSelectedPlatform] = useState<'instagram_post' | 'instagram_carousel' | 'facebook_post' | 'whatsapp_status'>('instagram_post')
    const [customPrompt, setCustomPrompt] = useState('')
    const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
    const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null)
    const [showPreview, setShowPreview] = useState(false)
    const [copiedText, setCopiedText] = useState(false)

    const generatePost = useAction(api.socialMedia.generateCompletePost)
    const savePost = useAction(api.socialMedia.saveGeneratedPost)

    const handlePhotoUpload = (res: any) => {
        const newPhotos = res.map((file: any) => file.url)
        setUploadedPhotos(prev => [...prev, ...newPhotos])
        setIsUploading(false)
    }

    const handleRemovePhoto = (photoUrl: string) => {
        setUploadedPhotos(prev => prev.filter(url => url !== photoUrl))
    }

    const handleGeneratePost = async () => {
        if (!tripId || uploadedPhotos.length === 0) {
            alert('Please upload at least one photo')
            return
        }

        setIsGenerating(true)
        setGeneratedPost(null)
        try {
            const result = await generatePost({
                tripId,
                userId,
                platform: selectedPlatform,
                photoUrls: uploadedPhotos,
                customPrompt: customPrompt || undefined,
            })
            
            setGeneratedPost({
                caption: result.caption || '',
                hashtags: result.hashtags || [],
                location: result.location || '',
                selectedPhotos: result.selectedPhotos || uploadedPhotos.slice(0, 10),
                photoArrangement: result.photoArrangement || 'Standard grid layout'
            })
            setShowPreview(true)
        } catch (error) {
            console.error('Generate post error:', error)
            alert('Failed to generate post. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleCopyCaption = () => {
        if (!generatedPost) return
        const fullCaption = `${generatedPost.caption}\n\n${generatedPost.hashtags.join(' ')}\n📍 ${generatedPost.location}`
        navigator.clipboard.writeText(fullCaption)
        setCopiedText(true)
        setTimeout(() => setCopiedText(false), 2000)
    }

    const handleSavePost = async () => {
        if (!generatedPost) return
        try {
            await savePost({
                tripId,
                userId,
                platform: selectedPlatform,
                caption: generatedPost.caption,
                hashtags: generatedPost.hashtags,
                location: generatedPost.location,
                photoUrls: generatedPost.selectedPhotos
            })
            alert('Post saved successfully!')
        } catch (error) {
            console.error('Save post error:', error)
            alert('Failed to save post')
        }
    }

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'instagram_post':
            case 'instagram_carousel':
                return <Instagram className='w-5 h-5' />
            case 'facebook_post':
                return <Facebook className='w-5 h-5' />
            case 'whatsapp_status':
                return <MessageCircle className='w-5 h-5' />
            default:
                return <Instagram className='w-5 h-5' />
        }
    }

    const getPlatformName = (platform: string) => {
        switch (platform) {
            case 'instagram_post': return 'Instagram Single Post'
            case 'instagram_carousel': return 'Instagram Carousel (Multi-Photo)'
            case 'facebook_post': return 'Facebook Post'
            case 'whatsapp_status': return 'WhatsApp Status'
            default: return 'Social Media'
        }
    }

    const getPlatformPhotoLimit = (platform: string) => {
        switch (platform) {
            case 'instagram_post': return 1
            case 'instagram_carousel': return 10
            case 'facebook_post': return 10
            case 'whatsapp_status': return 1
            default: return 10
        }
    }

    return (
        <div className='max-w-5xl mx-auto space-y-6 p-4'>
            <div className='text-center'>
                <h2 className='text-2xl sm:text-3xl font-bold text-gray-900 flex items-center justify-center gap-2'>
                    <Sparkles className='w-7 h-7 text-purple-600' />
                    AI Social Media Post Generator
                </h2>
                <p className='text-sm text-gray-600 mt-2'>Upload photos → AI creates complete post with caption, hashtags & location</p>
            </div>

            <Card className='p-6'>
                <div className='space-y-6'>
                    {/* Platform Selection */}
                    <div>
                        <label className='text-sm font-medium text-gray-700 mb-2 block'>Choose Platform</label>
                        <Select value={selectedPlatform} onValueChange={(value: any) => setSelectedPlatform(value)}>
                            <SelectTrigger className='w-full'><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value='instagram_post'>
                                    <div className='flex items-center gap-2'>
                                        <Instagram className='w-4 h-4 text-purple-600' />
                                        Instagram Single Post (1 photo)
                                    </div>
                                </SelectItem>
                                <SelectItem value='instagram_carousel'>
                                    <div className='flex items-center gap-2'>
                                        <Instagram className='w-4 h-4 text-pink-600' />
                                        Instagram Carousel (up to 10 photos)
                                    </div>
                                </SelectItem>
                                <SelectItem value='facebook_post'>
                                    <div className='flex items-center gap-2'>
                                        <Facebook className='w-4 h-4 text-blue-600' />
                                        Facebook Post (up to 10 photos)
                                    </div>
                                </SelectItem>
                                <SelectItem value='whatsapp_status'>
                                    <div className='flex items-center gap-2'>
                                        <MessageCircle className='w-4 h-4 text-green-600' />
                                        WhatsApp Status (1 photo)
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className='text-xs text-gray-500 mt-1'>
                            Selected platform supports up to {getPlatformPhotoLimit(selectedPlatform)} photo(s)
                        </p>
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <label className='text-sm font-medium text-gray-700 mb-2 block'>Upload Trip Photos</label>
                        <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                            <Upload className='w-12 h-12 text-gray-400 mx-auto mb-3' />
                            <p className='text-sm text-gray-600 mb-3'>Upload all your trip photos</p>
                            <UploadButton
                                endpoint="imageUploader"
                                onClientUploadComplete={handlePhotoUpload}
                                onUploadBegin={() => setIsUploading(true)}
                                onUploadError={(error: Error) => {
                                    alert(`Upload error: ${error.message}`)
                                    setIsUploading(false)
                                }}
                                appearance={{
                                    button: "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm",
                                    allowedContent: "text-xs text-gray-500"
                                }}
                            />
                            {isUploading && <p className='text-xs text-purple-600 mt-2'>Uploading...</p>}
                        </div>

                        {/* Uploaded Photos Grid */}
                        {uploadedPhotos.length > 0 && (
                            <div className='mt-4'>
                                <p className='text-sm font-medium text-gray-700 mb-2'>
                                    Uploaded Photos ({uploadedPhotos.length})
                                </p>
                                <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3'>
                                    {uploadedPhotos.map((photo, index) => (
                                        <div key={index} className='relative group'>
                                            <img 
                                                src={photo} 
                                                alt={`Trip photo ${index + 1}`}
                                                className='w-full h-24 object-cover rounded-lg'
                                            />
                                            <button
                                                onClick={() => handleRemovePhoto(photo)}
                                                className='absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
                                            >
                                                <X className='w-4 h-4' />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Custom Prompt */}
                    <div>
                        <label className='text-sm font-medium text-gray-700 mb-2 block'>Custom Instructions (Optional)</label>
                        <Textarea 
                            placeholder='e.g., "Focus on food and culture", "Make it funny", "Highlight adventure activities"...' 
                            value={customPrompt} 
                            onChange={(e) => setCustomPrompt(e.target.value)} 
                            rows={3} 
                            className='w-full' 
                        />
                        <p className='text-xs text-gray-500 mt-1'>Tell AI what to emphasize in your post</p>
                    </div>

                    {/* Generate Button */}
                    <Button 
                        onClick={handleGeneratePost} 
                        disabled={isGenerating || uploadedPhotos.length === 0}
                        className='w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6' 
                        size='lg'
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                                AI is Creating Your Post...
                            </>
                        ) : (
                            <>
                                <Sparkles className='w-5 h-5 mr-2' />
                                Generate Complete Post with AI
                            </>
                        )}
                    </Button>
                </div>
            </Card>

            {/* Preview Dialog */}
            {generatedPost && (
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                    <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
                        <DialogHeader>
                            <DialogTitle className='flex items-center gap-2'>
                                {getPlatformIcon(selectedPlatform)}
                                Your {getPlatformName(selectedPlatform)} is Ready!
                            </DialogTitle>
                        </DialogHeader>

                        <div className='space-y-6'>
                            {/* Selected Photos */}
                            <div>
                                <h3 className='font-semibold text-gray-900 mb-2 flex items-center gap-2'>
                                    <ImageIcon className='w-5 h-5 text-purple-600' />
                                    AI Selected Photos ({generatedPost.selectedPhotos.length})
                                </h3>
                                <p className='text-xs text-gray-600 mb-3'>{generatedPost.photoArrangement}</p>
                                <div className='grid grid-cols-3 sm:grid-cols-4 gap-2'>
                                    {generatedPost.selectedPhotos.map((photo, index) => (
                                        <div key={index} className='relative'>
                                            <img 
                                                src={photo} 
                                                alt={`Selected ${index + 1}`}
                                                className='w-full h-24 object-cover rounded-lg'
                                            />
                                            <span className='absolute top-1 left-1 bg-purple-600 text-white text-xs px-2 py-1 rounded'>
                                                {index + 1}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Caption */}
                            <div>
                                <h3 className='font-semibold text-gray-900 mb-2 flex items-center gap-2'>
                                    <Sparkles className='w-5 h-5 text-purple-600' />
                                    AI Generated Caption
                                </h3>
                                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                                    <p className='whitespace-pre-wrap text-gray-800 leading-relaxed'>{generatedPost.caption}</p>
                                </div>
                            </div>

                            {/* Hashtags */}
                            <div>
                                <h3 className='font-semibold text-gray-900 mb-2 flex items-center gap-2'>
                                    <Hash className='w-5 h-5 text-blue-600' />
                                    Hashtags ({generatedPost.hashtags.length})
                                </h3>
                                <div className='flex flex-wrap gap-2'>
                                    {generatedPost.hashtags.map((tag, index) => (
                                        <span key={index} className='bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm'>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <h3 className='font-semibold text-gray-900 mb-2 flex items-center gap-2'>
                                    <MapPin className='w-5 h-5 text-red-600' />
                                    Location Tag
                                </h3>
                                <p className='bg-red-50 border border-red-200 rounded-lg p-3 text-gray-800'>
                                    📍 {generatedPost.location}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className='flex gap-3 pt-4 border-t'>
                                <Button 
                                    onClick={handleCopyCaption}
                                    variant='outline'
                                    className='flex-1'
                                >
                                    {copiedText ? (
                                        <>
                                            <Check className='w-4 h-4 mr-2 text-green-600' />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className='w-4 h-4 mr-2' />
                                            Copy Full Caption
                                        </>
                                    )}
                                </Button>
                                <Button 
                                    onClick={handleSavePost}
                                    className='flex-1 bg-purple-600 hover:bg-purple-700'
                                >
                                    <Download className='w-4 h-4 mr-2' />
                                    Save Post
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Info Cards */}
            <Card className='p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'>
                <h3 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                    <Sparkles className='w-5 h-5 text-purple-600' />
                    How AI Creates Your Perfect Post
                </h3>
                <ol className='text-sm text-gray-700 space-y-2 list-decimal list-inside'>
                    <li><strong>Analyzes your trip details</strong> - destination, activities, dates, highlights</li>
                    <li><strong>Reviews all uploaded photos</strong> - selects best photos based on quality & variety</li>
                    <li><strong>Generates engaging caption</strong> - storytelling with emojis & your trip personality</li>
                    <li><strong>Adds trending hashtags</strong> - platform-specific, location & activity tags</li>
                    <li><strong>Suggests photo arrangement</strong> - optimal layout for maximum engagement</li>
                    <li><strong>Includes location tags</strong> - exact places from your itinerary</li>
                </ol>
            </Card>

            <Card className='p-4 bg-yellow-50 border-yellow-200'>
                <h3 className='font-semibold text-yellow-900 mb-2'>📸 Pro Tips for Best Results</h3>
                <ul className='text-sm text-yellow-800 space-y-1'>
                    <li>• Upload 10-20 photos for best AI selection</li>
                    <li>• Mix different types: landscapes, food, selfies, activities</li>
                    <li>• Upload high-quality photos (AI picks the best ones)</li>
                    <li>• AI automatically removes duplicates & blurry photos</li>
                </ul>
            </Card>
        </div>
    )
}
