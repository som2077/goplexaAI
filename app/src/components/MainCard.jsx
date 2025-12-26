// ===========================================
// MAINCARD COMPONENT - Top bar with navigation
// ===========================================
// This component handles the top bar functionality and navigation
// It manages window dragging, settings, and navigation to content analysis

import React, { useEffect, useRef, useState } from "react";
import GlareHover from "./GlareHover";
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
                className="bg-[#0f0f0f] border-white/20 text-white mt-5 w-[274px]  "
                align="end"
                sideOffset={5}
              >
                <DropdownMenuLabel className="text-white font-semibold select-none">
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/20 mx-[1px]" />

                <DropdownMenuLabel className="text-white text-xs font-semibold select-none">
                  Profile
                </DropdownMenuLabel>

                <GlareHover className="mx-[5px] ">
                  <div className=" bg-black select-none gap-2  z-1 p-2 flex items-center justify-between">
                    <div className="flex items-center ">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-900 to-blue-500 flex items-center justify-center border border-white/20">
                        <svg
                          className="w-10 h-10 text-white"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-xs">somgoutam0@gmail.com</span>
                    <button className="bg-white hover:bg-gray-200 text-black text-xs font-semibold py-1 cursor-pointer px-[10px] rounded-full">
                      Show
                    </button>
                  </div>
                </GlareHover>

                {/* Keyboard Movement Instructions */}
                <DropdownMenuLabel className="text-white text-xs font-semibold select-none">
                  Keyboard Movement
                </DropdownMenuLabel>

                <div className=" bg-black  rounded-[10px] mx-[5px] p-1 mb-2 ">
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
                    <span className="text-xs">Show/Hide</span>
                    <div className="ml-2 flex gap-1">
                      <Kbd className="bg-white text-black">Ctrl</Kbd>
                      <Kbd className="bg-white text-black">/</Kbd>
                    </div>
                  </DropdownMenuLabel>

                  {/* Normal Move with Arrow Keys */}
                  <DropdownMenuLabel className="text-white flex items-center justify-between select-none">
                    <span className="text-xs">Move</span>
                    <div className="ml-2 flex gap-1">
                      <Kbd className="bg-white text-black">↑</Kbd>
                      <Kbd className="bg-white text-black">↓</Kbd>
                      <Kbd className="bg-white text-black">←</Kbd>
                      <Kbd className="bg-white text-black">→</Kbd>
                    </div>
                  </DropdownMenuLabel>

                  {/* Fast Move with Shift + Arrow Keys */}
                  <DropdownMenuLabel className="text-white flex items-center justify-between select-none">
                    <span className="text-xs">Fast Move</span>
                    <div className="ml-2 flex gap-1">
                      <Kbd className="bg-white text-black">Shift</Kbd>
                      <Kbd className="bg-white text-black">↑</Kbd>
                      <Kbd className="bg-white text-black">↓</Kbd>
                      <Kbd className="bg-white text-black">←</Kbd>
                      <Kbd className="bg-white text-black">→</Kbd>
                    </div>
                  </DropdownMenuLabel>
                </div>

                <DropdownMenuSeparator className="bg-white/20 mx-[1px]" />
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
