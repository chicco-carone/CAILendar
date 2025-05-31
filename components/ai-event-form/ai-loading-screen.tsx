"use client";

import React from "react";
import type { AILoadingScreenProps } from "@/utils/types";

export function AILoadingScreen({ isVisible, currentMessageIndex, messages }: AILoadingScreenProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center">
      <div className="bg-white/10 dark:bg-black/30 backdrop-blur-lg border border-white/20 rounded-xl shadow-xl p-8 mx-4 animate-in fade-in zoom-in-95 duration-300 w-full max-w-sm">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo che gira */}
          <div className="relative">
            <img
              src="/logo.svg"
              alt="CAILendar Logo"
              className="w-16 h-16 animate-spin"
              style={{
                animationDuration: '3s',
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite'
              }}
            />
          </div>
          
          {/* Messaggio di caricamento */}
          <div className="text-center h-20 flex flex-col justify-center">
            <h3 className="text-lg font-semibold text-white mb-2">
              Elaborazione in corso...
            </h3>
            <div className="h-10 flex items-center justify-center">
              <p 
                className="text-white/70 text-sm transition-all duration-500 ease-in-out text-center px-2"
                key={currentMessageIndex}
              >
                {messages[currentMessageIndex]}
              </p>
            </div>
          </div>
          
          {/* Barra di caricamento animata */}
          <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
