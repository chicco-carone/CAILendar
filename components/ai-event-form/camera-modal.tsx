"use client";

import React from "react";
import { X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Camera as CameraPro } from "react-camera-pro";
import type { CameraModalProps } from "@/utils/types";

export function CameraModal({ isOpen, onClose, onCapture, cameraRef }: CameraModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white/10 dark:bg-black/30 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Take a Photo
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4">
          <div className="relative bg-black rounded-lg overflow-hidden h-64">
            <CameraPro
              ref={cameraRef}
              aspectRatio={16 / 9}
              facingMode="environment"
              errorMessages={{
                noCameraAccessible:
                  "No camera device accessible. Please connect your camera or try a different browser.",
                permissionDenied:
                  "Permission denied. Please refresh and give camera permission.",
                switchCamera:
                  "It is not possible to switch camera to different one because there is only one video device accessible.",
                canvas: "Canvas is not supported.",
              }}
            />
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={onCapture}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Camera className="h-4 w-4 mr-2" />
              Capture
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
