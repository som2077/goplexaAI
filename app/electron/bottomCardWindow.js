/**
 * =============================================================================
 * BOTTOM CARD WINDOW CLASS
 * =============================================================================
 * Manages the BottomCard window functionality including:
 * - Window creation and configuration
 * - IPC event handling
 * - Screenshot display management
 * - Localhost development features
 */

// =============================================================================
// IMPORTS & DEPENDENCIES
// =============================================================================
import { BrowserWindow, screen, ipcMain } from "electron";
import fs from "fs";

// =============================================================================
// CONFIGURATION & CONSTANTS
// =============================================================================
const WINDOW_CONFIG = {
  width: 1070,
  height: 710,
  minWidth: 400,
  minHeight: 300,
  screenMargin: 40,
  boundaryMargin: 20,
  moveThrottleDelay: 50,
  screenshotSendDelay: 200,
  // Keyboard movement configuration
  keyboardMoveStep: 10, // Pixels to move per arrow key press
  keyboardMoveFastStep: 50, // Fast movement when holding Shift
};

const WEB_PREFERENCES = {
  contextIsolation: false,
  nodeIntegration: true,
  devTools: true,
  webSecurity: false,
  allowRunningInsecureContent: true,
  experimentalFeatures: true,
  additionalArguments: [
    "--disable-web-security",
    "--allow-running-insecure-content",
  ],
  partition: "persist:bottomcard-localhost",
};

// =============================================================================
// BOTTOM CARD WINDOW CLASS
// =============================================================================
class BottomCardWindow {
  /**
   * Initialize the BottomCard window
   * @param {string} iconPath - Path to the application icon
   * @param {Function} getViteURL - Function to get Vite development URL
   * @param {number} vitePort - Vite development server port
   */
  constructor(iconPath, getViteURL, vitePort) {
    this.window = null;
    this.iconPath = iconPath;
    this.getViteURL = getViteURL;
    this.vitePort = vitePort;
    this.lastScreenshotPath = null;

    // Initialize IPC handlers
    this.setupIpcHandlers();

    console.log("✅ BottomCardWindow initialized");
  }

  // =============================================================================
  // WINDOW CREATION & CONFIGURATION
  // =============================================================================

  /**
   * Create and configure the BottomCard window
   */
  createWindow() {
    try {
      console.log("🚀 Creating BottomCard window...");

      const windowOptions = this.calculateWindowOptions();
      this.window = new BrowserWindow(windowOptions);

      // Set window to always be on top of all other windows
      this.window.setAlwaysOnTop(true, "screen-saver");

      this.setupWindowEvents();
      this.loadWindowContent();

      console.log("✅ BottomCard window created successfully");
    } catch (error) {
      console.error("❌ Error creating BottomCard window:", error);
    }
  }

  /**
   * Calculate optimal window options based on screen dimensions
   * @returns {Object} BrowserWindow options
   */
  calculateWindowOptions() {
    const display = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = display.workAreaSize;

    // Calculate safe dimensions
    const maxWindowWidth = Math.min(
      WINDOW_CONFIG.width,
      screenWidth - WINDOW_CONFIG.screenMargin,
    );
    const maxWindowHeight = Math.min(
      WINDOW_CONFIG.height,
      screenHeight - WINDOW_CONFIG.screenMargin,
    );

    // Calculate initial positioning
    const position = this.calculateWindowPosition(
      screenWidth,
      screenHeight,
      maxWindowWidth,
      maxWindowHeight,
    );

    return {
      width: maxWindowWidth,
      height: maxWindowHeight,
      x: position.x,
      y: position.y,
      minWidth: WINDOW_CONFIG.minWidth,
      minHeight: WINDOW_CONFIG.minHeight,
      maxWidth: screenWidth - WINDOW_CONFIG.screenMargin,
      maxHeight: screenHeight - WINDOW_CONFIG.screenMargin,
      frame: false,
      transparent: true,
      hasShadow: true,
      resizable: true,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      movable: true,
      show: false, // Initially hidden
      icon: this.iconPath,
      webPreferences: WEB_PREFERENCES,
    };
  }

