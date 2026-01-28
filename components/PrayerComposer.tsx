import React, { useState, useRef } from "react";
import { PrayerStyle } from "../types";
import { Wand2, Send, Sparkles, Mic, Square } from "lucide-react";

interface PrayerComposerProps {
  onGenerate: (
    topic: string,
    recipient: string,
    style: PrayerStyle,
    audioBlob?: Blob
  ) => Promise<void>;
  isGenerating: boolean;
}

const PrayerComposer: React.FC<PrayerComposerProps> = ({
  onGenerate,
  isGenerating,
}) => {
  const [topic, setTopic] = useState("");
  const [recipient, setRecipient] = useState("");
  const [style, setStyle] = useState<PrayerStyle>(PrayerStyle.Uplifting);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop()); // Stop mic
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAudioBlob(null); // Clear previous
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recipient && (topic || audioBlob)) {
      onGenerate(topic, recipient, style, audioBlob || undefined);
      // Reset after send
      setTopic("");
      setAudioBlob(null);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />

      <div className="mb-6 text-center">
        <h3 className="text-xl font-medium text-white mb-2 flex items-center justify-center gap-2">
          <Sparkles size={20} className="text-yellow-400" />
          Compose a Beam
        </h3>
        <p className="text-slate-400 text-sm">
          Use text or voice to articulate your intent.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 ml-1 uppercase tracking-wider">
            Who is this for?
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="e.g., My Mother, The World, A Friend"
            className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all placeholder-slate-600"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1 ml-1">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
              Your Intention
            </label>
            {audioBlob && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <Mic size={10} /> Audio Recorded
              </span>
            )}
          </div>

          <div className="relative">
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                audioBlob
                  ? "Using audio for intention..."
                  : "Type your intention here..."
              }
              disabled={!!audioBlob}
              className={`w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all placeholder-slate-600 h-24 resize-none ${
                audioBlob ? "opacity-50" : ""
              }`}
            />

            {/* Mic Button Overlay */}
            <div className="absolute bottom-3 right-3">
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full transition-all animate-pulse"
                  title="Stop Recording"
                >
                  <Square size={18} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={
                    audioBlob ? () => setAudioBlob(null) : startRecording
                  } // Click to clear if exists
                  className={`${
                    audioBlob
                      ? "bg-green-500/80 hover:bg-red-500/80"
                      : "bg-slate-700 hover:bg-yellow-600"
                  } text-white p-2 rounded-full transition-all`}
                  title={audioBlob ? "Clear Audio" : "Record Voice"}
                >
                  {audioBlob ? (
                    <Mic size={18} className="text-white" />
                  ) : (
                    <Mic size={18} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 ml-1 uppercase tracking-wider">
            Vibe
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.values(PrayerStyle).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all border ${
                  style === s
                    ? "bg-yellow-500/20 border-yellow-500 text-yellow-200"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isGenerating || (!topic && !audioBlob) || !recipient}
          className={`w-full py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
            isGenerating
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-yellow-600 to-yellow-400 text-slate-900 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40"
          }`}
        >
          {isGenerating ? (
            <>
              <Wand2 className="animate-spin" size={20} />
              Crafting Light...
            </>
          ) : (
            <>
              <Send size={20} />
              Generate & Send Beam
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default PrayerComposer;
