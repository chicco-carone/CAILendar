"use client";

import React from "react";
import { Upload, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { FileUploadSectionProps } from "@/utils/types";

export function FileUploadSection({
  file,
  image,
  onFileUpload,
  onRemoveFile,
  onCameraClick,
  fileInputRef,
}: FileUploadSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/70">
          Upload an image or document (optional)
        </p>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCameraClick}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Camera
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Take a photo with your camera
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {file ? (
        <div className="relative rounded-lg overflow-hidden bg-black/30 p-4 flex items-center gap-3">
          {image ? (
            <img
              src={image || "/placeholder.svg"}
              alt="Uploaded"
              className="w-16 h-16 object-cover rounded"
            />
          ) : (
            <div className="w-16 h-16 flex items-center justify-center bg-white/10 rounded">
              <Upload className="h-8 w-8 text-white/50" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-white font-medium truncate">
              {file.name}
            </p>
            <p className="text-xs text-white/50">
              {file.type || "Documento"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 text-white hover:bg-black/70 rounded-full h-8 w-8"
            onClick={onRemoveFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-white/40 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-white/50" />
          <p className="text-white/70">
            Click to upload an image or document
          </p>
          <p className="text-xs text-white/50 mt-1">
            PNG, JPG, GIF, PDF, DOCX, DOC, ODT up to 5MB
          </p>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text"
        onChange={onFileUpload}
      />
    </div>
  );
}
