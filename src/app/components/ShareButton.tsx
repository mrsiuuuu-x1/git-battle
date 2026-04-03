"use client";

import { useState } from "react";

interface ShareButtonProps {
  text: string;
  url?: string;
  variant?: "victory" | "defeat" | "default";
  size?: "sm" | "md";
}

export default function ShareButton({ text, url, variant = "default", size = "md" }: ShareButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.origin : "");

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text, url: shareUrl });
      } catch {
        // User cancelled share
      }
      setShowDropdown(false);
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer,width=550,height=420");
    setShowDropdown(false);
  };

  const handleCopyLink = async () => {
    const copyText = `${text}\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = copyText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowDropdown(false);
  };

  const baseColors = variant === "victory"
    ? "bg-[#845ec2] text-white border-black hover:bg-[#6b4a9e]"
    : variant === "defeat"
      ? "bg-[#4ecdc4] text-black border-black hover:bg-[#3dbdb5]"
      : "bg-[#4ecdc4] text-black border-black hover:bg-[#3dbdb5]";

  const sizeClasses = size === "sm"
    ? "px-3 py-1 text-[10px] border-2"
    : "px-6 py-2 text-xs border-4";

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (typeof navigator.share === "function") {
            handleNativeShare();
          } else {
            setShowDropdown(!showDropdown);
          }
        }}
        className={`${baseColors} ${sizeClasses} pixel-shadow retro-font cursor-pointer hover:-translate-y-0.5 transition-all flex items-center gap-2`}
      >
        <ShareIcon size={size === "sm" ? 12 : 16} />
        {copied ? "COPIED!" : "SHARE"}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black border-4 border-white p-2 flex flex-col gap-2 z-50 min-w-[140px]">
            <button
              onClick={handleTwitterShare}
              className="retro-font text-[10px] text-white hover:text-[#1da1f2] cursor-pointer flex items-center gap-2 px-2 py-1 hover:bg-white/10 transition-colors"
            >
              <XIcon size={12} /> POST ON X
            </button>
            <button
              onClick={handleCopyLink}
              className="retro-font text-[10px] text-white hover:text-[#4ecdc4] cursor-pointer flex items-center gap-2 px-2 py-1 hover:bg-white/10 transition-colors"
            >
              <CopyIcon size={12} /> {copied ? "COPIED!" : "COPY TEXT"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Inline pixel-style SVG icons to match the retro theme

function ShareIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="1" width="4" height="4" fill="currentColor" />
      <rect x="1" y="6" width="4" height="4" fill="currentColor" />
      <rect x="11" y="6" width="4" height="4" fill="currentColor" />
      <rect x="5" y="4" width="2" height="3" fill="currentColor" />
      <rect x="9" y="4" width="2" height="3" fill="currentColor" />
    </svg>
  );
}

function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1h3l4 5.5L12 1h3l-5.5 7L15 15h-3l-4-5.5L4 15H1l5.5-7L1 1z" />
    </svg>
  );
}

function CopyIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="2" />
      <path d="M2 10V3a1 1 0 011-1h7" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
