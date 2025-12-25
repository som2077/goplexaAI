// ===========================================
// BOTTOMCARD COMPONENT - Screenshot Analysis Interface
// ===========================================
/**
 * BottomCard Component
 *
 * Handles the screenshot analysis workflow including:
 * - Screenshot capture and display
 * - Analysis state management
 * - User feedback during processing
 * - Error handling for image operations
 */

import { useState, useEffect, useRef } from "react";

// UI Components
import { Kbd } from "./ui/kbd";
import Content from "./Content";
import { Response } from "@/components/ui/response";

// ===========================================
// ELECTRON INTEGRATION - Desktop App Functionality
// ===========================================
/**
 * Electron-specific imports for desktop functionality
 * - ipcRenderer: For inter-process communication with main process
 * - fs: Node.js file system module for file operations
 *
 * Note: These are conditionally required to prevent errors in browser
 */
const { ipcRenderer } = window.require ? window.require("electron") : {};
const fs = window.require ? window.require("fs") : null;

// ===========================================
// MAIN COMPONENT
// ===========================================
const BottomCard = () => {
  // ========== STATE MANAGEMENT ==========

  // Tracks the path of the current screenshot
  const [screenshotPath, setScreenshotPath] = useState(null);

  // Tracks if there was an error loading/processing the image
  const [imageError, setImageError] = useState(false);

  /**
   * Processed path for displaying screenshot in UI
   * - Can be either:
   *   - Local file path (for Electron app)
   *   - Base64 data URL (for web version)
   *   - null (when no image is selected)
   * - Used by Content component to render the screenshot thumbnail
   */
  const [displayPath, setDisplayPath] = useState(null);

  // Analysis state
  const [analysisText, setAnalysisText] = useState(
    "Welcome to the screenshot analysis tool. Take a screenshot to get started."
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  /**
   * Analyzes the screenshot at the given path
   * @param {string} path - Path to the screenshot file
   */
  const analyzeScreenshot = async (path) => {
    // Set loading state
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisText("Processing screenshot...");

    try {
      if (!path) {
        console.error("No file path provided to analyzeScreenshot");
        setAnalysisError("No screenshot provided.");
        return;
      }
      if (!fs) {
        console.error("fs module not available in this environment");
        setAnalysisError("File system module not available.");
        return;
      }
      if (!fs.existsSync(path)) {
        console.error("File does not exist at path:", path);
        setAnalysisError("Screenshot file not found.");
        return;
      }

      let fileBuffer;
      try {
        fileBuffer = fs.readFileSync(path);
      } catch (readErr) {
        console.error("❌ Failed to read file:", readErr);
        setAnalysisError("Failed to read screenshot file.");
        return;
      }
      console.log("📁 Read file from disk", {
        bytes: fileBuffer.length,
        sizeMB: (fileBuffer.length / 1024 / 1024).toFixed(2),
      });

      const fileName = path.split(/[\/\\]/).pop() || "screenshot.png";
      // Create a Blob as PNG per integration requirements
      const blob = new Blob([fileBuffer], { type: "image/png" });

      const formData = new FormData();
      formData.append("file", blob, fileName);

      const startTime = Date.now();
      console.log(
        "🚀 Sending request to backend http://localhost:5000/api/analyze"
      );
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn("⌛ Request timeout reached (30s), aborting...");
        controller.abort();
      }, 30000);

      let response;
      try {
        response = await fetch("http://localhost:5000/api/analyze", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } catch (netErr) {
        clearTimeout(timeoutId);
        if (netErr.name === "AbortError") {
          console.error("❌ Network error: Request timed out");
          setAnalysisError("Request timed out. Please try again.");
        } else {
          console.error("❌ Network error during fetch:", netErr);
          setAnalysisError("Network error. Please check your connection.");
        }
        return;
      } finally {
        clearTimeout(timeoutId);
      }
      console.log("📨 Response status:", response.status);

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error("❌ Failed to parse JSON response:", parseErr);
        setAnalysisError("Invalid server response.");
        return;
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Request completed in ${duration}ms`);

      if (!response.ok) {
        const message =
          data?.error ||
          data?.message ||
          `Request failed with status ${response.status}`;
        setAnalysisError(message);
        return;
      }

      if (data && data.success === true && typeof data.answer === "string") {
        setAnalysisText(data.answer);
        setAnalysisError(null);
      } else if (data && data.success === false) {
        const message = data.error || "Analysis failed.";
        setAnalysisError(message);
      } else {
        console.error("❌ Invalid response format:", data);
        setAnalysisError("Invalid response format from server.");
      }
    } catch (error) {
      console.error("❌ Analysis failed:", error);
      setAnalysisError(
        error.message || "Failed to analyze screenshot. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processScreenshotPath = (inputPath) => {
    if (!inputPath) return null;

    console.log("Processing path:", inputPath);

    if (fs && fs.existsSync(inputPath)) {
      console.log("File exists at path:", inputPath);

      analyzeScreenshot(inputPath);

      if (process.platform === "win32") {
        return inputPath;
      } else {
        return `file://${inputPath}`;
      }
    } else {
      console.error("File does not exist at path:", inputPath);
      return null;
    }
  };

  const loadImageAsBase64 = (path) => {
    if (fs && path && fs.existsSync(path)) {
      try {
        const imageBuffer = fs.readFileSync(path);
        const base64Image = `data:image/png;base64,${imageBuffer.toString(
          "base64"
        )}`;
        setDisplayPath(base64Image);
        setImageError(false);
        console.log("Loaded image as base64");
        return true;
      } catch (err) {
        console.error("Failed to read image file:", err);
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    if (!ipcRenderer) {
      console.error("ipcRenderer not available");
      return;
    }

    const handleDisplayScreenshot = (event, receivedPath) => {
      console.log("BottomCard: Received screenshot path:", receivedPath);
      console.log(
        "BottomCard: Current displayPath before update:",
        displayPath
      );

      setImageError(false);
      setScreenshotPath(receivedPath);
      setAnalysisText("");
      setAnalysisError(null);

      if (receivedPath) {
        const processed = processScreenshotPath(receivedPath);
        console.log("BottomCard: Processed path:", processed);

        if (processed) {
          setDisplayPath(processed);
          console.log("BottomCard: Setting display path to:", processed);
        } else {
          console.log(
            "BottomCard: Failed to process path, setting image error"
          );
          setImageError(true);
        }
      } else {
        console.log("BottomCard: No received path provided");
      }
    };

    const handleNavigate = (event, url) => {
      console.log("BottomCard: Navigate to:", url);
      if (url && url.includes("screenshot")) {
        const extractedPath = url.replace(/^file:\/\/\/?/, "");
        handleDisplayScreenshot(event, extractedPath);
      }
    };

    ipcRenderer.on("display-screenshot", handleDisplayScreenshot);
    ipcRenderer.on("navigate-to", handleNavigate);

    console.log("BottomCard: Ready to receive screenshots");

    return () => {
      ipcRenderer.removeAllListeners("display-screenshot");
      ipcRenderer.removeAllListeners("navigate-to");
    };
  }, []);

  const handleImageError = (e) => {
    console.error("Image failed to load from:", e.target.src);
    console.error("Original path was:", screenshotPath);

    if (!imageError && screenshotPath) {
      if (process.platform === "win32" && screenshotPath.includes(" ")) {
        const encoded = screenshotPath
          .split("\\")
          .map((part) => encodeURIComponent(part).replace(/%3A/g, ":"))
          .join("/");
        const fileUrl = `file:///${encoded}`;
        console.log("Trying encoded URL:", fileUrl);
        setDisplayPath(fileUrl);
        setImageError(false);
        return;
      }

      console.log("Attempting base64 fallback automatically...");
      if (!loadImageAsBase64(screenshotPath)) {
        setImageError(true);
      }
    }
  };

  const handleImageLoad = () => {
    console.log("Screenshot loaded successfully!");
    setImageError(false);
  };

  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!ipcRenderer) return;

    const handleWindowShown = () => {
      console.log(
        "Window shown - restarting animation and ensuring interactivity"
      );
      setAnimationKey((prev) => prev + 1);

      setTimeout(() => {
        console.log("BottomCard components refreshed");
      }, 50);
    };

    const handleWindowHiding = () => {
      console.log("Window hiding - preparing for next show");
    };

    ipcRenderer.on("window-shown", handleWindowShown);
    ipcRenderer.on("window-hiding", handleWindowHiding);

    return () => {
      ipcRenderer.removeAllListeners("window-shown");
      ipcRenderer.removeAllListeners("window-hiding");
    };
  }, []);

  return (
    <div
      key={animationKey}
      className="w-full rounded-[23px] bg-black/60 border border-white/10  animate-fadeIn"
    >
      <div className="flex h-[680px]">
        <div className="flex flex-col flex-1 text-white">
          <Content
            analysisError={analysisError}
            isAnalyzing={isAnalyzing}
            analysisText={analysisText}
            screenshotPath={screenshotPath}
            displayPath={displayPath}
            imageError={imageError}
            handleImageError={handleImageError}
            handleImageLoad={handleImageLoad}
            ResponseComponent={Response}
          />
        </div>
      </div>
      <div className="flex opacity-50 justify-center items-center gap-2 text-xs mb-3 mt-2 text-gray-400">
        <Kbd>Ctrl</Kbd>
        <Kbd>/</Kbd>
      </div>
    </div>
  );
};

export default BottomCard;
