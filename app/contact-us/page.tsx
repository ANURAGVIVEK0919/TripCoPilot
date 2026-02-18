"use client"
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, MapPin, Phone, Send } from 'lucide-react'

function ContactUs() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        
        // Simulate form submission
        setTimeout(() => {
            setIsSubmitting(false)
            setSubmitStatus('success')
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: ''
            })
            
            // Reset success message after 5 seconds
            setTimeout(() => {
                setSubmitStatus('idle')
            }, 5000)
        }, 1000)
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4'>
            <div className='max-w-7xl mx-auto'>
                {/* Header */}
                <div className='text-center mb-12'>
                    <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>
                        Get in Touch
                    </h1>
                    <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
                        Have questions about planning your perfect trip? We're here to help you create unforgettable travel experiences.
                    </p>
                </div>

                <div className='grid md:grid-cols-3 gap-8 mb-12'>
                    {/* Contact Info Cards */}
                    <Card className='hover:shadow-lg transition-shadow'>
                        <CardHeader>
                            <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4'>
                                <Mail className='text-blue-600' size={24} />
                            </div>
                            <CardTitle className='text-xl'>Email Us</CardTitle>
                            <CardDescription>Send us an email anytime</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <a href="mailto:support@aitripplanner.com" className='text-blue-600 hover:underline'>
                                support@aitripplanner.com
                            </a>
                        </CardContent>
                    </Card>

                    <Card className='hover:shadow-lg transition-shadow'>
                        <CardHeader>
                            <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4'>
                                <Phone className='text-green-600' size={24} />
                            </div>
                            <CardTitle className='text-xl'>Call Us</CardTitle>
                            <CardDescription>Mon-Fri from 8am to 5pm</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <a href="tel:+1234567890" className='text-blue-600 hover:underline'>
                                +1 (234) 567-890
                            </a>
                        </CardContent>
                    </Card>

                    <Card className='hover:shadow-lg transition-shadow'>
                        <CardHeader>
                            <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4'>
                                <MapPin className='text-purple-600' size={24} />
                            </div>
                            <CardTitle className='text-xl'>Visit Us</CardTitle>
                            <CardDescription>Come say hello</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className='text-gray-600'>
                                123 Travel Street<br />
                                San Francisco, CA 94102
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Contact Form */}
                <Card className='max-w-3xl mx-auto shadow-xl'>
                    <CardHeader>
                        <CardTitle className='text-2xl'>Send us a Message</CardTitle>
                        <CardDescription>
                            Fill out the form below and we'll get back to you as soon as possible.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className='space-y-6'>
                            <div className='grid md:grid-cols-2 gap-4'>
                                <div className='space-y-2'>
                                    <Label htmlFor='name'>Full Name *</Label>
                                    <Input
                                        id='name'
                                        name='name'
                                        type='text'
                                        placeholder='John Doe'
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className='w-full'
                                    />
                                </div>
                                <div className='space-y-2'>
                                    <Label htmlFor='email'>Email Address *</Label>
                                    <Input
                                        id='email'
                                        name='email'
                                        type='email'
                                        placeholder='john@example.com'
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        className='w-full'
                                    />
                                </div>
                            </div>

                            <div className='space-y-2'>
                                <Label htmlFor='subject'>Subject *</Label>
                                <Input
                                    id='subject'
                                    name='subject'
                                    type='text'
                                    placeholder='How can we help you?'
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    required
                                    className='w-full'
                                />
                            </div>

                            <div className='space-y-2'>
                                <Label htmlFor='message'>Message *</Label>
                                <Textarea
                                    id='message'
                                    name='message'
                                    placeholder='Tell us more about your inquiry...'
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    required
                                    className='w-full min-h-[150px]'
                                />
                            </div>

                            {submitStatus === 'success' && (
                                <div className='bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg'>
                                    ✓ Thank you for your message! We'll get back to you soon.
                                </div>
                            )}

                            {submitStatus === 'error' && (
                                <div className='bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg'>
                                    ✗ Something went wrong. Please try again.
                                </div>
                            )}

                            <Button 
                                type='submit' 
                                className='w-full md:w-auto'
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className='mr-2'>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className='mr-2' size={18} />
                                        Send Message
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* FAQ Section */}
                <div className='mt-16 text-center'>
                    <h2 className='text-2xl font-bold mb-4'>Frequently Asked Questions</h2>
                    <p className='text-gray-600 mb-6'>
                        Check out our{' '}
                        <a href='/faq' className='text-blue-600 hover:underline'>
                            FAQ page
                        </a>
                        {' '}for quick answers to common questions.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ContactUs
