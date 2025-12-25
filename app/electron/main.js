/**
 * =============================================================================
 * GOPLEXA ELECTRON MAIN PROCESS
 * =============================================================================
 * Main entry point for the Goplexa Electron application
 * Handles window management, IPC communication, and app lifecycle
 */

// =============================================================================
// IMPORTS & DEPENDENCIES
// =============================================================================
import {
  app,
  BrowserWindow,
  Menu,
  screen,
  ipcMain,
  globalShortcut,
} from "electron";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import http from "http";

// Custom window classes
import BottomCardWindow from "./bottomCardWindow.js";
import TopBarWindow from "./topBarWindow.js";

// =============================================================================
// CONFIGURATION & CONSTANTS
// =============================================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// App Configuration
const APP_CONFIG = {
  name: "Goplexa",
  iconPath: path.join(__dirname, "../public/icon.png"),
  vitePort: 5173, // Default port
  possiblePorts: [5173, 5174, 5175, 5176, 5177], // Common Vite ports
  screenshotDelay: 200, // Delay before taking screenshot
  initialPositionDelay: 100, // Delay for initial window positioning
};

// =============================================================================
// GLOBAL VARIABLES
// =============================================================================
let topBarWindow;
let bottomCardWindow;
let vitePort = APP_CONFIG.vitePort;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the correct Vite URL with optional hash
 * @param {string} hash - Optional hash to append to URL
 * @returns {string} Complete Vite URL
 */
function getViteURL(hash = "") {
  return `http://localhost:${vitePort}${hash ? "#" + hash : ""}`;
}

/**
 * Detect the correct Vite development server port
 * @returns {Promise<number>} The detected port number
 */
