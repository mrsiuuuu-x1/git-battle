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

  const handleWhatsAppShare = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setShowDropdown(false);
  };

  const handleLinkedInShare = () => {
    const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(liUrl, "_blank", "noopener,noreferrer,width=550,height=420");
    setShowDropdown(false);
  };

  const handleSlackShare = () => {
    const slackUrl = `https://slack.com/intl/en-in/share?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`;
    window.open(slackUrl, "_blank", "noopener,noreferrer,width=550,height=420");
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
              onClick={handleWhatsAppShare}
              className="retro-font text-[10px] text-white hover:text-[#25d366] cursor-pointer flex items-center gap-2 px-2 py-1 hover:bg-white/10 transition-colors"
            >
              <WhatsAppIcon size={12} /> WHATSAPP
            </button>
            <button
              onClick={handleLinkedInShare}
              className="retro-font text-[10px] text-white hover:text-[#0a66c2] cursor-pointer flex items-center gap-2 px-2 py-1 hover:bg-white/10 transition-colors"
            >
              <LinkedInIcon size={12} /> LINKEDIN
            </button>
            <button
              onClick={handleSlackShare}
              className="retro-font text-[10px] text-white hover:text-[#e01e5a] cursor-pointer flex items-center gap-2 px-2 py-1 hover:bg-white/10 transition-colors"
            >
              <SlackIcon size={12} /> SLACK
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

function WhatsAppIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1C4.13 1 1 4.13 1 8c0 1.23.32 2.4.93 3.44L1 15l3.64-.93C5.6 14.68 6.77 15 8 15c3.87 0 7-3.13 7-7s-3.13-7-7-7zm3.53 9.88c-.15.42-.87.8-1.2.85-.33.05-.63.15-2.07-.44-1.74-.72-2.85-2.5-2.94-2.62-.09-.11-.7-.93-.7-1.78s.44-1.26.6-1.43c.16-.17.35-.21.47-.21h.34c.11 0 .26-.04.4.31.15.35.52 1.27.57 1.36.05.09.08.2.02.31-.06.12-.1.19-.19.29-.09.1-.2.23-.28.31-.09.09-.19.19-.08.37.11.18.48.8 1.04 1.29.71.63 1.31.83 1.5.92.18.09.29.08.4-.05.11-.13.46-.54.58-.72.12-.18.25-.15.42-.09.17.06 1.09.51 1.28.61.18.09.31.14.35.21.05.08.05.45-.1.87z" />
    </svg>
  );
}

function LinkedInIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3.5A1.5 1.5 0 013.5 2 1.5 1.5 0 015 3.5 1.5 1.5 0 013.5 5 1.5 1.5 0 012 3.5zM2 7h3v7H2V7zm5 0h2.8v1h.04c.4-.7 1.36-1.5 2.8-1.5C15.1 6.5 16 8.2 16 10.6V14h-3v-3c0-.8 0-1.8-1.1-1.8S10.5 10 10.5 11v3H7V7z" />
    </svg>
  );
}

function SlackIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.4 10.2a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0zm.6 0a1.2 1.2 0 112.4 0v3a1.2 1.2 0 11-2.4 0v-3zM5.8 3.4a1.2 1.2 0 110-2.4 1.2 1.2 0 010 2.4zm0 .6a1.2 1.2 0 110 2.4h-3a1.2 1.2 0 110-2.4h3zM12.6 5.8a1.2 1.2 0 112.4 0 1.2 1.2 0 01-2.4 0zm-.6 0a1.2 1.2 0 11-2.4 0v-3a1.2 1.2 0 112.4 0v3zM10.2 12.6a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zm0-.6a1.2 1.2 0 110-2.4h3a1.2 1.2 0 110 2.4h-3z" />
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
