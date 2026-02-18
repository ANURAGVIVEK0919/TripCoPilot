"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Upload, X, Loader2, Check, AlertCircle } from 'lucide-react'
import { createWorker } from 'tesseract.js'

interface ReceiptScannerProps {
    onExtractData: (data: {
        amount: number | null
        description: string
        date: string
    }) => void
    onClose: () => void
}

export default function ReceiptScanner({ onExtractData, onClose }: ReceiptScannerProps) {
    const [image, setImage] = useState<string | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const [progress, setProgress] = useState(0)
    const [extractedText, setExtractedText] = useState('')
    const [error, setError] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Image size must be less than 5MB')
                return
            }

            const reader = new FileReader()
            reader.onload = (event) => {
                setImage(event.target?.result as string)
                setError('')
            }
            reader.readAsDataURL(file)
        }
    }

    const extractDataFromText = (text: string) => {
        console.log('Extracted text:', text)

        // Extract amount (look for currency symbols and numbers)
        const amountPatterns = [
            /(?:USD|US\$|\$|EUR|€|GBP|£|INR|₹)\s*(\d+(?:[.,]\d{2})?)/gi,
            /(?:total|amount|sum|price|cost)[\s:]*(?:USD|US\$|\$|EUR|€|GBP|£|INR|₹)?\s*(\d+(?:[.,]\d{2})?)/gi,
            /(\d+[.,]\d{2})\s*(?:USD|US\$|\$|EUR|€|GBP|£|INR|₹)?/gi,
        ]

        let amount: number | null = null
        for (const pattern of amountPatterns) {
            const matches = text.match(pattern)
            if (matches && matches.length > 0) {
                // Get the last match (usually the total)
                const lastMatch = matches[matches.length - 1]
                const numberMatch = lastMatch.match(/(\d+(?:[.,]\d{2})?)/)
                if (numberMatch) {
                    amount = parseFloat(numberMatch[1].replace(',', '.'))
                    break
                }
            }
        }

        // Extract date
        const datePatterns = [
            /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/,
            /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/,
            /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i,
        ]

        let date = new Date().toISOString().split('T')[0]
        for (const pattern of datePatterns) {
            const match = text.match(pattern)
            if (match) {
                try {
                    const dateObj = new Date(match[0])
                    if (!isNaN(dateObj.getTime())) {
                        date = dateObj.toISOString().split('T')[0]
                        break
                    }
                } catch (e) {
                    console.log('Date parsing error:', e)
                }
            }
        }

        // Extract merchant/description (first line that's not just numbers)
        const lines = text.split('\n').filter(line => line.trim().length > 0)
        let description = 'Receipt expense'
        for (const line of lines.slice(0, 5)) {
            if (line.length > 3 && line.length < 50 && !/^\d+$/.test(line)) {
                description = line.trim()
                break
            }
        }

        return { amount, description, date }
    }

    const scanReceipt = async () => {
        if (!image) return

        setIsScanning(true)
        setProgress(0)
        setError('')

        try {
            const worker = await createWorker('eng', 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100))
                    }
                },
            })

            const { data: { text } } = await worker.recognize(image)
            await worker.terminate()

            setExtractedText(text)

            // Extract structured data
            const extractedData = extractDataFromText(text)
            
            if (!extractedData.amount) {
                setError('Could not detect amount. Please enter manually.')
            }

            onExtractData(extractedData)
            
        } catch (err: any) {
            console.error('OCR Error:', err)
            setError('Failed to scan receipt. Please try again or enter manually.')
        } finally {
            setIsScanning(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Camera className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Scan Receipt</h2>
                            <p className="text-xs text-gray-500">Upload and extract expense details</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Upload Area */}
                    {!image && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                        >
                            <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <p className="text-lg font-medium text-gray-700 mb-2">
                                Upload Receipt Image
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                                Click to select or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">
                                Supports JPG, PNG (Max 5MB)
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Image Preview */}
                    {image && !isScanning && (
                        <div className="space-y-4">
                            <div className="relative rounded-xl overflow-hidden border">
                                <img
                                    src={image}
                                    alt="Receipt"
                                    className="w-full h-auto max-h-96 object-contain bg-gray-50"
                                />
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                        setImage(null)
                                        setExtractedText('')
                                        setError('')
                                    }}
                                    className="absolute top-2 right-2"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Remove
                                </Button>
                            </div>

                            <Button
                                onClick={scanReceipt}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                size="lg"
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                Scan Receipt
                            </Button>
                        </div>
                    )}

                    {/* Scanning Progress */}
                    {isScanning && (
                        <div className="space-y-4">
                            <div className="text-center py-8">
                                <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
                                <p className="text-lg font-medium text-gray-700 mb-2">
                                    Scanning Receipt...
                                </p>
                                <p className="text-sm text-gray-500 mb-4">
                                    Extracting text using OCR
                                </p>
                                <div className="max-w-xs mx-auto">
                                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">{progress}%</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success/Error Messages */}
                    {error && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-yellow-800">
                                    Partial Detection
                                </p>
                                <p className="text-xs text-yellow-700 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {extractedText && !isScanning && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Check className="w-5 h-5 text-green-600" />
                                <p className="text-sm font-medium text-green-800">
                                    Receipt Scanned Successfully!
                                </p>
                            </div>
                            <details className="text-xs text-green-700 mt-2">
                                <summary className="cursor-pointer hover:text-green-800">
                                    View extracted text
                                </summary>
                                <pre className="mt-2 bg-white p-2 rounded border text-xs overflow-x-auto max-h-32">
                                    {extractedText}
                                </pre>
                            </details>
                        </div>
                    )}

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-xs text-blue-800">
                            <strong>💡 Tips for best results:</strong>
                            <br />• Ensure receipt is clear and well-lit
                            <br />• Avoid shadows and glare
                            <br />• Capture the entire receipt
                            <br />• Numbers should be clearly visible
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