  /**
   * Calculate optimal window position - CENTERED ON SCREEN
   * @param {number} screenWidth - Screen width
   * @param {number} screenHeight - Screen height
   * @param {number} windowWidth - Window width
   * @param {number} windowHeight - Window height
   * @returns {Object} Position coordinates {x, y}
   */
  calculateWindowPosition(
    screenWidth,
    screenHeight,
    windowWidth,
    windowHeight,
  ) {
    // Calculate center position
    const centerX = Math.round((screenWidth - windowWidth) / 2);
    const centerY = Math.round((screenHeight - windowHeight) / 2);

    // Boundary enforcement to ensure window stays within screen bounds
    const finalX = Math.max(
      WINDOW_CONFIG.boundaryMargin,
      Math.min(
        centerX,
        screenWidth - windowWidth - WINDOW_CONFIG.boundaryMargin,
      ),
    );

    const finalY = Math.max(
      WINDOW_CONFIG.boundaryMargin,
      Math.min(
        centerY,
        screenHeight - windowHeight - WINDOW_CONFIG.boundaryMargin,
      ),
    );

    console.log(`🎯 Centering BottomCard window at: (${finalX}, ${finalY})`);
    return { x: finalX, y: finalY };
  }

  /**
   * Setup window event handlers
   */
  setupWindowEvents() {
    // Context menu prevention
    this.window.webContents.on("context-menu", (e) => {
      e.preventDefault();
    });

    // Page load events
    this.setupPageLoadEvents();

    // Window lifecycle events
    this.setupWindowLifecycleEvents();

    // Movement optimization
    this.setupMovementOptimization();

    // Keyboard movement events
    this.setupKeyboardMovement();

    // Ensure always on top when window is shown
    this.window.on("show", () => {
      this.window.setAlwaysOnTop(true, "screen-saver");
      console.log("👁️ BottomCard window shown and set to always on top");
    });

    // Re-apply always on top when focus changes
    this.window.on("focus", () => {
      this.window.setAlwaysOnTop(true, "screen-saver");
    });

    this.window.on("blur", () => {
      this.window.setAlwaysOnTop(true, "screen-saver");
    });
  }

  /**
   * Setup page load event handlers
   */
  setupPageLoadEvents() {
    this.window.webContents.on("did-finish-load", () => {
      console.log("📄 BottomCard page finished loading");
      const currentURL = this.window.webContents.getURL();
      console.log("🔗 BottomCard loaded URL:", currentURL);
    });

    this.window.webContents.on(
      "did-fail-load",
      (_event, errorCode, errorDescription, validatedURL) => {
        console.error("❌ BottomCard page failed to load:");
        console.error(`  Code: ${errorCode}`);
        console.error(`  Description: ${errorDescription}`);
        console.error(`  URL: ${validatedURL}`);
      },
    );

    this.window.webContents.on("did-navigate", (_event, url) => {
      console.log("🧭 BottomCard navigated to:", url);
    });

    this.window.webContents.on("did-navigate-in-page", (_event, url) => {
      console.log("🔗 BottomCard navigated in page to:", url);
    });

    this.window.webContents.on("dom-ready", () => {
      console.log("🎯 BottomCard DOM ready - enabling localhost features");
      this.injectLocalhostHelpers();
    });
  }

  /**
   * Setup window lifecycle event handlers
   */
  setupWindowLifecycleEvents() {
    this.window.on("closed", () => {
      console.log("🔒 BottomCard window closed");
      this.window = null;
    });
  }

