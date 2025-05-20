import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  audioData: Uint8Array;
  width?: number;
  height?: number;
  barWidth?: number;
  barGap?: number;
  barColor?: string;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioData,
  width = 300,
  height = 100,
  barWidth = 4,
  barGap = 2,
  barColor = '#ef4444', // Red color
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Set the fill style
    ctx.fillStyle = barColor;

    // Calculate the number of bars based on canvas width, bar width, and gap
    const totalBarWidth = barWidth + barGap;
    const numBars = Math.min(Math.floor(width / totalBarWidth), audioData.length);

    // Draw the bars
    for (let i = 0; i < numBars; i++) {
      // Normalize the audio data to fit within canvas height
      const value = audioData[i];
      const percent = value / 255;
      const barHeight = percent * height;

      // Calculate x position for each bar
      const x = i * totalBarWidth;

      // Draw the bar from the bottom of the canvas
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
    }
  }, [audioData, width, height, barWidth, barGap, barColor]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`rounded-lg ${className}`}
    />
  );
};

export default AudioVisualizer; 