async function detectVitePort() {
  for (const port of APP_CONFIG.possiblePorts) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}`, (res) => {
          if (res.statusCode === 200) {
            vitePort = port;
            console.log(`✅ Vite dev server detected on port ${port}`);
            resolve();
          } else {
            reject(new Error(`Port ${port} returned status ${res.statusCode}`));
          }
        });

        req.on("error", reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error(`Port ${port} timeout`));
        });
      });
      return port;
    } catch (error) {
      console.log(`❌ Port ${port} not available:`, error.message);
    }
  }

  console.log(
    `⚠️  No Vite dev server found on common ports, using default port ${vitePort}`
  );
  return vitePort;
}

/**
 * Find screenshot file in alternative locations if not found at original path
 * @param {string} originalPath - Original screenshot path
 * @returns {string|null} Found path or null if not found
 */
function findScreenshotInAlternateLocations(originalPath) {
  const possiblePaths = [
    originalPath,
    path.join(__dirname, "screenshots", path.basename(originalPath)),
    path.join(process.cwd(), "screenshots", path.basename(originalPath)),
    path.join("C:", "Screenshots", path.basename(originalPath)),
  ];

  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      console.log(`✅ Found screenshot at: ${testPath}`);
      return testPath;
    }
  }

  return null;
}

// =============================================================================
// WINDOW MANAGEMENT
// =============================================================================

/**
 * Create and initialize the TopBar window
 */
function createTopBarWindow() {
  try {
    console.log("🚀 Creating TopBar window...");
    topBarWindow = new TopBarWindow(APP_CONFIG.iconPath, getViteURL, null); // Pass null initially
    topBarWindow.createWindow();
    console.log("✅ TopBar window created successfully");
  } catch (error) {
    console.error("❌ Error creating TopBar window:", error);
  }
}

/**
 * Create and initialize the BottomCard window
 */
function createBottomCardWindow() {
  try {
    console.log("🚀 Creating BottomCard window...");
    bottomCardWindow = new BottomCardWindow(
      APP_CONFIG.iconPath,
      getViteURL,
      vitePort
    );
    bottomCardWindow.createWindow();
    console.log("✅ BottomCard window created successfully");
  } catch (error) {
    console.error("❌ Error creating BottomCard window:", error);
  }
}

/**
 * Set initial window positions and states
 */
function initializeWindowPositions() {
  setTimeout(() => {
    if (topBarWindow) {
      topBarWindow.setInitialPosition();
    }
  }, APP_CONFIG.initialPositionDelay);
}

// =============================================================================
// SCREENSHOT HANDLING
// =============================================================================

/**
 * Handle screenshot process - hide windows, take screenshot, show windows
 * @param {Object} event - IPC event object
 */
function handleScreenshotProcess(event) {
  console.log("📸 Screenshot triggered from New button");

  const snipPath = path.join(__dirname, "py-code", "snip.py");
  const pythonCommand = process.platform === "win32" ? "python" : "python3";

  // Hide windows before taking screenshot
  hideWindowsForScreenshot();

  setTimeout(() => {
    executeScreenshotProcess(event, snipPath, pythonCommand);
  }, APP_CONFIG.screenshotDelay);
}

/**
 * Hide all windows before taking screenshot
 */
function hideWindowsForScreenshot() {
  if (topBarWindow) {
    topBarWindow.hideForScreenshot();
  }
  if (bottomCardWindow && bottomCardWindow.isVisible()) {
    bottomCardWindow.hideImmediate();
  }
}

/**
 * Execute the Python screenshot process
 * @param {Object} event - IPC event object
 * @param {string} snipPath - Path to Python screenshot script
 * @param {string} pythonCommand - Python command to execute
 */
function executeScreenshotProcess(event, snipPath, pythonCommand) {
  const pythonProcess = spawn(pythonCommand, [snipPath]);
  let dataBuffer = "";

  // Handle Python process output
  pythonProcess.stdout.on("data", (data) => {
    dataBuffer += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error("🐍 Python stderr:", data.toString());
  });

  // Handle process completion
  pythonProcess.on("close", (code) => {
    console.log(`🐍 Python process closed with code: ${code}`);
    showWindowsAfterScreenshot();

    if (code === 0 && dataBuffer) {
      handleSuccessfulScreenshot(event, dataBuffer);
    } else if (code === 1) {
      handleCancelledScreenshot(event);
    } else {
      handleFailedScreenshot(event, code, dataBuffer);
    }
  });

  // Handle process errors
  pythonProcess.on("error", (error) => {
    console.error("❌ Failed to start Python process:", error);
    console.error("💡 Make sure Python is installed and in PATH");
    showWindowsAfterScreenshot();
    event.sender.send("screenshot-result", {
      success: false,
      error: error.message || "Failed to start screenshot tool",
    });
  });
}

/**
 * Show windows after screenshot process
 */
function showWindowsAfterScreenshot() {
  if (topBarWindow) {
    topBarWindow.showAfterScreenshot();
  }
}

/**
 * Handle successful screenshot result
 * @param {Object} event - IPC event object
 * @param {string} dataBuffer - Python output data
 */
function handleSuccessfulScreenshot(event, dataBuffer) {
  try {
    const result = JSON.parse(dataBuffer.trim());
    console.log("📊 Parsed Python result:", result);

    if (result.path) {
      processScreenshotPath(event, result.path);
    } else if (result.error) {
      handleScreenshotError(event, result.error);
    }
  } catch (parseError) {
    console.error("❌ Failed to parse Python output:", parseError);
    console.error("📄 Raw output was:", dataBuffer);
    event.sender.send("screenshot-result", {
      success: false,
      error: "Failed to parse screenshot result",
    });
  }
}

/**
 * Process the screenshot file path
 * @param {Object} event - IPC event object
 * @param {string} screenshotPath - Path to screenshot file
 */
function processScreenshotPath(event, screenshotPath) {
  console.log("📁 Screenshot path from Python:", screenshotPath);

  // Normalize path for consistency
  screenshotPath = path.normalize(screenshotPath);
  console.log("🔧 Normalized path:", screenshotPath);

  // Verify file exists
  if (!fs.existsSync(screenshotPath)) {
    console.error("❌ Screenshot file not found at:", screenshotPath);

    const foundPath = findScreenshotInAlternateLocations(screenshotPath);
    if (!foundPath) {
      event.sender.send("screenshot-result", {
        success: false,
        error: "Screenshot file not found",
      });
      return;
    }
    screenshotPath = foundPath;
  }

  // Store path and verify file
  storeAndVerifyScreenshot(event, screenshotPath);
}

/**
 * Store screenshot path and verify file details
 * @param {Object} event - IPC event object
 * @param {string} screenshotPath - Path to screenshot file
 */
function storeAndVerifyScreenshot(event, screenshotPath) {
  // Store the path in BottomCardWindow
  if (bottomCardWindow) {
    bottomCardWindow.setLastScreenshotPath(screenshotPath);
  }

  // Get file info for verification
  const stats = fs.statSync(screenshotPath);
  console.log("📊 Screenshot file verified:");
  console.log(`  📁 Path: ${screenshotPath}`);
  console.log(`  📏 Size: ${stats.size} bytes`);
  console.log(`  🕒 Modified: ${stats.mtime}`);

  // Send result to New.jsx
  event.sender.send("screenshot-result", {
    success: true,
    path: screenshotPath,
  });

  // Show and send to BottomCard
  if (bottomCardWindow) {
    bottomCardWindow.displayScreenshot(screenshotPath);
  } else {
    console.log("⚠️  BottomCard window not available");
  }
}

/**
 * Handle screenshot error
 * @param {Object} event - IPC event object
 * @param {string} error - Error message
 */
function handleScreenshotError(event, error) {
  console.error("❌ Screenshot error from Python:", error);
  event.sender.send("screenshot-result", {
    success: false,
    error: error,
  });
}

/**
 * Handle cancelled screenshot
 * @param {Object} event - IPC event object
 */
function handleCancelledScreenshot(event) {
  console.log("🚫 Screenshot cancelled by user (ESC pressed)");
  event.sender.send("screenshot-cancelled");
}

/**
 * Handle failed screenshot
 * @param {Object} event - IPC event object
 * @param {number} code - Exit code
 * @param {string} dataBuffer - Python output
 */
function handleFailedScreenshot(event, code, dataBuffer) {
  console.error("❌ Screenshot process exited with unexpected code:", code);
  console.error("📄 Python output:", dataBuffer);
  event.sender.send("screenshot-result", {
    success: false,
    error: `Screenshot process exited with code ${code}`,
  });
}

// =============================================================================
// GLOBAL SHORTCUTS
// =============================================================================

/**
 * Register global shortcuts
 */
function registerGlobalShortcuts() {
  try {
    // Register Ctrl + / for BottomCard toggle
    const shortcutRegistered = globalShortcut.register(
      "CommandOrControl+/",
      () => {
        try {
          console.log(
            "⌨️ Global shortcut Ctrl + / pressed - toggling BottomCard"
          );
          if (bottomCardWindow && !bottomCardWindow.window?.isDestroyed()) {
            bottomCardWindow.toggle();
          } else {
            console.log("⚠️ BottomCard window not available for toggle");
          }
        } catch (error) {
          console.error("❌ Error in global shortcut handler:", error);
        }
      }
    );

    if (shortcutRegistered) {
      console.log("✅ Global shortcut Ctrl + / registered successfully");
    } else {
      console.error("❌ Failed to register global shortcut Ctrl + /");
    }
  } catch (error) {
    console.error("❌ Error registering global shortcuts:", error);
  }
}

/**
 * Unregister all global shortcuts
 */
function unregisterGlobalShortcuts() {
  try {
    globalShortcut.unregisterAll();
    console.log("✅ All global shortcuts unregistered");
  } catch (error) {
    console.error("❌ Error unregistering global shortcuts:", error);
  }
}

// =============================================================================
// IPC HANDLERS
// =============================================================================

/**
 * Register all IPC event handlers
 */
function registerIpcHandlers() {
  // Screenshot handler
  ipcMain.on("trigger-screenshot", handleScreenshotProcess);

  console.log("✅ IPC handlers registered");
}

// =============================================================================
// APP LIFECYCLE
// =============================================================================

/**
 * Initialize the application when ready
 */
async function initializeApp() {
  try {
    console.log("🚀 Initializing Goplexa application...");

    // Detect Vite port first
    await detectVitePort();

    // Create windows
    createBottomCardWindow(); // Create BottomCard first
    createTopBarWindow(); // Then create TopBar with BottomCard reference

    // Update TopBar reference to BottomCard after both are created
    if (topBarWindow && bottomCardWindow) {
      topBarWindow.bottomCardWindow = bottomCardWindow;
    }

    // Set initial positions
    initializeWindowPositions();

    // Register global shortcuts
    registerGlobalShortcuts();

    console.log("✅ Application initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing application:", error);
  }
}

/**
 * Handle app activation (macOS)
 */
function handleAppActivate() {
  if (BrowserWindow.getAllWindows().length === 0) {
    console.log("🔄 Recreating windows on app activate");
    createBottomCardWindow(); // Create BottomCard first
    createTopBarWindow(); // Then create TopBar

    // Update TopBar reference to BottomCard after both are created
    if (topBarWindow && bottomCardWindow) {
      topBarWindow.bottomCardWindow = bottomCardWindow;
    }
  }
}

/**
 * Handle app window close
 */
function handleWindowAllClosed() {
  if (process.platform !== "darwin") {
    console.log("👋 All windows closed, quitting application");
    unregisterGlobalShortcuts();
    app.quit();
  }
}

/**
 * Handle app before quit
 */
function handleBeforeQuit() {
  console.log("🔄 App is about to quit, cleaning up...");
  unregisterGlobalShortcuts();
}

/**
 * Handle uncaught exceptions
 */
function handleUncaughtException(error) {
  console.error("❌ Uncaught Exception:", error);
  // Don't exit the app, just log the error
}

/**
 * Handle unhandled promise rejections
 */
function handleUnhandledRejection(reason, promise) {
  console.error("❌ Unhandled Promise Rejection:", reason);
  // Don't exit the app, just log the error
}

// =============================================================================
// APP CONFIGURATION & STARTUP
// =============================================================================

// Set app name
app.setName(APP_CONFIG.name);

// Configure app for transparency
app.commandLine.appendSwitch("enable-transparent-visuals");
app.disableHardwareAcceleration();

// Disable default menu
Menu.setApplicationMenu(null);

// Register IPC handlers
registerIpcHandlers();

// =============================================================================
// EVENT LISTENERS
// =============================================================================

// App ready event
app.whenReady().then(initializeApp);

// App activation event (macOS)
app.on("activate", handleAppActivate);

// Window close event
app.on("window-all-closed", handleWindowAllClosed);

// App before quit event
app.on("before-quit", handleBeforeQuit);

// Error handling
process.on("uncaughtException", handleUncaughtException);
process.on("unhandledRejection", handleUnhandledRejection);

// =============================================================================
// EXPORTS (if needed for testing)
// =============================================================================
export {
  getViteURL,
  detectVitePort,
  createTopBarWindow,
  createBottomCardWindow,
};
