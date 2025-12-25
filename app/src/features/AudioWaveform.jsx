import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import stopRedIcon from "../assets/stop.svg";
import startWhiteIcon from "../assets/start_white.svg";

const AudioWaveform = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [barHeights, setBarHeights] = useState(Array(13).fill(0));
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationFrameRef = useRef(null);
  const smoothedHeightsRef = useRef(Array(13).fill(0));
  const [error, setError] = useState(null);

  // Start microphone capture
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current =
        audioContextRef.current.createMediaStreamSource(stream);

      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.75;
      microphoneRef.current.connect(analyserRef.current);

      setIsRecording(true);
      analyzeAudio();
      setError(null);
    } catch (err) {
      console.error("Microphone access denied:", err);
      setError("Please allow microphone access to use this feature.");
    }
  };

  // Stop microphone and cleanup
  const stopListening = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (microphoneRef.current?.mediaStream) {
      microphoneRef.current.mediaStream
        .getTracks()
        .forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsRecording(false);
    setBarHeights(Array(13).fill(0));
    smoothedHeightsRef.current = Array(13).fill(0);
  };

  // Analyze audio and create symmetric wave pattern
  const analyzeAudio = () => {
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const numBars = 13;
    const centerIndex = Math.floor(numBars / 2);

    const detectFrequencies = () => {
      analyserRef.current.getByteFrequencyData(dataArray);

      // Get different frequency ranges for variety
      const barWidth = Math.floor(bufferLength / (numBars / 2 + 1));
      const newHeights = [];

      for (let i = 0; i <= centerIndex; i++) {
        const start = i * barWidth;
        const end = start + barWidth;

        let sum = 0;
        for (let j = start; j < end; j++) {
          sum += dataArray[j];
        }
        const average = sum / barWidth;
        const normalized = average / 255;

        // Apply smoothing
        const easingFactor = 0.25;
        smoothedHeightsRef.current[i] +=
          (normalized - smoothedHeightsRef.current[i]) * easingFactor;

        newHeights.push(smoothedHeightsRef.current[i]);
      }

      // Create symmetric pattern: left side, center, right side (mirror)
      const symmetricHeights = [
        ...newHeights.slice(1).reverse(), // Left side (excluding center)
        newHeights[0], // Center bar
        ...newHeights.slice(1), // Right side
      ];

      setBarHeights(symmetricHeights);
      animationFrameRef.current = requestAnimationFrame(detectFrequencies);
    };

    detectFrequencies();
  };

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    return () => stopListening();
  }, []);

  return (
    <div className="audio-waveform-container select-none">
      {/* Static centered soundwave */}
      <div className="flex items-center justify-center gap-1 ml-[20px] select-none">
        {barHeights.map((height, index) => {
          const centerIndex = Math.floor(barHeights.length / 2);
          const distanceFromCenter = Math.abs(index - centerIndex);

          // Center bar is tallest, others gradually smaller
          const heightMultiplier = 1 - distanceFromCenter * 0.15;
          const barHeight = 7 + height * 60 * heightMultiplier;

          // Center bar is brightest
          const opacity = 1 - distanceFromCenter * 0.1;

          return (
            <motion.div
              key={index}
              className="bg-white rounded-full focus:outline-none focus:ring-0 active:outline-none transition"
              style={{
                width: "4px",
                opacity: opacity,
                // boxShadow:
                //   height > 0.1
                //     ? `0 0 ${height * 10}px rgba(255, 255, 255, ${
                //         height * 0.7
                //       })`
                //     : "none",
              }}
              animate={{
                height: `${barHeight}px`,
              }}
              transition={{
                duration: 0.075,
                ease: "easeOut",
              }}
            />
          );
        })}
      </div>

      {/* Start/Stop Button */}
      <button
        onClick={toggleRecording}
        disabled={!!error}
        className={`
          px-[6px] py-[6px] rounded-full 
          flex items-center justify-center focus:outline-none focus:ring-0 active:outline-none transition
          -webkit-app-region-no-drag 
          text-white
          ${error ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {isRecording ? (
          <div className="wave-container select-none">
            <div className="circle delay1"></div>
            <div className="circle delay2"></div>
            <div className="circle delay3"></div>
            <div className="circle delay4"></div>
            <img
              className="w-[35px] h-[35px] relative z-10 select-none"
              src={stopRedIcon}
              alt="Stop"
            />
          </div>
        ) : (
          <img
            className="w-[35px] h-[35px] select-none"
            src={startWhiteIcon}
            alt="Start"
          />
        )}
      </button>

      {/* Error message */}
      {error && <div className="text-xs text-red-400">{error}</div>}
    </div>
  );
};

export default AudioWaveform;