  /**
   * Setup movement optimization with throttling
   */
  setupMovementOptimization() {
    this.window.on("moved", () => {
      if (this.window && !this.window.isDestroyed()) {
        if (this.window.moveThrottle) {
          clearTimeout(this.window.moveThrottle);
        }
        this.window.moveThrottle = setTimeout(() => {
          if (this.window && !this.window.isDestroyed()) {
            const [x, y] = this.window.getPosition();
            console.log("📍 BottomCard moved to:", x, y);
          }
        }, WINDOW_CONFIG.moveThrottleDelay);
      }
    });
  }

  /**
   * Setup keyboard movement event handlers
   * Arrow keys to move the window in different directions
   */
  setupKeyboardMovement() {
    // Listen for keyboard events from the renderer process
    this.window.webContents.on("before-input-event", (event, input) => {
      // Only handle arrow keys when the window is focused
      if (!this.window.isFocused()) return;

      // Check if it's an arrow key
      if (input.type === "keyDown" && input.key.startsWith("Arrow")) {
        event.preventDefault(); // Prevent default browser behavior

        // Determine movement step (fast if Shift is held)
        const moveStep = input.shift
          ? WINDOW_CONFIG.keyboardMoveFastStep
          : WINDOW_CONFIG.keyboardMoveStep;

        // Handle different arrow keys
        switch (input.key) {
          case "ArrowUp":
            this.moveWindowUp(moveStep);
            break;
          case "ArrowDown":
            this.moveWindowDown(moveStep);
            break;
          case "ArrowLeft":
            this.moveWindowLeft(moveStep);
            break;
          case "ArrowRight":
            this.moveWindowRight(moveStep);
            break;
        }
      }
    });

    console.log("⌨️  Keyboard movement handlers setup for BottomCard");
  }

  /**
   * Load window content from Vite development server
   */
  loadWindowContent() {
    const bottomCardURL = this.getViteURL("bottomcard");
    console.log("🌐 Loading BottomCard from URL:", bottomCardURL);
    this.window.loadURL(bottomCardURL);
  }

  /**
   * Inject localhost development helpers into the window
   */
  injectLocalhostHelpers() {
    this.window.webContents.executeJavaScript(`
      // Add localhost development helpers
      window.localhostDev = {
        port: ${this.vitePort},
        baseURL: 'http://localhost:${this.vitePort}',
        reload: () => {
          if (window.electronAPI) {
            window.electronAPI.send('reload-bottomcard-localhost');
          }
        },
        navigate: (port, path = '') => {
          if (window.electronAPI) {
            window.electronAPI.send('navigate-bottomcard-localhost', { port, path });
          }
        }
      };
      console.log('🛠️  Localhost development helpers loaded:', window.localhostDev);
    `);
  }

  // =============================================================================
  // IPC EVENT HANDLERS
  // =============================================================================

  /**
   * Setup all IPC event handlers for the BottomCard window
   */
  setupIpcHandlers() {
    console.log("🔧 Setting up BottomCard IPC handlers...");

    // Screenshot handlers
    this.setupScreenshotHandlers();

    // Navigation handlers
    this.setupNavigationHandlers();

    // Window control handlers
    this.setupWindowControlHandlers();

    // Development handlers
    this.setupDevelopmentHandlers();

    console.log("✅ BottomCard IPC handlers registered");
  }

  /**
   * Setup screenshot-related IPC handlers
   */
  setupScreenshotHandlers() {
    // Manual screenshot sending
    ipcMain.on("send-screenshot-to-bottomcard", (_event, imagePath) => {
      this.handleManualScreenshot(imagePath);
    });

    // Get last screenshot
    ipcMain.on("get-last-screenshot", () => {
      this.handleGetLastScreenshot();
    });
  }

