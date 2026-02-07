import { useState, useEffect, useRef } from "react";
import { Camera, X, GripVertical } from "lucide-react";

const Content = ({
  analysisError,
  isAnalyzing,
  analysisText,
  displayPath,
  imageError,
  screenshotPath,
  handleImageError,
  handleImageLoad,
  ResponseComponent,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  console.log("Content component props:", {
    displayPath,
    imageError,
    screenshotPath,
    analysisText: analysisText ? "Has content" : "No content",
  });

  useEffect(() => {
    console.log("Content useEffect - displayPath changed:", displayPath);
    console.log("Content useEffect - imageError changed:", imageError);
    console.log("Content useEffect - screenshotPath changed:", screenshotPath);
  }, [displayPath, imageError, screenshotPath]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(() => {
          console.log("Content component re-initialized");
        }, 100);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && showPreview) {
        closePreview();
      }
    };

    if (showPreview) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [showPreview]);

  const handleThumbnailClickLocal = () => {
    if (displayPath && !imageError) {
      setShowPreview(true);
    }
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  return (
    <div className="flex flex-col select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-3">
        {/* Left Icons */}
        <div className="flex items-center gap-3">
          {/* Grid Icon */}
          <button className="w-10 h-10 backdrop-blur-lg rounded-full focus:outline-none focus:ring-0 active:outline-none -webkit-app-region-drag bg-white/10 opacity-90 flex items-center justify-center transition-colors">
            <GripVertical size={18} />
          </button>

          {/* Image Box */}
          <div
            className="-webkit-app-region-no-drag backdrop-blur-lg opacity-90 w-[40px] transition-colors h-[40px] rounded-full bg-white/10 overflow-hidden flex items-center justify-center relative"
            style={{
              cursor: displayPath && !imageError ? "pointer" : "default",
            }}
            onClick={handleThumbnailClickLocal}
          >
            {displayPath && !imageError ? (
              <img
                src={displayPath}
                alt="Screenshot"
                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                title="Click to preview"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            ) : imageError && screenshotPath ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="23"
                height="23"
                fill="#ff4444"
                className="opacity-50"
              >
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" />
              </svg>
            ) : (
              <Camera size={18} />
            )}
          </div>

          {/* Screen Mode Button */}
          <button className="px-4 py-2 focus:outline-none focus:ring-0 active:outline-none rounded-full opacity-90 bg-white/10 backdrop-blur-lg hover:bg-white/20 flex items-center gap-2 transition-colors -webkit-app-region-no-drag">
            <div className="w-4 h-3 border-2 border-white rounded-sm" />
            <span className="text-white text-sm">Screen Mode</span>
          </button>
        </div>

        {/* Right Buttons */}
        <div className="flex items-center gap-3">
          {/* Summary Button */}
          <button className="px-4 backdrop-blur-lg py-2 focus:outline-none focus:ring-0 active:outline-none rounded-full opacity-90 bg-white/10 hover:bg-white/20 flex items-center gap-2 transition-colors -webkit-app-region-no-drag">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4"
            >
              <path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path>
            </svg>
            <span className="text-white text-sm">Summary</span>
          </button>

          {/* Transcript Button */}
          <button className="px-4 py-2 mr-[3px] backdrop-blur-lg focus:outline-none focus:ring-0 active:outline-none rounded-full opacity-90 bg-white/10 hover:bg-white/20 flex items-center gap-2 transition-colors -webkit-app-region-no-drag">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4"
            >
              <path d="M14.3428 2.99996C14.1216 3.62563 14 4.29855 14 4.99997C14 8.31368 16.6863 11 20 11C20.7014 11 21.3743 10.8784 22 10.6572V18C22 18.5523 21.5523 19 21 19H14.4502L12 22.5L9.5498 19H3C2.44772 19 2 18.5523 2 18V3.99997C2.00002 3.4477 2.44773 2.99996 3 2.99996H14.3428ZM19.5293 1.3193C19.7058 0.893513 20.2942 0.8935 20.4707 1.3193L20.7236 1.93063C21.1555 2.97343 21.9615 3.80614 22.9746 4.2568L23.6914 4.57614C24.1022 4.75882 24.1022 5.35635 23.6914 5.53903L22.9326 5.87692C21.945 6.3162 21.1534 7.11943 20.7139 8.1279L20.4668 8.69333C20.2863 9.10747 19.7136 9.10747 19.5332 8.69333L19.2861 8.1279C18.8466 7.11942 18.0551 6.3162 17.0674 5.87692L16.3076 5.53903C15.8974 5.35618 15.8974 4.75895 16.3076 4.57614L17.0254 4.2568C18.0384 3.80614 18.8445 2.97343 19.2764 1.93063L19.5293 1.3193Z"></path>
            </svg>
            <span className="text-white text-sm">Transcript</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="justify-center items-center flex rounded-b-[33px]">
        <div className="rounded-[18px] p- text-gray-200 text-sm leading-relaxed h-[609px]  items-center overflow-y-auto scrollbar-hide scrollbar-track-transparent relative -webkit-app-region-no-drag focus:outline-none focus:ring-0 active:outline-none transition"></div>
      </div>

      {/* Screenshot Preview Modal */}
      {showPreview && displayPath && (
        <div
          className="fixed inset-0 z-50 bg-black rounded-[23px] flex items-center justify-center -webkit-app-region-drag"
          onClick={closePreview}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10 -webkit-app-region-no-drag"
            onClick={closePreview}
          >
            <X size={24} />
          </button>

          <img
            src={displayPath}
            alt="Screenshot Preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl -webkit-app-region-drag"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/50 text-sm -webkit-app-region-drag">
            Press ESC to close
          </div>
        </div>
      )}
    </div>
  );
};

export default Content;