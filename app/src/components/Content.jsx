import { useState, useEffect, useRef } from "react";
import { Camera, X } from "lucide-react";
import { Loader } from "./ai-elements/loader";
import answerIcon from "../assets/answer.svg";
import sourceIcon from "../assets/source.svg";
import relatedIcon from "../assets/related.svg";
import originIcon from "../assets/origin.svg";
import suggestionIcon from "../assets/suggestion.svg";
import TrascriptionIcon from "../assets/Transciption.svg";

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
  const [activeTab, setActiveTab] = useState("assistant");
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

  const contentRef = useRef(null);
  const currentContent = analysisText || "";

  // Force re-initialization when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Force a small delay to ensure DOM is ready
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

  // Handle ESC key to close preview
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

  // Image handling functions
  const handleThumbnailClickLocal = () => {
    if (displayPath && !imageError) {
      setShowPreview(true);
    }
  };

  // Close preview
  const closePreview = () => {
    setShowPreview(false);
  };

  return (
    <div className=" flex flex-col -webkit-app-region-drag">
      {/* Tabs */}
      <div className="flex items-center gap-4  border mt-2 rounded-full border-white/10 mx-auto p-[4px]   ">
        {/* Image Box - Shows screenshot if available */}
        <div
          className="-webkit-app-region-no-drag w-[40px] h-[40px]  rounded-full bg-black/30  overflow-hidden flex items-center justify-center relative"
          style={{
            cursor: displayPath && !imageError ? "pointer" : "default",
          }}
          onClick={handleThumbnailClickLocal}
          title={`Debug: displayPath=${
            displayPath ? "Yes" : "No"
          }, imageError=${imageError}, screenshotPath=${
            screenshotPath ? "Yes" : "No"
          }`}
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
            // Error state - just show error icon without retry
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
            // Default loader icon
            <Loader size={15} />
          )}
        </div>
        {/* Answer Tab */}
        <button
          onClick={() => setActiveTab("assistant")}
          className={`relative transition-all duration-300 px-3 py-2 rounded-full group -webkit-app-region-no-drag focus:outline-none focus:ring-0 active:outline-none ${
            activeTab === "assistant"
              ? "bg-white text-black"
              : "text-white hover:bg-white hover:text-black"
          }`}
        >
          <span className="flex items-center gap-2">
            <img
              src={answerIcon}
              alt="answer"
              className={`w-[18px] h-[18px] transition-all duration-300 ${
                activeTab === "assistant"
                  ? "brightness-0"
                  : "group-hover:brightness-0"
              }`}
            />
            <span className="text-sm">Answer</span>
          </span>
        </button>

        {/* Sources Tab */}
        <button
          onClick={() => setActiveTab("sources")}
          className={`relative transition-all duration-300 px-3 py-2 rounded-full group -webkit-app-region-no-drag focus:outline-none focus:ring-0 active:outline-none  ${
            activeTab === "sources"
              ? "bg-white text-black"
              : "text-white hover:bg-white hover:text-black"
          }`}
        >
          <span className="flex items-center gap-2">
            <img
              src={sourceIcon}
              alt="sources"
              className={`w-[16px] h-[16px] transition-all duration-300 ${
                activeTab === "sources"
                  ? "brightness-0"
                  : "group-hover:brightness-0"
              }`}
            />
            <span className="text-sm">Sources</span>
          </span>
        </button>

        {/* Related Tab */}
        <button
          onClick={() => setActiveTab("related")}
          className={`relative transition-all duration-300 px-3 py-2 rounded-full group -webkit-app-region-no-drag focus:outline-none focus:ring-0 active:outline-none  ${
            activeTab === "related"
              ? "bg-white text-black"
              : "text-white hover:bg-white hover:text-black"
          }`}
        >
          <span className="flex items-center gap-2">
            <img
              src={relatedIcon}
              alt="related"
              className={`w-[15px]   h-[15px] transition-all duration-300 ${
                activeTab === "related"
                  ? "brightness-0"
                  : "group-hover:brightness-0"
              }`}
            />
            <span className="text-sm">Related</span>
          </span>
        </button>

        {/* Orgin Tab */}
        <button
          onClick={() => setActiveTab("orgin")}
          className={`relative transition-all duration-300 px-3 py-2 rounded-full group -webkit-app-region-no-drag focus:outline-none focus:ring-0 active:outline-none  ${
            activeTab === "orgin"
              ? "bg-white text-black"
              : "text-white hover:bg-white hover:text-black"
          }`}
        >
          <span className="flex items-center gap-2">
            <img
              src={originIcon}
              alt="origin"
              className={`w-4 h-4 transition-all duration-300 ${
                activeTab === "orgin"
                  ? "brightness-0"
                  : "group-hover:brightness-0"
              }`}
            />
            <span className="text-sm">Orgin</span>
          </span>
        </button>

        {/* Suggestions Tab */}
        <button
          onClick={() => setActiveTab("suggestions")}
          className={`relative transition-all duration-300 px-3 py-2 rounded-full group -webkit-app-region-no-drag focus:outline-none focus:ring-0 active:outline-none  ${
            activeTab === "suggestions"
              ? "bg-white text-black"
              : "text-white hover:bg-white hover:text-black"
          }`}
        >
          <span className="flex items-center gap-2">
            <img
              src={suggestionIcon}
              alt="suggestions"
              className={`w-4 h-4 transition-all duration-300 ${
                activeTab === "suggestions"
                  ? "brightness-0"
                  : "group-hover:brightness-0"
              }`}
            />
            <span className="text-sm">Suggestion</span>
          </span>
        </button>

        {/* Transcription Tab */}
        <button
          onClick={() => setActiveTab("Transcription")}
          className={`relative transition-all duration-300 px-3 py-2 mr-[2px] rounded-full group -webkit-app-region-no-drag focus:outline-none focus:ring-0 active:outline-none  ${
            activeTab === "Transcription"
              ? "bg-white text-black"
              : "text-white hover:bg-white hover:text-black"
          }`}
        >
          <span className="flex items-center gap-2">
            <img
              src={TrascriptionIcon}
              alt="Transcription"
              className={`w-4 h-4 transition-all duration-300 ${
                activeTab === "Transcription"
                  ? "brightness-0"
                  : "group-hover:brightness-0"
              }`}
            />
            <span className="text-sm">Transcription</span>
          </span>
        </button>
      </div>

      {/* Content Area */}
      <div className=" justify-center items-center flex mt-1 ">
        <div
          ref={contentRef}
          className="rounded-[18px] p-4  text-gray-200 text-sm leading-relaxed h-[615x] w-[1030px] items-center  overflow-y-auto scrollbar-hide scrollbar-track-transparent relative -webkit-app-region-no-drag focus:outline-none focus:ring-0 active:outline-none transition"
          onMouseDown={(e) => e.stopPropagation()}
          style={{ userSelect: "text" }}
        >
          {/* Answer Tab */}
          {activeTab === "assistant" && (
            <div className="ml-1">
              {analysisError ? (
                <div className="text-red-400 p-3 bg-red-900/20 rounded-lg">
                  Error: {analysisError}
                </div>
              ) : ResponseComponent ? (
                <ResponseComponent
                  content={analysisText}
                  streaming={isAnalyzing}
                  className="w-full max-w-full"
                />
              ) : (
                <div className="text-gray-500">Waiting for content…</div>
              )}
            </div>
          )}

          {/* Sources Tab */}
          {activeTab === "sources" && (
            <div className="whitespace-pre-wrap  ml-1 text-white/90">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Sources
                </h3>
                <div className="text-gray-400">
                  <p>No sources available for this content.</p>
                  <p className="text-sm mt-2">
                    Sources will appear here when available.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "related" && (
            <div className="whitespace-pre-wrap  ml-1 text-white/90">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Related Content
                </h3>
                <div className="text-gray-400">
                  <p>No related content available.</p>
                  <p className="text-sm mt-2">
                    Related topics and suggestions will appear here.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "orgin" && (
            <div className="whitespace-pre-wrap  ml-1 text-white/90">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Origin
                </h3>
                <div className="text-gray-400">
                  <p>Origin information not available.</p>
                  <p className="text-sm mt-2">
                    Details about the source and origin of this content will be
                    displayed here.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "suggestions" && (
            <div className="whitespace-pre-wrap    ml-1 text-white/90">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Suggestions
                </h3>
                <div className="text-gray-400">
                  <p>No suggestions available.</p>
                  <p className="text-sm mt-2">
                    AI-powered suggestions and recommendations will appear here.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Preview Modal */}
      {showPreview && displayPath && (
        <div
          className="fixed inset-0 z-50 bg-black rounded-[23px] flex items-center justify-center -webkit-app-region-drag"
          onClick={closePreview}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10 -webkit-app-region-no-drag"
            onClick={closePreview}
          >
            <X size={24} />
          </button>

          {/* Screenshot */}
          <img
            src={displayPath}
            alt="Screenshot Preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl -webkit-app-region-drag"
            onClick={(e) => e.stopPropagation()}
          />

          {/* ESC hint */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/50 text-sm -webkit-app-region-drag">
            Press ESC to close
          </div>
        </div>
      )}
    </div>
  );
};

export default Content;
