import React, { useState, useEffect } from "react";
import { Prayer } from "../types";
import { Play, Pause, Share2, Heart } from "lucide-react";

interface PrayerCardProps {
  prayer: Prayer;
  onPlayAudio: (buffer: AudioBuffer) => void;
  isPlaying: boolean;
}

const PrayerCard: React.FC<PrayerCardProps> = ({
  prayer,
  onPlayAudio,
  isPlaying,
}) => {
  const [liked, setLiked] = useState(false);

  return (
    <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl transition-all hover:scale-[1.02] duration-300 w-full max-w-2xl mx-auto my-8">
      {/* Background Image Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 opacity-40 transition-opacity duration-700 group-hover:opacity-50"
        style={{
          backgroundImage: prayer.imageUrl ? `url(${prayer.imageUrl})` : "none",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent z-0" />

      <div className="relative z-10 p-8 flex flex-col items-center text-center space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2 text-yellow-400 text-sm font-medium tracking-widest uppercase">
            <span className="w-8 h-[1px] bg-yellow-400/50"></span>
            <span>{prayer.style}</span>
            <span className="w-8 h-[1px] bg-yellow-400/50"></span>
          </div>
          <h2 className="text-2xl font-serif text-white/90">
            For {prayer.recipient}
          </h2>
        </div>

        {/* Content */}
        <p className="text-xl md:text-2xl font-serif leading-relaxed text-yellow-50/90 italic">
          "{prayer.content}"
        </p>

        {/* Timestamp */}
        <p className="text-xs text-slate-400">
          Generated on {new Date(prayer.createdAt).toLocaleDateString()}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          {prayer.audioBuffer && (
            <button
              onClick={() => onPlayAudio(prayer.audioBuffer!)}
              className={`p-4 rounded-full transition-all duration-300 ${
                isPlaying
                  ? "bg-yellow-500 text-slate-900 shadow-[0_0_20px_rgba(234,179,8,0.5)]"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {isPlaying ? (
                <Pause size={24} fill="currentColor" />
              ) : (
                <Play size={24} fill="currentColor" />
              )}
            </button>
          )}

          <button
            onClick={() => setLiked(!liked)}
            className={`p-4 rounded-full transition-all duration-300 ${
              liked
                ? "text-red-400 bg-red-400/10"
                : "text-slate-300 bg-white/5 hover:bg-white/10"
            }`}
          >
            <Heart size={24} fill={liked ? "currentColor" : "none"} />
          </button>

          <button
            className="p-4 rounded-full text-slate-300 bg-white/5 hover:bg-white/10 transition-all duration-300"
            onClick={() => {
              navigator.clipboard.writeText(prayer.content);
              // In a real app, use a toast
              alert("Prayer copied to clipboard");
            }}
          >
            <Share2 size={24} />
          </button>
        </div>
      </div>

      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-yellow-400/50 shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
    </div>
  );
};

export default PrayerCard;
