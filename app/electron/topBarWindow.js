/**
 * =============================================================================
 * TOP BAR WINDOW CLASS
 * =============================================================================
 * Manages the TopBar window functionality including:
 * - Window creation and configuration
 * - IPC event handling
 * - Window positioning and movement
 * - Screenshot coordination
 */

// =============================================================================
// IMPORTS & DEPENDENCIES
// =============================================================================
import { BrowserWindow, screen, ipcMain } from "electron";

// =============================================================================
// CONFIGURATION & CONSTANTS
// =============================================================================
const WINDOW_CONFIG = {
  width: 300,
  height: 520,
  initialTopY: 2, // 2px from top of screen
  centerTopY: 2, // For initial positioning - same as initialTopY
  centerWidth: 300, // Width for center calculation - same as window width
  screenMargin: 0, // No margin for top positioning
  // Keyboard movement configuration
  keyboardMoveStep: 10, // Pixels to move per arrow key press
  keyboardMoveFastStep: 50, // Fast movement when holding Shift
};

const WEB_PREFERENCES = {
  contextIsolation: false,
  nodeIntegration: true,
  devTools: true,
};

// Global reference to TopBar window instance
let topBarInstance = null;

// =============================================================================
// GLOBAL ALWAYS ON TOP ENFORCER
// =============================================================================
function enforceAlwaysOnTop() {
  if (
    topBarInstance &&
    topBarInstance.window &&
    !topBarInstance.window.isDestroyed()
  ) {
    topBarInstance.window.setAlwaysOnTop(true, "screen-saver", 1);
    topBarInstance.window.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });
  }
}

// Set up interval to enforce always on top every second
setInterval(enforceAlwaysOnTop, 1000);

// =============================================================================
// TOP BAR WINDOW CLASS
// =============================================================================
class TopBarWindow {
  /**
   * Initialize the TopBar window
   * @param {string} iconPath - Path to the application icon
   * @param {Function} getViteURL - Function to get Vite development URL
   * @param {Object} bottomCardWindow - Reference to BottomCard window instance
   */
  constructor(iconPath, getViteURL, bottomCardWindow) {
    this.window = null;
    this.iconPath = iconPath;
    this.getViteURL = getViteURL;
    this.bottomCardWindow = bottomCardWindow;

    // Set global instance reference
    topBarInstance = this;

    // Initialize IPC handlers
    this.setupIpcHandlers();

    console.log("✅ TopBarWindow initialized");
  }

  // =============================================================================
  // WINDOW CREATION & CONFIGURATION
  // =============================================================================

  /**
   * Create and configure the TopBar window
   */
  createWindow() {
    try {
      console.log("🚀 Creating TopBar window...");

      const windowOptions = this.calculateWindowOptions();
      this.window = new BrowserWindow(windowOptions);

      // Set always on top with maximum level and force it to stay on all workspaces
      this.window.setAlwaysOnTop(true, "screen-saver", 1);
      this.window.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
      });

      this.setupWindowEvents();
      this.loadWindowContent();