  /**
   * Setup navigation-related IPC handlers
   */
  setupNavigationHandlers() {
    // Navigate to URL
    ipcMain.on("navigate-bottom-card", (_event, url) => {
      this.safeWindowSend("navigate-to", url);
    });

    // Localhost navigation
    ipcMain.on(
      "navigate-bottomcard-localhost",
      (_event, { port, path = "" }) => {
        this.handleLocalhostNavigation(port, path);
      },
    );

    // Reload localhost page
    ipcMain.on("reload-bottomcard-localhost", () => {
      this.handleLocalhostReload();
    });

    // Get current URL
    ipcMain.on("get-bottomcard-url", (event) => {
      this.handleGetCurrentURL(event);
    });

    // Switch port
    ipcMain.on("switch-bottomcard-port", (_event, newPort) => {
      this.handlePortSwitch(newPort);
    });
  }

  /**
   * Setup window control IPC handlers
   */
  setupWindowControlHandlers() {
    // Minimize window
    ipcMain.on("minimize-bottomcard", () => {
      this.safeWindowOperation((win) => win.minimize());
    });

    // Maximize/Unmaximize window
    ipcMain.on("maximize-bottomcard", () => {
      this.safeWindowOperation((win) => {
        if (win.isMaximized()) {
          win.unmaximize();
        } else {
          win.maximize();
        }
      });
    });

    // Close window
    ipcMain.on("close-bottomcard", () => {
      this.safeWindowOperation((win) => win.close());
    });
  }

  /**
   * Setup development-related IPC handlers
   */
  setupDevelopmentHandlers() {
    // Toggle DevTools
    ipcMain.on("bottomcard-dev-tools", () => {
      this.safeWindowOperation((win) => {
        if (win.webContents.isDevToolsOpened()) {
          win.webContents.closeDevTools();
          console.log("🔧 BottomCard DevTools closed");
        } else {
          win.webContents.openDevTools();
          console.log("🔧 BottomCard DevTools opened");
        }
      });
    });
  }

  // =============================================================================
  // IPC HANDLER IMPLEMENTATIONS
  // =============================================================================

  /**
   * Handle manual screenshot sending
   * @param {string} imagePath - Path to the screenshot image
   */
  handleManualScreenshot(imagePath) {
    if (this.window && !this.window.isDestroyed()) {
      console.log("📸 Manually sending screenshot to BottomCard:", imagePath);

      if (fs.existsSync(imagePath)) {
        this.window.webContents.send("display-screenshot", imagePath);

        if (!this.window.isVisible()) {
          this.window.show();
        }
      } else {
        console.error("❌ Screenshot file not found:", imagePath);
      }
    }
  }

  /**
   * Handle get last screenshot request
   */
  handleGetLastScreenshot() {
    if (this.lastScreenshotPath && fs.existsSync(this.lastScreenshotPath)) {
      console.log("📸 Sending last screenshot:", this.lastScreenshotPath);

      if (this.window && !this.window.isDestroyed()) {
        this.window.webContents.send(
          "display-screenshot",
          this.lastScreenshotPath,
        );

        if (!this.window.isVisible()) {
          this.window.show();
        }
      }
    } else {
      console.log("⚠️  No valid last screenshot available");
    }
  }

  /**
   * Handle localhost navigation
   * @param {number} port - Port number
   * @param {string} path - URL path
   */
  handleLocalhostNavigation(port, path) {
    const localhostURL = `http://localhost:${port}${path}`;
    console.log("🌐 Navigating bottomCard to localhost:", localhostURL);

    this.safeWindowOperation((win) => {
      win.loadURL(localhostURL);
      console.log("✅ BottomCard loaded localhost URL:", localhostURL);
    });
  }

  /**
   * Handle localhost page reload
   */
  handleLocalhostReload() {
    console.log("🔄 Reloading bottomCard localhost page");

    this.safeWindowOperation((win) => {
      win.reload();
      console.log("✅ BottomCard localhost page reloaded");
    });
  }

  /**
   * Handle get current URL request
   * @param {Object} event - IPC event object
   */
  handleGetCurrentURL(event) {
    this.safeWindowOperation((win) => {
      const currentURL = win.webContents.getURL();
      console.log("🔗 Current bottomCard URL:", currentURL);
      event.sender.send("bottomcard-current-url", currentURL);
    });
  }

