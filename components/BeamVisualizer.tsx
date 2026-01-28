import React, { useEffect, useRef } from "react";
import { BeamParticle } from "../types";

interface BeamVisualizerProps {
  intensity: number; // 0 to 1 base intensity
  analyser?: AnalyserNode | null; // Optional audio analyser for reactivity
}

const BeamVisualizer: React.FC<BeamVisualizerProps> = ({
  intensity,
  analyser,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: BeamParticle[] = [];
    const dataArray = analyser
      ? new Uint8Array(analyser.frequencyBinCount)
      : null;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const createParticle = (): BeamParticle => {
      const x = Math.random() * canvas.width;
      const y = canvas.height + Math.random() * 100;
      return {
        id: Math.random(),
        x,
        y,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 2 + 1 + intensity * 3,
        opacity: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.8 ? "#FFD700" : "#FDB931",
      };
    };

    // Initial population
    for (let i = 0; i < 50; i++) {
      particles.push(createParticle());
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Audio Reactivity Calculation
      let audioMultiplier = 1;
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        // Map average (0-255) to a multiplier (1.0 - 2.5)
        audioMultiplier = 1 + (avg / 255) * 3;
      }

      // Dynamic Beam Width based on Audio
      const centerX = canvas.width / 2;
      const beamWidth = (200 + intensity * 100) * audioMultiplier;

      // Draw Central Beam
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, `rgba(253, 185, 49, ${0.1 * audioMultiplier})`);
      gradient.addColorStop(1, "rgba(253, 185, 49, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(centerX - beamWidth / 2, canvas.height);
      ctx.lineTo(centerX + beamWidth / 2, canvas.height);
      ctx.lineTo(centerX + beamWidth * 0.2, 0);
      ctx.lineTo(centerX - beamWidth * 0.2, 0);
      ctx.closePath();
      ctx.fill();

      // Update and draw particles
      particles.forEach((p, index) => {
        p.y -= p.speed * audioMultiplier; // Speed up with audio
        p.opacity -= 0.002;

        ctx.beginPath();
        // Particles grow with audio
        const currentSize =
          p.size * (audioMultiplier > 1.2 ? audioMultiplier * 1.5 : 1);
        ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${p.opacity})`;
        ctx.fill();

        // Reset particle
        if (p.y < -10 || p.opacity <= 0) {
          particles[index] = createParticle();
          if (Math.random() > 0.3) {
            particles[index].x = centerX + (Math.random() - 0.5) * beamWidth;
          }
        }
      });

      // Add more particles based on intensity & audio
      const targetCount =
        (50 + intensity * 200) * (audioMultiplier > 1.2 ? 1.5 : 1);

      if (particles.length < targetCount) {
        particles.push(createParticle());
      } else if (particles.length > targetCount) {
        particles.pop();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, analyser]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 mix-blend-screen"
    />
  );
};

export default BeamVisualizer;
