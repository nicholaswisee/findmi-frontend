"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { AlertTriangle, Camera, Loader2, RefreshCw } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type OrderQrScannerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (value: string) => void;
};

export function OrderQrScannerDialog({
  open,
  onOpenChange,
  onDetected,
}: OrderQrScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current = null;

    if (videoRef.current) {
      const mediaStream = videoRef.current.srcObject as MediaStream | null;
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleDetected = useCallback(
    (value: string) => {
      if (!value) return;
      stopScanner();
      onDetected(value);
    },
    [onDetected, stopScanner]
  );

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return;
    setError(null);
    setInitializing(true);

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    try {
      const controls = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
          },
        },
        videoRef.current,
        (result, err) => {
          if (result) {
            handleDetected(result.getText());
          }
          if (
            err &&
            !(err instanceof NotFoundException) &&
            err?.message &&
            !error
          ) {
            setError(err.message);
          }
        }
      );
      controlsRef.current = controls;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Tidak bisa mengakses kamera. Pastikan sudah memberikan izin.";
      setError(message);
    } finally {
      setInitializing(false);
    }
  }, [error, handleDetected]);

  useEffect(() => {
    if (open) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open, startScanner, stopScanner]);

  const handleRetry = () => {
    stopScanner();
    startScanner();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="bg-background/70 backdrop-blur">
          <DialogDescription>
            Arahkan kamera ke QR Code yang ditunjukkan pembeli untuk membuka
            detail order secara instan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pb-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-black/80">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              muted
              playsInline
            />
            {initializing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm">Menginisialisasi kamera...</p>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pastikan QR berada dalam kotak dan area cukup terang. Kamera
              belakang perangkat biasanya memberikan hasil terbaik.
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={handleRetry}
              disabled={initializing}
            >
              <RefreshCw className="h-4 w-4" />
              Muat ulang
            </Button>
            <Button type="button" onClick={() => onOpenChange(false)}>
              Selesai
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
