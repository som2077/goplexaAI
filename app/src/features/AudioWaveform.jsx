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

  const analyzeAudio = () => {
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const numBars = 13;
    const centerIndex = Math.floor(numBars / 2);

    const detectFrequencies = () => {
      analyserRef.current.getByteFrequencyData(dataArray);

      const barWidth = Math.floor(bufferLength / (numBars / 2 + 1));
      const newHeights = [];

      // Calculate heights for each bar based on actual audio frequencies
      for (let i = 0; i <= centerIndex; i++) {
        const start = i * barWidth;
        const end = start + barWidth;

        let sum = 0;
        for (let j = start; j < end; j++) {
          sum += dataArray[j];
        }
        const average = sum / barWidth;
        const normalized = average / 255;

        // Smooth transitions
        const easingFactor = 0.3;
        smoothedHeightsRef.current[i] +=
          (normalized - smoothedHeightsRef.current[i]) * easingFactor;

        newHeights.push(smoothedHeightsRef.current[i]);
      }

      // Create symmetric pattern
      const symmetricHeights = [
        ...newHeights.slice(1).reverse(),
        newHeights[0],
        ...newHeights.slice(1),
      ];

      setBarHeights(symmetricHeights);
      animationFrameRef.current = requestAnimationFrame(detectFrequencies);
    };

    detectFrequencies();
  };

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
      {/* Waveform bars with constrained height */}
      <div className="flex items-center justify-center gap-1 ml-[20px] select-none h-[60px]">
        {barHeights.map((height, index) => {
          const centerIndex = Math.floor(barHeights.length / 2);
          const distanceFromCenter = Math.abs(index - centerIndex);

          // Min height 7px, max height 40px (stays within 60px container)
          const minHeight = 7;
          const maxHeight = 40;
          const barHeight = minHeight + height * (maxHeight - minHeight);

          const opacity = 0.8 - distanceFromCenter * 0.1;

          return (
            <motion.div
              key={index}
              className="bg-white rounded-full focus:outline-none focus:ring-0 active:outline-none transition"
              style={{
                width: "4px",
                opacity: opacity,
              }}
              animate={{
                height: `${barHeight}px`,
              }}
              transition={{
                duration: 0.01,
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

      {error && <div className="text-xs text-red-400">{error}</div>}
    </div>
  );
};

export default AudioWaveform;
