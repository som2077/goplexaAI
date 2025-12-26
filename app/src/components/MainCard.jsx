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
                  className="text-white hover:bg-white/10 cursor-pointer text-sm gap-2"
                  onClick={() => {
                    if (window.require) {
                      const { shell } = window.require("electron");
                      shell.openExternal(
                        "https://github.com/yourusername/gopelxa"
                      );
                    }
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.49933 0.25C3.49635 0.25 0.25 3.49593 0.25 7.50024C0.25 10.703 2.32715 13.4206 5.2081 14.3797C5.57084 14.446 5.70302 14.2222 5.70302 14.0299C5.70302 13.8576 5.69679 13.4019 5.69323 12.797C3.67661 13.235 3.25112 11.825 3.25112 11.825C2.92132 10.9874 2.44599 10.7644 2.44599 10.7644C1.78773 10.3149 2.49584 10.3238 2.49584 10.3238C3.22353 10.375 3.60629 11.0711 3.60629 11.0711C4.25298 12.1788 5.30335 11.8588 5.71638 11.6732C5.78225 11.205 5.96962 10.8854 6.17658 10.7043C4.56675 10.5209 2.87415 9.89918 2.87415 7.12104C2.87415 6.32925 3.15677 5.68257 3.62053 5.17563C3.54576 4.99226 3.29697 4.25521 3.69174 3.25691C3.69174 3.25691 4.30015 3.06196 5.68522 3.99973C6.26337 3.83906 6.8838 3.75895 7.50022 3.75583C8.1162 3.75895 8.73619 3.83906 9.31523 3.99973C10.6994 3.06196 11.3069 3.25691 11.3069 3.25691C11.7026 4.25521 11.4538 4.99226 11.3795 5.17563C11.8441 5.68257 12.1245 6.32925 12.1245 7.12104C12.1245 9.9063 10.4292 10.5192 8.81452 10.6985C9.07444 10.9224 9.30633 11.3648 9.30633 12.0413C9.30633 13.0102 9.29742 13.7922 9.29742 14.0299C9.29742 14.2239 9.42828 14.4496 9.79591 14.3788C12.6746 13.4179 14.75 10.7025 14.75 7.50024C14.75 3.49593 11.5036 0.25 7.49933 0.25Z"
                      fill="currentColor"
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span className="text-xs">GitHub</span>
                </DropdownMenuItem>

                {/* // Visit Website */}
                <DropdownMenuItem
                  className="text-white hover:bg-white/10 cursor-pointer text-sm gap-2"
                  onClick={() => {
                    if (window.require) {
                      const { shell } = window.require("electron");
                      shell.openExternal("https://goplexa.com");
                    }
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.49996 1.80002C4.35194 1.80002 1.79996 4.352 1.79996 7.50002C1.79996 10.648 4.35194 13.2 7.49996 13.2C10.648 13.2 13.2 10.648 13.2 7.50002C13.2 4.352 10.648 1.80002 7.49996 1.80002ZM0.899963 7.50002C0.899963 3.85494 3.85488 0.900024 7.49996 0.900024C11.145 0.900024 14.1 3.85494 14.1 7.50002C14.1 11.1451 11.145 14.1 7.49996 14.1C3.85488 14.1 0.899963 11.1451 0.899963 7.50002Z"
                      fill="currentColor"
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                    ></path>
                    <path
                      d="M13.4999 7.89998H1.49994V7.09998H13.4999V7.89998Z"
                      fill="currentColor"
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                    ></path>
                    <path
                      d="M7.09991 13.5V1.5H7.89991V13.5H7.09991zM10.375 7.49998C10.375 5.32724 9.59364 3.17778 8.06183 1.75656L8.53793 1.24341C10.2396 2.82218 11.075 5.17273 11.075 7.49998 11.075 9.82724 10.2396 12.1778 8.53793 13.7566L8.06183 13.2434C9.59364 11.8222 10.375 9.67273 10.375 7.49998zM3.99969 7.5C3.99969 5.17611 4.80786 2.82678 6.45768 1.24719L6.94177 1.75281C5.4582 3.17323 4.69969 5.32389 4.69969 7.5 4.6997 9.67611 5.45822 11.8268 6.94179 13.2472L6.45769 13.7528C4.80788 12.1732 3.9997 9.8239 3.99969 7.5z"
                      fill="currentColor"
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                    ></path>
                    <path
                      d="M7.49996 3.95801C9.66928 3.95801 11.8753 4.35915 13.3706 5.19448 13.5394 5.28875 13.5998 5.50197 13.5055 5.67073 13.4113 5.83948 13.198 5.89987 13.0293 5.8056 11.6794 5.05155 9.60799 4.65801 7.49996 4.65801 5.39192 4.65801 3.32052 5.05155 1.97064 5.8056 1.80188 5.89987 1.58866 5.83948 1.49439 5.67073 1.40013 5.50197 1.46051 5.28875 1.62927 5.19448 3.12466 4.35915 5.33063 3.95801 7.49996 3.95801zM7.49996 10.85C9.66928 10.85 11.8753 10.4488 13.3706 9.6135 13.5394 9.51924 13.5998 9.30601 13.5055 9.13726 13.4113 8.9685 13.198 8.90812 13.0293 9.00238 11.6794 9.75643 9.60799 10.15 7.49996 10.15 5.39192 10.15 3.32052 9.75643 1.97064 9.00239 1.80188 8.90812 1.58866 8.9685 1.49439 9.13726 1.40013 9.30601 1.46051 9.51924 1.62927 9.6135 3.12466 10.4488 5.33063 10.85 7.49996 10.85z"
                      fill="currentColor"
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  Visit Website
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/20 mx-[1px]" />
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
