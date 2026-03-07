import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareButton() {
  const [copied, setCopied] = useState(false);
  const appUrl = window.location.origin;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TEAM DESVELADOS LLDM',
          text: 'Únete a nuestra comunidad LLDM todos son bienvenidos',
          url: appUrl
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    toast.success('Link copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleShare}
        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Compartir App
      </Button>
      <Button
        onClick={handleCopy}
        variant="outline"
        className="border-yellow-600 text-yellow-500 hover:bg-yellow-600 hover:text-black"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Copiado
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" />
            Copiar Link
          </>
        )}
      </Button>
    </div>
  );
}