  /**
   * Handle port switching
   * @param {number} newPort - New port number
   */
  handlePortSwitch(newPort) {
    console.log("🔄 Switching bottomCard to port:", newPort);

    this.safeWindowOperation((win) => {
      const newURL = `http://localhost:${newPort}`;
      win.loadURL(newURL);
      console.log("✅ BottomCard switched to:", newURL);
    });
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Safe window communication helper
   * @param {string} channel - IPC channel name
   * @param {*} data - Data to send
   */
  safeWindowSend(channel, data) {
    if (this.window && !this.window.isDestroyed()) {
      try {
        this.window.webContents.send(channel, data);
      } catch (error) {
        console.error(`❌ Error sending to ${channel}:`, error);
      }
    }
  }

  /**
   * Safe window operation helper
   * @param {Function} operation - Operation to perform on window
   * @returns {*} Result of operation or null
   */
  safeWindowOperation(operation) {
    if (this.window && !this.window.isDestroyed()) {
      try {
        return operation(this.window);
      } catch (error) {
        console.error("❌ Error in window operation:", error);
        return null;
      }
    }
    return null;
  }

  // =============================================================================
  // WINDOW CONTROL METHODS
  // =============================================================================

  /**
   * Show the window
   */
  show() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show();
      this.window.focus();
      this.window.setAlwaysOnTop(true, "screen-saver");
      console.log("👁️ BottomCard window shown");
    } else {
      this.createWindow();
    }
  }

  /**
   * Hide the window
   */
  hide() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.hide();
      console.log("👁️ BottomCard window hidden");
    }
  }

  /**
   * Show the window without animation (for internal use)
   */
  showImmediate() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show();
      this.window.focus();
      this.window.setAlwaysOnTop(true, "screen-saver");
      console.log("👁️ BottomCard window shown immediately (no animation)");
    } else {
      console.log("👁️ Creating BottomCard window immediately");
      this.createWindow();
    }
  }

  /**
   * Hide the window without animation (for internal use)
   */
  hideImmediate() {
    if (this.window) {
      this.window.hide();
    }
  }

  /**
   * Close the window
   */
  close() {
    if (this.window) {
      this.window.close();
    }
  }

  /**
   * Check if window is visible
   * @returns {boolean} True if window is visible
   */
  isVisible() {
    return this.window && this.window.isVisible();
  }

  // =============================================================================
  // KEYBOARD MOVEMENT METHODS
  // =============================================================================

  /**
   * Move window up by specified pixels
   * @param {number} step - Number of pixels to move up
   */
  moveWindowUp(step) {
    if (this.window && !this.window.isDestroyed()) {
      const [currentX, currentY] = this.window.getPosition();
      const newY = Math.max(WINDOW_CONFIG.boundaryMargin, currentY - step);

      if (newY !== currentY) {
        this.window.setPosition(currentX, newY);
        console.log(`⬆️  BottomCard moved up to: (${currentX}, ${newY})`);
      }
    }
  }

  /**
   * Move window down by specified pixels
   * @param {number} step - Number of pixels to move down
   */
  moveWindowDown(step) {
    if (this.window && !this.window.isDestroyed()) {
      const [currentX, currentY] = this.window.getPosition();
      const [, windowHeight] = this.window.getSize();
      const display = screen.getPrimaryDisplay();
      const { height: screenHeight } = display.workAreaSize;

      const maxY = screenHeight - windowHeight - WINDOW_CONFIG.boundaryMargin;
      const newY = Math.min(maxY, currentY + step);

      if (newY !== currentY) {
        this.window.setPosition(currentX, newY);
        console.log(`⬇️  BottomCard moved down to: (${currentX}, ${newY})`);
      }
    }
  }

  /**
   * Move window left by specified pixels
   * @param {number} step - Number of pixels to move left
   */
  moveWindowLeft(step) {
    if (this.window && !this.window.isDestroyed()) {
      const [currentX, currentY] = this.window.getPosition();
      const newX = Math.max(WINDOW_CONFIG.boundaryMargin, currentX - step);

      if (newX !== currentX) {
        this.window.setPosition(newX, currentY);
        console.log(`⬅️  BottomCard moved left to: (${newX}, ${currentY})`);
      }
    }
  }

  /**
   * Move window right by specified pixels
   * @param {number} step - Number of pixels to move right
   */
  moveWindowRight(step) {
    if (this.window && !this.window.isDestroyed()) {
      const [currentX, currentY] = this.window.getPosition();
      const [windowWidth] = this.window.getSize();
      const display = screen.getPrimaryDisplay();
      const { width: screenWidth } = display.workAreaSize;

      const maxX = screenWidth - windowWidth - WINDOW_CONFIG.boundaryMargin;
      const newX = Math.min(maxX, currentX + step);

      if (newX !== currentX) {
        this.window.setPosition(newX, currentY);
        console.log(`➡️  BottomCard moved right to: (${newX}, ${currentY})`);
      }
    }
  }

  // =============================================================================
  // SCREENSHOT MANAGEMENT
  // =============================================================================

  /**
   * Display screenshot in the BottomCard window
   * @param {string} screenshotPath - Path to screenshot file
   */
  displayScreenshot(screenshotPath) {
    if (this.window && !this.window.isDestroyed()) {
      console.log("📸 Displaying screenshot in BottomCard:", screenshotPath);

      // Show and focus window immediately (no animation for screenshots)
      this.showImmediate();

      // Send screenshot with proper timing
      this.sendScreenshotWithTiming(screenshotPath);
    } else {
      console.log("⚠️  BottomCard window not available");
    }
  }

  /**
   * Send screenshot to window with proper timing
   * @param {string} screenshotPath - Path to screenshot file
   */
  sendScreenshotWithTiming(screenshotPath) {
    // Send immediately if already loaded
    if (!this.window.webContents.isLoading()) {
      console.log(
        "📤 Sending screenshot to BottomCard (already loaded):",
        screenshotPath,
      );
      this.window.webContents.send("display-screenshot", screenshotPath);
    }

    // Also send after a delay to ensure delivery
    setTimeout(() => {
      if (this.window && !this.window.isDestroyed()) {
        console.log(
          "📤 Sending screenshot to BottomCard (delayed):",
          screenshotPath,
        );
        this.window.webContents.send("display-screenshot", screenshotPath);
      }
    }, WINDOW_CONFIG.screenshotSendDelay);
  }

  /**
   * Set the last screenshot path
   * @param {string} path - Path to screenshot file
   */
  setLastScreenshotPath(path) {
    this.lastScreenshotPath = path;
    console.log("💾 Last screenshot path set:", path);
  }

  /**
   * Get the last screenshot path
   * @returns {string|null} Last screenshot path or null
   */
  getLastScreenshotPath() {
    return this.lastScreenshotPath;
  }

  /**
   * Toggle window visibility (show if hidden, hide if visible)
   */
  toggle() {
    if (this.window && !this.window.isDestroyed()) {
      const isVisible = this.window.isVisible();
      console.log(
        `🔍 BottomCard window state: visible=${isVisible}, destroyed=${this.window.isDestroyed()}`,
      );

      if (isVisible) {
        console.log("👁️ Hiding BottomCard window via toggle");
        this.window.hide();
      } else {
        console.log("👁️ Showing BottomCard window via toggle");
        this.window.show();
        this.window.focus();
        this.window.setAlwaysOnTop(true, "screen-saver");
      }
    } else {
      console.log(
        "👁️ Creating BottomCard window via toggle (window doesn't exist or is destroyed)",
      );
      this.createWindow();
    }
  }
}

// =============================================================================
// EXPORT
// =============================================================================
export default BottomCardWindow;
