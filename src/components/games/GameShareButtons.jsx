import React, { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function GameShareButtons({ page, title }) {
  const [copied, setCopied] = useState(false);

  const getUrl = () => `${window.location.origin}${createPageUrl(page)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(getUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = getUrl();
    if (navigator.share) {
      await navigator.share({ title, url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-200 hover:bg-cyan-600 hover:text-white transition-colors"
      >
        {copied ? <Check className="w-3 h-3 text-green-300" /> : <Copy className="w-3 h-3" />}
        {copied ? "¡Copiado!" : "Copiar link"}
      </button>
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-200 hover:bg-cyan-600 hover:text-white transition-colors"
      >
        <Share2 className="w-3 h-3" />
        Compartir
      </button>
    </div>
  );
}