      console.log("✅ TopBar window created successfully");
      console.log("🔝 Always on top: enabled (GLOBAL MODE)");
    } catch (error) {
      console.error("❌ Error creating TopBar window:", error);
    }
  }

  /**
   * Calculate optimal window options based on screen dimensions
   * @returns {Object} BrowserWindow options
   */
  calculateWindowOptions() {
    const display = screen.getPrimaryDisplay();
    const { width: screenWidth } = display.size; // Use full screen size

    // Calculate center position
    const position = this.calculateWindowPosition(screenWidth);

    return {
      width: WINDOW_CONFIG.width,
      height: WINDOW_CONFIG.height,
      x: position.x,
      y: position.y,
      frame: false,
      transparent: true,
      hasShadow: true,
      resizable: false,
      maximizable: false,
      minimizable: true,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      icon: this.iconPath,
      webPreferences: WEB_PREFERENCES,
    };
  }

  /**
   * Calculate optimal window position
   * @param {number} screenWidth - Screen width
   * @returns {Object} Position coordinates {x, y}
   */
  calculateWindowPosition(screenWidth) {
    // Center horizontally, 2px from top
    const centerX = Math.round((screenWidth - WINDOW_CONFIG.width) / 2);
    const topY = WINDOW_CONFIG.initialTopY;

    return { x: centerX, y: topY };
  }

  /**
   * Setup window event handlers
   */
  setupWindowEvents() {
    // Context menu prevention
    this.window.webContents.on("context-menu", (e) => {
      e.preventDefault();
    });

    // Window lifecycle events
    this.setupWindowLifecycleEvents();

    // Keyboard movement events
    this.setupKeyboardMovement();
  }

  /**
   * Setup window lifecycle event handlers
   */
  setupWindowLifecycleEvents() {
    this.window.on("closed", () => {
      console.log("🔒 TopBar window closed");
      this.window = null;
      topBarInstance = null;

      // Close BottomCard window when TopBar is closed
      if (this.bottomCardWindow) {
        console.log("🔒 Closing BottomCard window due to TopBar closure");
        this.bottomCardWindow.close();
      } else {
        console.log("⚠️  BottomCard window reference not available");
      }
    });

    // Aggressively enforce always on top on every event
    this.window.on("show", () => {
      this.window.setAlwaysOnTop(true, "screen-saver", 1);
      this.window.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
      });
    });

    this.window.on("blur", () => {
      this.window.setAlwaysOnTop(true, "screen-saver", 1);
      this.window.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
      });
    });

    this.window.on("focus", () => {
      this.window.setAlwaysOnTop(true, "screen-saver", 1);
    });

    this.window.on("restore", () => {
      this.window.setAlwaysOnTop(true, "screen-saver", 1);
    });

    // Monitor all window changes
    this.window.on("move", () => {
      this.window.setAlwaysOnTop(true, "screen-saver", 1);
    });
  }

  /**
   * Setup keyboard movement event handlers
   * Left/Right arrow keys to move the TopBar window horizontally
   */
  setupKeyboardMovement() {
    // Listen for keyboard events from the renderer process
    this.window.webContents.on("before-input-event", (event, input) => {
      // Only handle arrow keys when the window is focused
      if (!this.window.isFocused()) return;

      // Check if it's a left or right arrow key
      if (
        input.type === "keyDown" &&
        (input.key === "ArrowLeft" || input.key === "ArrowRight")
      ) {
        event.preventDefault(); // Prevent default browser behavior

        // Determine movement step (fast if Shift is held)
        const moveStep = input.shift
          ? WINDOW_CONFIG.keyboardMoveFastStep
          : WINDOW_CONFIG.keyboardMoveStep;

        // Handle left and right arrow keys
        if (input.key === "ArrowLeft") {
          this.moveTopBarLeft(moveStep);
        } else if (input.key === "ArrowRight") {
          this.moveTopBarRight(moveStep);
        }
      }
    });

    console.log("⌨️  Keyboard movement handlers setup for TopBar");
  }

  /**
   * Load window content from Vite development server
   */
  loadWindowContent() {
    const topBarURL = this.getViteURL("topbar");
    console.log("🌐 Loading TopBar from URL:", topBarURL);
    this.window.loadURL(topBarURL);
  }

  // =============================================================================
  // IPC EVENT HANDLERS
  // =============================================================================

  /**
   * Setup all IPC event handlers for the TopBar window
   */
  setupIpcHandlers() {
    console.log("🔧 Setting up TopBar IPC handlers...");

    // Window control handlers
    this.setupWindowControlHandlers();

    // Movement handlers
    this.setupMovementHandlers();

    // Always on top handler
    this.setupAlwaysOnTopHandler();

    console.log("✅ TopBar IPC handlers registered");
  }

  /**
   * Setup window control IPC handlers
   */
  setupWindowControlHandlers() {
    // Minimize window
    ipcMain.on("minimize-topbar", () => {
      console.log("📉 Minimizing TopBar window");
      this.safeWindowOperation((win) => win.minimize());
    });

    // Close window
    ipcMain.on("close-topbar", () => {
      console.log("❌ Closing TopBar window (Exit Application clicked)");
      this.handleExitApplication();
    });
  }

  /**
   * Setup always on top IPC handler
   */
  setupAlwaysOnTopHandler() {
    ipcMain.on("set-always-on-top", (event, flag) => {
      console.log(`🔝 Setting always on top: ${flag}`);
      this.safeWindowOperation((win) => {
        win.setAlwaysOnTop(flag, "screen-saver", 1);
        win.setVisibleOnAllWorkspaces(flag, { visibleOnFullScreen: true });
      });
    });
  }

  /**
   * Setup movement-related IPC handlers
   */
  setupMovementHandlers() {
    // Handle window movement with boundary constraints
    ipcMain.on("topbar-move", (event, { x, y }) => {
      this.handleWindowMovement(x, y);
    });
  }

  // =============================================================================
  // IPC HANDLER IMPLEMENTATIONS
  // =============================================================================

  /**
   * Handle exit application request
   */
  handleExitApplication() {
    console.log("🚪 Exit Application requested");

    // Close BottomCard window first
    if (this.bottomCardWindow) {
      console.log("🔒 Closing BottomCard window");
      this.bottomCardWindow.close();
    }

    // Then close TopBar window
    this.safeWindowOperation((win) => {
      console.log("🔒 Closing TopBar window");
      win.close();
    });
  }

  /**
   * Handle window movement with screen boundary constraints
   * @param {number} x - Desired X coordinate
   * @param {number} y - Desired Y coordinate
   */
  handleWindowMovement(x, y) {
    this.safeWindowOperation((win) => {
      const display = screen.getPrimaryDisplay();
      const { width: screenWidth, height: screenHeight } = display.size; // Use full screen size, not work area
      const { width: workAreaWidth } = display.workAreaSize;
      const topBarY = WINDOW_CONFIG.initialTopY; // Keep at top of screen
      const windowWidth = win.getBounds().width;

      console.log(`🖥️ Display info:`);
      console.log(`   - Full screen size: ${screenWidth}x${screenHeight}`);
      console.log(
        `   - Work area size: ${workAreaWidth}x${display.workAreaSize.height}`
      );
      console.log(`   - Window width: ${windowWidth}`);
      console.log(`   - Desired X: ${x}`);

      // Try using work area width if it's different and might be the issue
      const effectiveScreenWidth =
        workAreaWidth !== screenWidth ? workAreaWidth : screenWidth;
      console.log(`🎯 Using effective screen width: ${effectiveScreenWidth}`);

      // Constrain X position to screen boundaries
      let constrainedX = this.constrainXPosition(
        x,
        effectiveScreenWidth,
        windowWidth
      );

      // Set position with constraints
      win.setPosition(constrainedX, topBarY);

      // Re-enforce always on top after movement
      win.setAlwaysOnTop(true, "screen-saver", 1);

      console.log(`📍 TopBar moved to: (${constrainedX}, ${topBarY})`);
      console.log(
        `🔍 Right edge check: ${
          constrainedX + windowWidth
        } <= ${effectiveScreenWidth} (${
          constrainedX + windowWidth <= effectiveScreenWidth
        })`
      );
    });
  }

  /**
   * Constrain X position to screen boundaries
   * @param {number} x - Desired X coordinate
   * @param {number} screenWidth - Screen width
   * @param {number} windowWidth - Window width
   * @returns {number} Constrained X coordinate
   */
  constrainXPosition(x, screenWidth, windowWidth) {
    let constrainedX = x;

    console.log(
      `🔍 Constraint check - Input: x=${x}, screenWidth=${screenWidth}, windowWidth=${windowWidth}`
    );

    // Ensure window doesn't go off the left edge
    if (constrainedX < 0) {
      console.log(`⬅️ Left constraint applied: ${constrainedX} -> 0`);
      constrainedX = 0;
    }

    // Ensure window doesn't go off the right edge - allow it to reach the very edge
    if (constrainedX + windowWidth > screenWidth) {
      const newX = screenWidth - windowWidth;
      console.log(
        `➡️ Right constraint applied: ${constrainedX} -> ${newX} (right edge: ${
          newX + windowWidth
        })`
      );
      constrainedX = newX;
    }

    console.log(
      `✅ Final constrained X: ${constrainedX}, right edge: ${
        constrainedX + windowWidth
      }`
    );
    return constrainedX;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

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
    if (this.window) {
      this.window.show();
      this.window.focus();
      // Ensure always on top when showing
      this.window.setAlwaysOnTop(true, "screen-saver", 1);
      this.window.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
      });
    } else {
      this.createWindow();
    }
  }

  /**
   * Hide the window
   */
  hide() {
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

  /**
   * Set window position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  setPosition(x, y) {
    if (this.window) {
      this.window.setPosition(x, y);
      // Re-enforce always on top after position change
      this.window.setAlwaysOnTop(true, "screen-saver", 1);
    }
  }

  /**
   * Set window size
   * @param {number} width - Window width
   * @param {number} height - Window height
   */
  setSize(width, height) {
    if (this.window) {
      this.window.setSize(width, height);
    }
  }

  // =============================================================================
  // KEYBOARD MOVEMENT METHODS
  // =============================================================================

  /**
   * Move TopBar left by specified pixels
   * @param {number} step - Number of pixels to move left
   */
  moveTopBarLeft(step) {
    if (this.window && !this.window.isDestroyed()) {
      const [currentX, currentY] = this.window.getPosition();
      const newX = Math.max(0, currentX - step); // Don't go below 0

      if (newX !== currentX) {
        this.window.setPosition(newX, currentY);
        this.window.setAlwaysOnTop(true, "screen-saver", 1);
        console.log(`⬅️  TopBar moved left to: (${newX}, ${currentY})`);
      }
    }
  }

  /**
   * Move TopBar right by specified pixels
   * @param {number} step - Number of pixels to move right
   */
  moveTopBarRight(step) {
    if (this.window && !this.window.isDestroyed()) {
      const [currentX, currentY] = this.window.getPosition();
      const [windowWidth, windowHeight] = this.window.getSize();
      const display = screen.getPrimaryDisplay();
      const { width: screenWidth } = display.size;

      const maxX = screenWidth - windowWidth;
      const newX = Math.min(maxX, currentX + step);

      if (newX !== currentX) {
        this.window.setPosition(newX, currentY);
        this.window.setAlwaysOnTop(true, "screen-saver", 1);
        console.log(`➡️  TopBar moved right to: (${newX}, ${currentY})`);
      }
    }
  }

  // =============================================================================
  // POSITIONING METHODS
  // =============================================================================

  /**
   * Set initial window position (centered at top)
   */
  setInitialPosition() {
    if (this.window && !this.window.isDestroyed()) {
      try {
        console.log("🎯 Setting initial TopBar position...");

        const position = this.calculateInitialPosition();
        this.window.setPosition(position.x, position.y);
        this.window.setAlwaysOnTop(true, "screen-saver", 1);

        this.logInitialState();
      } catch (error) {
        console.error("❌ Error setting initial position:", error);
      }
    }
  }

  /**
   * Calculate initial centered position
   * @returns {Object} Position coordinates {x, y}
   */
  calculateInitialPosition() {
    const display = screen.getPrimaryDisplay();
    const { width: screenWidth } = display.size; // Use full screen size

    // Calculate center position with boundary constraints
    let topBarCenterX = Math.round((screenWidth - WINDOW_CONFIG.width) / 2);
    topBarCenterX = Math.max(
      0, // Allow to reach left edge
      Math.min(
        topBarCenterX,
        screenWidth - WINDOW_CONFIG.width // Allow to reach right edge
      )
    );

    return {
      x: topBarCenterX,
      y: WINDOW_CONFIG.initialTopY,
    };
  }

  /**
   * Log initial application state
   */
  logInitialState() {
    console.log("🎯 === INITIAL STATE ===");
    console.log("✅ TopBar: Visible and centered");
    console.log("🔝 Always on Top: GLOBALLY ENFORCED");
    console.log("👁️  BottomCard: Hidden (will show on expand button click)");
  }

  // =============================================================================
  // SCREENSHOT COORDINATION
  // =============================================================================

  /**
   * Hide window for screenshot process
   */
  hideForScreenshot() {
    if (this.window && !this.window.isDestroyed()) {
      console.log("📸 Hiding TopBar for screenshot");
      this.window.hide();
    }
  }

  /**
   * Show window after screenshot process
   */
  showAfterScreenshot() {
    if (this.window && !this.window.isDestroyed()) {
      console.log("📸 Showing TopBar after screenshot");
      this.window.show();
      // Re-apply always on top after screenshot
      this.window.setAlwaysOnTop(true, "screen-saver", 1);
      this.window.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
      });
    }
  }
}

// =============================================================================
// EXPORT
// =============================================================================
export default TopBarWindow;
