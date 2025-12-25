import React, { useState } from "react";

const New = () => {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleScreenshot = () => {
    if (window.require) {
      const { ipcRenderer } = window.require("electron");

      // Show capturing state
      setIsCapturing(true);

      // Send message to main process to trigger snip.py
      ipcRenderer.send("trigger-screenshot");

      // Listen for screenshot result
      ipcRenderer.once("screenshot-result", (event, result) => {
        setIsCapturing(false);

        if (result.success) {
          console.log("Screenshot saved:", result.path);
          // You can do something with the screenshot path here
          // For example, show a notification or display the image

          // Optional: Send path to BottomCard to display
          // ipcRenderer.send("navigate-bottom-card", `file://${result.path}`);
        } else {
          console.error("Screenshot failed:", result.error);
          // alert(`Screenshot failed: ${result.error}`);
        }
      });

      // Reset state if screenshot is cancelled
      ipcRenderer.once("screenshot-cancelled", () => {
        setIsCapturing(false);
        console.log("Screenshot cancelled");
      });
    } else {
      console.error("Electron IPC not available");
      alert("Screenshot feature is only available in the desktop app");
    }
  };

  return (
    <button
      onClick={handleScreenshot}
      disabled={isCapturing}
      className={`ml-2 flex font-medium -webkit-app-region-no-drag items-center gap-1 px-3 py-3 
        ${
          isCapturing
            ? "bg-blue-500 text-white cursor-wait"
            : "bg-[#121212] text-white hover:bg-[#ffffff] hover:text-black"
        } 
        rounded-full text-sm transition-all duration-200
        disabled:opacity-50 disabled:cursor-wait
        active:scale-95`}
      title={isCapturing ? "Capturing..." : "Take Screenshot"}
      aria-label="Take Screenshot"
    >
      {isCapturing ? (
        // Loading/Capturing Icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 animate-pulse"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
          <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z" />
        </svg>
      ) : (
        // Original Plus Icon - you can change to camera icon if preferred
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
        </svg>
      )}
    </button>
  );
};

export default New;
