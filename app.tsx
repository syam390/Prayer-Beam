import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import BeamVisualizer from "./components/BeamVisualizer";
import PrayerComposer from "./components/PrayerComposer";
import PrayerCard from "./components/PrayerCard";
import { Prayer, PrayerStyle } from "./types";
import {
  generatePrayerText,
  generatePrayerAudio,
  generatePrayerImage,
} from "./services/geminiService";
import { Sun, Radio, Wind, Volume2, VolumeX } from "lucide-react";

const App: React.FC = () => {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [beamIntensity, setBeamIntensity] = useState(0.2);
  const [activeAudio, setActiveAudio] = useState<string | null>(null);

  // Audio System
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    // Initialize AudioContext
    audioContextRef.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)({ sampleRate: 24000 });

    // Create Analyser for Visuals
    if (audioContextRef.current) {
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      setAnalyser(analyserRef.current);
    }

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Helper to convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // remove "data:audio/wav;base64," prefix
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleGeneratePrayer = async (
    topic: string,
    recipient: string,
    style: PrayerStyle,
    audioBlob?: Blob
  ) => {
    setIsGenerating(true);
    setBeamIntensity(0.8);

    try {
      let audioBase64: string | undefined;
      if (audioBlob) {
        audioBase64 = await blobToBase64(audioBlob);
      }

      const text = await generatePrayerText(
        recipient,
        style,
        topic,
        audioBase64
      );

      const [imageUrl, audioBuffer] = await Promise.all([
        generatePrayerImage(topic || style, style),
        generatePrayerAudio(text),
      ]);

      const newPrayer: Prayer = {
        id: crypto.randomUUID(),
        topic: topic || "Voice Intention",
        recipient,
        content: text,
        createdAt: Date.now(),
        imageUrl: imageUrl,
        audioBuffer: audioBuffer || undefined,
        style,
      };

      setPrayers((prev) => [newPrayer, ...prev]);
    } catch (error) {
      console.error("Failed to generate beam payload", error);
      alert("The spiritual channels are congested. Please try again.");
    } finally {
      setIsGenerating(false);
      setBeamIntensity(0.3);
    }
  };

  const playAudio = (buffer: AudioBuffer, id: string) => {
    if (!audioContextRef.current) return;

    // Stop current
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }

    if (activeAudio === id) {
      setActiveAudio(null);
      return;
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;

    // Connect Source -> Analyser -> Destination
    if (analyserRef.current) {
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    } else {
      source.connect(audioContextRef.current.destination);
    }

    source.onended = () => {
      setActiveAudio(null);
    };

    source.start();
    sourceNodeRef.current = source;
    setActiveAudio(id);
  };

  return (
    <div className="relative min-h-screen font-sans text-slate-100 overflow-x-hidden selection:bg-yellow-500/30">
      {/* Background & Visualizer (Reactive to Analyser) */}
      <BeamVisualizer intensity={beamIntensity} analyser={analyser} />

      {/* Overlay */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-slate-900/0 via-slate-900/50 to-slate-900 z-0"></div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Navbar */}
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sun className="text-yellow-400 w-10 h-10 animate-pulse-slow" />
              <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-40"></div>
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
                Prayer Beam
              </h1>
              <p className="text-xs text-yellow-200/70 tracking-widest uppercase">
                Spiritual Nexus
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
              <Radio
                size={12}
                className={
                  isGenerating
                    ? "text-green-400 animate-pulse"
                    : "text-slate-500"
                }
              />
              STATUS: {isGenerating ? "CONNECTING..." : "ONLINE"}
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 space-y-8">
            <div className="lg:sticky lg:top-8">
              <div className="mb-8">
                <h2 className="text-4xl md:text-5xl font-serif font-medium leading-tight mb-4">
                  Send a Beam of <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">
                    Pure Light
                  </span>
                </h2>
                <p className="text-lg text-slate-300 leading-relaxed">
                  Speak or type your deepest intentions. Generate a personalized
                  prayer, visualize it as light, and send it into the digital
                  ether.
                </p>
              </div>

              <PrayerComposer
                onGenerate={handleGeneratePrayer}
                isGenerating={isGenerating}
              />

              <div className="mt-8 flex items-center justify-center gap-4 text-slate-500 text-sm">
                <Wind size={16} />
                <span>{prayers.length} beams sent this session</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif text-white/80">Recent Beams</h3>
              <div className="h-[1px] flex-1 bg-white/10 ml-6"></div>
            </div>

            <div className="space-y-8 min-h-[500px]">
              {prayers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl">
                  <Sun size={48} className="mb-4 opacity-20" />
                  <p className="text-lg">No beams active yet.</p>
                  <p className="text-sm">Be the first to ignite the light.</p>
                </div>
              ) : (
                prayers.map((prayer) => (
                  <PrayerCard
                    key={prayer.id}
                    prayer={prayer}
                    onPlayAudio={(buffer) => playAudio(buffer, prayer.id)}
                    isPlaying={activeAudio === prayer.id}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
