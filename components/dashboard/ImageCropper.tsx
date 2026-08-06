'use client'
import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Check } from 'lucide-react'

// Helper to load the image securely
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })

export function ImageCropper({ image, onCancel, onSave }: any) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setLoading(true)
    try {
      const img = await createImage(image)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas to the exact cropped size
      canvas.width = croppedAreaPixels.width
      canvas.height = croppedAreaPixels.height

      // Draw the cropped portion of the image onto the canvas
      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      )

      // Convert the canvas into a JPEG file blob
      canvas.toBlob((blob) => {
        if (blob) onSave(blob)
      }, 'image/jpeg', 0.95)
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
        <h3 className="font-heading font-bold text-xl text-black">Adjust your photo</h3>
        
        {/* The Cropper Area */}
        <div className="relative h-80 bg-ast-surface rounded-xl overflow-hidden border border-black/8">
          <Cropper 
            image={image} 
            crop={crop} 
            zoom={zoom} 
            aspect={1} 
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop} 
            onZoomChange={setZoom} 
            onCropComplete={onCropComplete} 
          />
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center pt-2">
          <input 
            type="range" 
            value={zoom} 
            min={1} 
            max={3} 
            step={0.1} 
            aria-label="Zoom" 
            onChange={(e) => setZoom(Number(e.target.value))} 
            className="w-1/2 accent-ast-primary"
          />
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={loading} className="px-5 py-2.5 text-sm font-semibold text-ast-gray hover:text-black transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 bg-ast-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-ast-dark transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : <><Check size={16} /> Save</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}