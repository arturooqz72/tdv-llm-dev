import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ZoomIn, ZoomOut, Upload, Loader2 } from 'lucide-react';

export default function BannerEditor({ isOpen, onClose, onSave }) {
  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const imageRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target.result);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e) => {
    if (!image) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = async () => {
    if (!image) return;

    setUploading(true);
    try {
      // Convertir la imagen editada a blob
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = async () => {
        canvas.width = 1200;
        canvas.height = 400;
        
        const scale = zoom;
        const offsetX = position.x;
        const offsetY = position.y;
        
        ctx.drawImage(
          img,
          offsetX / scale,
          offsetY / scale,
          canvas.width / scale,
          canvas.height / scale,
          0,
          0,
          canvas.width,
          canvas.height
        );
        
        canvas.toBlob(async (blob) => {
          const file = new File([blob], 'banner.jpg', { type: 'image/jpeg' });
          await onSave(file);
          setUploading(false);
          handleClose();
        }, 'image/jpeg', 0.9);
      };
      
      img.src = image;
    } catch (error) {
      console.error('Error al guardar:', error);
      setUploading(false);
    }
  };

  const handleClose = () => {
    setImage(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Editar Banner</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!image ? (
            <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Upload className="w-12 h-12 text-gray-400 mb-2" />
              <p className="text-gray-600">Haz clic para subir una imagen</p>
            </label>
          ) : (
            <>
              {/* Vista previa */}
              <div 
                className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  ref={imageRef}
                  src={image}
                  alt="Preview"
                  className="absolute"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                    transformOrigin: 'top left',
                    userSelect: 'none',
                    pointerEvents: 'none'
                  }}
                />
              </div>

              {/* Controles de zoom */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-5 h-5 text-gray-600" />
                  <Slider
                    value={[zoom]}
                    onValueChange={(value) => setZoom(value[0])}
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="flex-1"
                  />
                  <ZoomIn className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-600 w-12">{Math.round(zoom * 100)}%</span>
                </div>
              </div>

              <p className="text-sm text-gray-500 text-center">
                Arrastra la imagen para reposicionar | Usa el control para hacer zoom
              </p>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!image || uploading}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Banner'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}