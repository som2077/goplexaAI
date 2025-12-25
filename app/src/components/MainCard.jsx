// ===========================================
// MAINCARD COMPONENT - Top bar with navigation
// ===========================================
// This component handles the top bar functionality and navigation
// It manages window dragging, settings, and navigation to content analysis

import React, { useEffect, useRef, useState } from "react";
import New from "../features/New";
import AudioWaveform from "../features/AudioWaveform";
import moreWhiteIcon from "../assets/more_white.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Kbd } from "./ui/kbd";

// ===========================================
// MAINCARD COMPONENT - Top bar with navigation
// ===========================================
// This component handles the top bar functionality and navigation
// It manages window dragging, settings, and navigation to content analysis
const Maincard = () => {
  // Refs for window dragging functionality
  const isDraggingRef = useRef(false); // Track if window is currently being dragged
  const startXRef = useRef(0); // Store initial mouse X position when drag starts
  const dragAreaRef = useRef(null); // Reference to the draggable area element

  // Main useEffect for setting up event listeners and window dragging
  useEffect(() => {
    // Check if running in Electron environment
    if (window.require) {
      const { ipcRenderer } = window.require("electron");

      // Handle mouse down event to start window dragging
      const handleMouseDown = (e) => {
        // Check if click is on interactive element (don't drag if clicking buttons/inputs)
        if (
          e.target.closest("button") || // Any button element
          e.target.closest("a") || // Any link element
          e.target.closest("input") || // Any input field
          e.target.closest("svg") || // Any SVG icon
          e.target.closest('[role="button"]') || // Elements with button role
          e.target.closest(".New") || // New component area
          e.target.closest('[class*="webkit-app-region-no-drag"]') // Non-draggable areas
        ) {
          return; // Don't start dragging if clicking on interactive elements
        }

        console.log("Mouse down detected - starting drag");
        isDraggingRef.current = true; // Mark that dragging has started
        startXRef.current = e.screenX; // Store initial mouse X position

        // Add global mouse event listeners for drag movement
        document.addEventListener("mousemove", handleMouseMove, true);
        document.addEventListener("mouseup", handleMouseUp, true);

        e.preventDefault(); // Prevent default browser behavior
        e.stopPropagation(); // Stop event from bubbling up
      };

      // Handle mouse move event during window dragging
      const handleMouseMove = (e) => {
        // Only proceed if we're currently dragging
        if (!isDraggingRef.current) return;

        const mouseX = e.screenX; // Current mouse X position on screen
        const windowWidth = 300; // Width of the top bar window (matches topBarWindow.js)
        let newX = mouseX - windowWidth / 2; // Calculate new window X position (center on mouse)

        const screenWidth = window.screen.width; // Get total screen width

        // Boundary checking - prevent window from going off screen
        if (newX < 0) {
          newX = 0; // Don't allow negative X position
        }

        if (newX + windowWidth > screenWidth) {
          newX = screenWidth - windowWidth; // Don't allow window to go beyond right edge
        }

        console.log(
          "Mouse X:",
          mouseX,
          "Window X:",
          newX,
          "Window Width:",
          windowWidth
        );
        // Send new position to main process to move the window
        ipcRenderer.send("topbar-move", { x: newX, y: 0 });

        e.preventDefault(); // Prevent default browser behavior
        e.stopPropagation(); // Stop event from bubbling up
      };

      // Handle mouse up event to stop window dragging
      const handleMouseUp = (e) => {
        console.log("Mouse up detected - stopping drag");
        isDraggingRef.current = false; // Mark that dragging has stopped

        // Remove global mouse event listeners
        document.removeEventListener("mousemove", handleMouseMove, true);
        document.removeEventListener("mouseup", handleMouseUp, true);

        e.preventDefault(); // Prevent default browser behavior
        e.stopPropagation(); // Stop event from bubbling up
      };

      // Get reference to the draggable area element
      const dragArea = dragAreaRef.current;

      // Add mouse down event listener to the draggable area
      if (dragArea) {
        dragArea.addEventListener("mousedown", handleMouseDown);
      }

      // Cleanup function - runs when component unmounts or dependencies change
      return () => {
        // Remove event listeners to prevent memory leaks
        if (dragArea) {
          dragArea.removeEventListener("mousedown", handleMouseDown);
        }
        document.removeEventListener("mousemove", handleMouseMove, true);
        document.removeEventListener("mouseup", handleMouseUp, true);
        // ipcRenderer.removeAllListeners("settings-dialog-closed"); // COMMENTED OUT
      };
    }
  }, []); // Empty dependency array - runs only once on mount

  const sendToBottomCard = (url) => {
    if (window.require) {
      const { ipcRenderer } = window.require("electron");
      ipcRenderer.send("navigate-bottom-card", url);
    }
  };

  // Main component render
  return (
    // Main container - full width and height with centered content
    <div className="">
      {/* Draggable top bar container */}
      <div
        ref={dragAreaRef} // Reference for drag functionality
        className="w-[300px] h-[59px] bg-black/85 flex items-center border border-white/20 rounded-[10px] "
      >
        {/* New button component - prevents event propagation */}
        <div
          className="pointer-events-auto"
          onClick={(e) => e.stopPropagation()} // Prevent drag when clicking New button
        >
          <New />
        </div>

        {/* Audio waveform component container */}
        <div className="flex items-center ml-2 bg-[#121212] rounded-full focus:outline-none focus:ring-0 active:outline-none transition">
          <AudioWaveform />
        </div>

        {/* Settings dropdown container */}
        <div className="flex items-center ml-[17px] select-none cursor-pointer">
          <div onClick={(e) => e.stopPropagation()}>
            {/* Prevent drag when clicking settings */}
            <DropdownMenu className="shadow-none">
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center justify-center cursor-pointer focus:outline-none focus:ring-0 active:outline-none    transition-colors"
                  // title="Settings"
                >
                  <img
                    src={moreWhiteIcon}
                    alt="More"
                    className="w-[17px] h-[17px]"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-60 bg-[#0f0f0f] border-white/20 text-white mt-4 "
                align="end"
                sideOffset={5}
              >
                <DropdownMenuLabel className="text-white font-semibold select-none">
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/20" />
                {/* Window Control */}
                <DropdownMenuLabel
                  className="text-white flex items-center justify-between select-none"
                  onClick={() => {
                    // Toggle window visibility
                    if (window.require) {
                      const { ipcRenderer } = window.require("electron");
                      ipcRenderer.send("toggle-bottomcard");
                    }
                  }}
                >
                  <span>Show/Hide</span>
                  <div className="ml-2 flex gap-1">
                    <Kbd>Ctrl</Kbd>
                    <Kbd>/</Kbd>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-white/20" />

                {/* Keyboard Movement Instructions */}
                <DropdownMenuLabel className="text-white font-semibold select-none">
                  Keyboard Movement
                </DropdownMenuLabel>

                {/* Fast Move with Shift + Arrow Keys */}
                <DropdownMenuLabel className="text-white flex items-center justify-between select-none">
                  <span>Fast Move</span>
                  <div className="ml-2 flex gap-1">
                    <Kbd>Shift</Kbd>
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd>
                    <Kbd>←</Kbd>
                    <Kbd>→</Kbd>
                  </div>
                </DropdownMenuLabel>

                {/* Normal Move with Arrow Keys */}
                <DropdownMenuLabel className="text-white flex items-center justify-between select-none">
                  <span>Move</span>
                  <div className="ml-2 flex gap-1">
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd>
                    <Kbd>←</Kbd>
                    <Kbd>→</Kbd>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-white/20" />
                {/* // GitHub */}
                <DropdownMenuItem
                  className="text-white hover:bg-white/10 cursor-pointer"
                  onClick={() => {
                    if (window.require) {
                      const { shell } = window.require("electron");
                      shell.openExternal(
                        "https://github.com/yourusername/gopelxa"
                      );
                    }
                  }}
                >
                  GitHub
                </DropdownMenuItem>
                {/* // Feedback */}
                <DropdownMenuItem
                  className="text-white hover:bg-white/10 cursor-pointer"
                  onClick={() => {
                    if (window.require) {
                      const { shell } = window.require("electron");
                      shell.openExternal(
                        "https://github.com/yourusername/gopelxa/issues"
                      );
                    }
                  }}
                >
                  Feedback
                </DropdownMenuItem>
                {/* // Visit Website */}
                <DropdownMenuItem
                  className="text-white hover:bg-white/10 cursor-pointer"
                  onClick={() => {
                    if (window.require) {
                      const { shell } = window.require("electron");
                      shell.openExternal("https://goplexa.com");
                    }
                  }}
                >
                  Visit Website
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/20" />
                {/* // Exit Application */}
                <DropdownMenuItem
                  className="text-red-400 hover:bg-red-500/20 cursor-pointer"
                  onClick={() => {
                    if (window.require) {
                      const { ipcRenderer } = window.require("electron");
                      ipcRenderer.send("close-topbar");
                    }
                  }}
                >
                  Exit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maincard;
