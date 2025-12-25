import React, { useEffect, useState } from "react";
import Maincard from "./components/Maincard";
import BottomCard from "./components/BottomCard";

// Constants
const DEFAULT_VIEW = "topbar";
const ROUTES = {
  TOPBAR: "topbar",
  BOTTOMCARD: "bottomcard"
};

function App() {
  // State Management
  const [currentView, setCurrentView] = useState(DEFAULT_VIEW);

  // Hash Routing Logic
  const handleHashChange = () => {
    const hash = window.location.hash.substring(1);
    setCurrentView(hash || DEFAULT_VIEW);
  };

  // Component Lifecycle
  useEffect(() => {
    // Initial hash check
    handleHashChange();

    // Event listener setup
    window.addEventListener("hashchange", handleHashChange);

    // Cleanup function
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Component Rendering Logic
  const renderComponent = () => {
    switch (currentView) {
      case ROUTES.TOPBAR:
        return <Maincard />;
      case ROUTES.BOTTOMCARD:
        return <BottomCard />;
      default:
        return <Maincard />;
    }
  };

  // Main Render
  return (
    <div className="w-full h-screen">
      {renderComponent()}
    </div>
  );
}

export default App;
