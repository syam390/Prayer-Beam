export interface Prayer {
  id: string;
  topic: string;
  recipient: string;
  content: string;
  createdAt: number;
  imageUrl?: string;
  audioBuffer?: AudioBuffer;
  style: PrayerStyle;
}

export enum PrayerStyle {
  Uplifting = "Uplifting",
  Comforting = "Comforting",
  Gratitude = "Gratitude",
  Healing = "Healing",
  Guidance = "Guidance",
}

export interface BeamParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
}

export interface UserStats {
  beamsSent: number;
  prayersGenerated: number;
}
