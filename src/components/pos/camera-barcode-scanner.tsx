'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product, ProductVariant } from '@/types/database';
import {
  Camera,
  Flashlight,
  FlashlightOff,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Barcode,
  Search,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface CameraBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  variants: ProductVariant[];
  onProductScanned: (product: Product, variant: ProductVariant) => void;
}

export function CameraBarcodeScanner({
  isOpen,
  onClose,
  products,
  variants,
  onProductScanned,
}: CameraBarcodeScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isBarcodeDetectorSupported, setIsBarcodeDetectorSupported] = React.useState(false);
  const [torchEnabled, setTorchEnabled] = React.useState(false);
  const [hasTorch, setHasTorch] = React.useState(false);
  const [facingMode, setFacingMode] = React.useState<'environment' | 'user'>('environment');
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [manualCode, setManualCode] = React.useState('');
  const [lastScannedResult, setLastScannedResult] = React.useState<{
    name: string;
    variantName: string;
    sku: string;
  } | null>(null);

  const lastScannedCodeRef = React.useRef<string>('');
  const lastScannedTimeRef = React.useRef<number>(0);

  // Play crisp scanner beep sound (1750Hz sine wave for 80ms)
  const playBeep = React.useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1750, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // AudioContext blocked by autoplay policy
    }
  }, [soundEnabled]);

  // Handle scanned code matching
  const handleCodeFound = React.useCallback(
    (rawCode: string) => {
      const code = rawCode.trim();
      if (!code) return;

      const now = Date.now();
      // Debounce 1.2s if scanning the same code repeatedly
      if (lastScannedCodeRef.current === code && now - lastScannedTimeRef.current < 1200) {
        return;
      }
      lastScannedCodeRef.current = code;
      lastScannedTimeRef.current = now;

      // Find matching variant or product
      // 1. By variant SKU
      let matchedVariant = variants.find(
        (v) => v.sku.toLowerCase() === code.toLowerCase()
      );
      let matchedProduct = matchedVariant
        ? products.find((p) => p.id === matchedVariant?.product_id)
        : null;

      // 2. By variant ID
      if (!matchedVariant) {
        matchedVariant = variants.find((v) => v.id === code);
        if (matchedVariant) {
          matchedProduct = products.find((p) => p.id === matchedVariant?.product_id);
        }
      }

      // 3. By product ID
      if (!matchedProduct) {
        matchedProduct = products.find((p) => p.id === code);
        if (matchedProduct) {
          matchedVariant = variants.find((v) => v.product_id === matchedProduct?.id);
        }
      }

      // 4. By product name or SKU substring match
      if (!matchedProduct || !matchedVariant) {
        const foundProd = products.find(
          (p) =>
            p.name.toLowerCase().includes(code.toLowerCase()) ||
            p.id.toLowerCase().includes(code.toLowerCase())
        );
        if (foundProd) {
          matchedProduct = foundProd;
          matchedVariant = variants.find((v) => v.product_id === foundProd.id);
        }
      }

      if (matchedProduct && matchedVariant) {
        playBeep();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([40, 30, 40]);
          } catch {}
        }

        onProductScanned(matchedProduct, matchedVariant);
        setLastScannedResult({
          name: matchedProduct.name,
          variantName: matchedVariant.name,
          sku: matchedVariant.sku,
        });

        setTimeout(() => {
          setLastScannedResult((prev) => (prev?.sku === matchedVariant?.sku ? null : prev));
        }, 3000);
      } else {
        setErrorMessage(`Không tìm thấy sản phẩm khớp mã: "${code}"`);
        setTimeout(() => setErrorMessage(null), 3000);
      }
    },
    [variants, products, onProductScanned, playBeep]
  );

  // Initialize Camera Stream
  React.useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    let isCancelled = false;

    // Check BarcodeDetector support
    const hasBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    setIsBarcodeDetectorSupported(hasBarcodeDetector);

    async function startCamera() {
      try {
        setErrorMessage(null);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Check if track supports torch
        const track = stream.getVideoTracks()[0];
        if (track && 'getCapabilities' in track) {
          const capabilities = (track as unknown as { getCapabilities: () => { torch?: boolean } }).getCapabilities();
          setHasTorch(Boolean(capabilities?.torch));
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setHasPermission(false);
          setErrorMessage(
            err instanceof Error && err.name === 'NotAllowedError'
              ? 'Vui lòng cấp quyền truy cập Camera trên trình duyệt để quét mã vạch.'
              : 'Không thể mở Camera trên thiết bị này.'
          );
        }
      }
    }

    void startCamera();

    return () => {
      isCancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, facingMode]);

  // Active Detection Loop using native BarcodeDetector
  React.useEffect(() => {
    if (!isOpen || !hasPermission || !isBarcodeDetectorSupported) return;

    let active = true;
    let detector: unknown = null;

    try {
      const BarcodeDetectorClass = (window as unknown as { BarcodeDetector: new (opts?: { formats: string[] }) => unknown }).BarcodeDetector;
      detector = new BarcodeDetectorClass({
        formats: [
          'qr_code',
          'ean_13',
          'ean_8',
          'code_128',
          'code_39',
          'code_93',
          'upc_a',
          'upc_e',
          'itf',
          'data_matrix',
        ],
      });
    } catch {
      detector = null;
    }

    if (!detector) return;

    const detectLoop = async () => {
      if (!active) return;
      if (videoRef.current && videoRef.current.readyState >= 2) {
        try {
          const barcodes = await (detector as { detect: (v: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> }).detect(
            videoRef.current
          );
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            handleCodeFound(barcodes[0].rawValue);
          }
        } catch {
          // ignore frame detection error
        }
      }
      if (active) {
        requestAnimationFrame(detectLoop);
      }
    };

    const frameId = requestAnimationFrame(detectLoop);

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
  }, [isOpen, hasPermission, isBarcodeDetectorSupported, handleCodeFound]);

  // Toggle Torch / Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        const nextState = !torchEnabled;
        await (track as unknown as { applyConstraints: (c: { advanced: Array<{ torch: boolean }> }) => Promise<void> }).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchEnabled(nextState);
      } catch {
        // torch not supported
      }
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Manual code submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeFound(manualCode.trim());
    setManualCode('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quét Mã Vạch & QR Hàng Hóa"
      description="Hướng camera vào mã vạch trên tem sản phẩm hoặc standee để tự động thêm vào giỏ."
      maxWidth="md"
    >
      <div className="space-y-3">
        {/* Viewfinder Camera Box */}
        <div className="relative aspect-[4/3] sm:aspect-video bg-black rounded-[10px] overflow-hidden flex items-center justify-center border-2 border-[#315C4C]/40 shadow-inner">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Scanner Reticle & Laser Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Darkened mask around reticle */}
            <div className="relative w-64 h-48 sm:w-72 sm:h-52 border-2 border-[#2F7D55] rounded-xl overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
              {/* Corner guides */}
              <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-white rounded-tl" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-white rounded-tr" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-white rounded-bl" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-white rounded-br" />

              {/* Animated laser line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#2F7D55] to-transparent shadow-[0_0_12px_#2F7D55] animate-[scan_2s_ease-in-out_infinite]" />
            </div>
          </div>

          {/* Camera Controls Overlay (Top Right) */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                  torchEnabled ? 'bg-[#B7791F] text-white' : 'bg-black/50 text-white hover:bg-black/70'
                }`}
                title={torchEnabled ? 'Tắt đèn pin' : 'Bật đèn pin'}
              >
                {torchEnabled ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={toggleCamera}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-colors"
              title="Đổi camera trước/sau"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                soundEnabled ? 'bg-black/50 text-white' : 'bg-[#C44536]/80 text-white'
              }`}
              title={soundEnabled ? 'Tắt âm thanh bíp' : 'Bật âm thanh bíp'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Scanned Success HUD Overlay */}
          {lastScannedResult && (
            <div className="absolute bottom-3 inset-x-3 bg-[#EAF4EE]/95 border border-[#2F7D55] backdrop-blur-md p-2.5 rounded-lg shadow-lg flex items-center gap-2.5 animate-in slide-in-from-bottom-2 z-10">
              <CheckCircle2 className="w-5 h-5 text-[#2F7D55] shrink-0" />
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-bold text-[#202124] truncate">{lastScannedResult.name}</p>
                <p className="text-[11px] text-[#2F7D55] font-semibold truncate">
                  Đã thêm {lastScannedResult.variantName} (SKU: {lastScannedResult.sku}) vào giỏ!
                </p>
              </div>
            </div>
          )}

          {/* Error Message HUD */}
          {errorMessage && (
            <div className="absolute bottom-3 inset-x-3 bg-[#FDF1F0]/95 border border-[#C44536] backdrop-blur-md p-2 rounded-lg text-xs text-[#C44536] font-semibold flex items-center gap-2 z-10">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Manual SKU Input Fallback & USB Scanner Support */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Barcode className="w-4 h-4 text-[#9E9E9C] absolute left-3 top-2.5 pointer-events-none" />
            <Input
              type="text"
              placeholder="Hoặc gõ mã SKU / quét bằng súng quét USB..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="pl-9 h-9 text-xs bg-white"
              autoFocus
            />
          </div>
          <Button type="submit" variant="primary" size="sm" className="h-9 px-4 text-xs font-bold shrink-0">
            Tìm &amp; Thêm
          </Button>
        </form>

        <p className="text-[11px] text-[#737373] text-center">
          ⚡ Tương thích với tất cả súng quét mã vạch cầm tay, tem Barcode 1D (EAN/Code128) và mã QR 2D.
        </p>
      </div>
    </Modal>
  );
}
