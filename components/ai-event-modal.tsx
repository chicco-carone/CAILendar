"use client";

import React from "react";
import { FiChevronRight } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { EventModal } from "@/components/event-modal";
import { cn } from "@/lib/utils";
import { useAIEventModal } from "@/hooks/use-ai-event-modal";
import {
  AIModalHeader,
  AILoadingScreen,
  AIInputSection,
  FileUploadSection,
  CameraModal,
  AIAlertsSection,
  AIFormActions,
} from "@/components/ai-event-form";
import type { AIEventModalProps } from "@/utils/types";

export function AIEventModal({
  isOpen,
  onCloseAction,
  onSaveAction,
}: AIEventModalProps) {
  const {
    // State
    prompt,
    image,
    file,
    generatedEvents,
    currentEventIndex,
    showEventModal,
    showWarnings,
    isCameraOpen,
    showLoadingScreen,
    currentLoadingMessage,
    
    // Loading messages
    loadingMessages,
    
    // AI state
    loading,
    error,
    warnings,
    conflicts,
    lastMetadata,
    
    // Speech recognition state
    listening,
    browserSupportsSpeechRecognition,
    
    // Refs
    fileInputRef,
    cameraRef,
    
    // Handlers
    handleMicClick,
    handleFileUpload,
    handleRemoveFile,
    startCamera,
    stopCamera,
    capturePhoto,
    handleSubmit,
    handleCloseModal,
    handleSaveEvent,
    handleDeleteEvent,
    handleModifyEvent,
    
    // AI handlers
    clearError,
    
    // Setters
    setPrompt,
    setShowWarnings,
    setCurrentEventIndex,
    setShowEventModal,
  } = useAIEventModal({
    isOpen,
    onCloseAction,
    onSaveAction,
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Loading Screen */}
      <AILoadingScreen
        isVisible={showLoadingScreen}
        currentMessageIndex={currentLoadingMessage}
        messages={loadingMessages}
      />

      {/* Main Modal */}
      <div className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center",
        showLoadingScreen && "hidden"
      )}>
        <div className="bg-white/10 dark:bg-black/30 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          
          {/* Header */}
          <AIModalHeader
            onClose={handleCloseModal}
            metadata={lastMetadata}
          />

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Alerts Section */}
            <AIAlertsSection
              error={error}
              warnings={warnings}
              conflicts={conflicts}
              showWarnings={showWarnings}
              onClearError={clearError}
              onHideWarnings={() => setShowWarnings(false)}
            />

            {/* Form Content */}
            <div className="p-4 space-y-4">
              {/* Input Section */}
              <AIInputSection
                prompt={prompt}
                onPromptChange={setPrompt}
                onMicClick={handleMicClick}
                listening={listening}
                browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
              />

              {/* File Upload Section */}
              <FileUploadSection
                file={file}
                image={image}
                onFileUpload={handleFileUpload}
                onRemoveFile={handleRemoveFile}
                onCameraClick={startCamera}
                fileInputRef={fileInputRef}
              />
            </div>
          </div>

          {/* Actions */}
          <AIFormActions
            onCancel={handleCloseModal}
            onSubmit={handleSubmit}
            loading={loading}
            showLoadingScreen={showLoadingScreen}
            hasInput={!!(prompt || image)}
          />
        </div>
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={stopCamera}
        onCapture={capturePhoto}
        cameraRef={cameraRef}
      />

      {/* Event Modal for generated events with navigation */}
      {showEventModal && generatedEvents.length > 0 && (
        <div>
          <EventModal
            isOpen={showEventModal}
            onCloseAction={() => setShowEventModal(false)}
            onSaveAction={handleSaveEvent}
            onDelete={handleDeleteEvent}
            onModify={handleModifyEvent}
            event={generatedEvents[currentEventIndex]}
            mode="edit"
            onPrev={() => setCurrentEventIndex(Math.max(0, currentEventIndex - 1))}
            onNext={() =>
              setCurrentEventIndex(
                Math.min(generatedEvents.length - 1, currentEventIndex + 1)
              )
            }
            canPrev={currentEventIndex > 0}
            canNext={currentEventIndex < generatedEvents.length - 1}
            eventIndex={currentEventIndex}
            eventCount={generatedEvents.length}
          />
          {generatedEvents.length > 1 && (
            <div className="flex justify-between items-center mt-2 px-4">
              <Button
                onClick={() => setCurrentEventIndex(Math.max(0, currentEventIndex - 1))}
                disabled={currentEventIndex === 0}
                className="bg-white/10 text-white flex items-center justify-center"
                aria-label="Evento precedente"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </Button>
              <span className="text-white/70">
                Evento {currentEventIndex + 1} di {generatedEvents.length}
              </span>
              <Button
                onClick={() =>
                  setCurrentEventIndex(
                    Math.min(generatedEvents.length - 1, currentEventIndex + 1)
                  )
                }
                disabled={currentEventIndex === generatedEvents.length - 1}
                className="bg-white/10 text-white flex items-center justify-center"
                aria-label="Evento successivo"
              >
                <FiChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
