'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, RefreshCw, Check, AlertCircle, Loader } from 'lucide-react';

type SelfieStatus = 'idle' | 'requesting' | 'live' | 'captured' | 'error_permission' | 'error_camera';

interface SelfieCaptureProps {
  onCapture: (dataUrl: string) => void;
  onStatusChange?: (status: SelfieStatus) => void;
}

export function SelfieCapture({ onCapture, onStatusChange }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<SelfieStatus>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const updateStatus = useCallback((s: SelfieStatus) => {
    setStatus(s);
    onStatusChange?.(s);
  }, [onStatusChange]);

  const startCamera = useCallback(async () => {
    updateStatus('requesting');
    setErrorMsg('');
    setCapturedImage(null);

    try {
      // Explicitly request front-facing camera, no file access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      updateStatus('live');
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        updateStatus('error_permission');
        setErrorMsg('Camera permission was denied. Please allow camera access and try again.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        updateStatus('error_camera');
        setErrorMsg('No camera found on this device. Please use a device with a camera.');
      } else {
        updateStatus('error_camera');
        setErrorMsg('Could not access camera. Please try again.');
      }
    }
  }, [updateStatus]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror the image (since front cam is mirrored)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    updateStatus('captured');
  }, [stopCamera, updateStatus]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const useSelfie = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Check if mediaDevices is available
  const cameraSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      {/* LIVE CAMERA badge */}
      <div style={{
        background: 'var(--error-50)',
        border: '1px solid var(--error-100)',
        borderRadius: 'var(--radius-lg)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        maxWidth: '360px',
      }}>
        <Camera size={16} style={{ color: 'var(--error-500)' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--error-600)' }}>
            Live Selfie Verification Required
          </div>
          <div style={{ fontSize: '11px', color: 'var(--error-500)' }}>
            Camera capture only — gallery upload not allowed
          </div>
        </div>
      </div>

      {/* Camera Preview Area */}
      <div className="selfie-preview-ring" style={{
        width: '220px',
        height: '220px',
        borderColor: status === 'live' ? 'var(--error-400)' : status === 'captured' ? 'var(--success-400)' : 'var(--gray-300)',
        transition: 'border-color 0.3s ease',
      }}>
        {/* Live video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            display: status === 'live' ? 'block' : 'none',
            transform: 'scaleX(-1)', // Mirror front cam
          }}
        />

        {/* Captured image */}
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured selfie"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
        )}

        {/* Idle/Loading state */}
        {!capturedImage && status !== 'live' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px', textAlign: 'center' }}>
            {status === 'requesting' ? (
              <Loader size={32} style={{ color: 'var(--primary-400)', animation: 'spin 1s linear infinite' }} />
            ) : (
              <Camera size={40} style={{ color: 'var(--gray-300)' }} />
            )}
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {status === 'requesting' ? 'Accessing camera...' : 'Tap to start camera'}
            </span>
          </div>
        )}

        {/* Live indicator */}
        {status === 'live' && (
          <div className="camera-live-indicator">
            <div className="camera-live-dot" />
            LIVE
          </div>
        )}

        {/* Canvas (hidden) */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Instructions when live */}
      {status === 'live' && (
        <div style={{
          background: 'var(--gray-50)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px',
          maxWidth: '320px',
          width: '100%',
        }}>
          <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
            <li>Keep your face inside the circle</li>
            <li>Look directly at the camera</li>
            <li>Make sure your face is clearly visible</li>
            <li>Ensure good lighting</li>
          </ul>
        </div>
      )}

      {/* Error messages */}
      {(status === 'error_permission' || status === 'error_camera') && (
        <div style={{
          background: 'var(--error-50)',
          border: '1px solid var(--error-100)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
          maxWidth: '360px',
          width: '100%',
        }}>
          <AlertCircle size={16} style={{ color: 'var(--error-500)', flexShrink: 0, marginTop: '1px' }} />
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--error-600)' }}>{errorMsg}</p>
        </div>
      )}

      {/* No camera support */}
      {!cameraSupported && (
        <div style={{
          background: 'var(--error-50)',
          border: '1px solid var(--error-100)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px',
          maxWidth: '360px',
          width: '100%',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--error-600)' }}>
            Camera access is not supported in this browser. Please use Chrome or Safari on a device with a camera.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '360px', flexWrap: 'wrap' }}>
        {/* Start camera */}
        {(status === 'idle' || status === 'error_permission' || status === 'error_camera') && cameraSupported && (
          <button
            className="btn btn-primary btn-full"
            onClick={startCamera}
            style={{ gap: '8px' }}
          >
            <Camera size={18} />
            {status === 'idle' ? 'Open Camera' : 'Try Again'}
          </button>
        )}

        {/* Capture */}
        {status === 'live' && (
          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={capturePhoto}
            style={{ gap: '8px' }}
          >
            <Camera size={20} />
            Capture Selfie
          </button>
        )}

        {/* Retake + Use */}
        {status === 'captured' && (
          <>
            <button
              className="btn btn-outline"
              onClick={retake}
              style={{ flex: 1, gap: '8px' }}
            >
              <RefreshCw size={16} />
              Retake
            </button>
            <button
              className="btn btn-success"
              onClick={useSelfie}
              style={{ flex: 2, gap: '8px' }}
            >
              <Check size={18} />
              Use Selfie
            </button>
          </>
        )}
      </div>

      {/* Status indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        fontWeight: 600,
        color: status === 'captured' ? 'var(--success-600)' :
               status === 'live' ? 'var(--error-500)' :
               'var(--text-muted)',
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: status === 'captured' ? 'var(--success-500)' :
                      status === 'live' ? 'var(--error-500)' :
                      'var(--gray-300)',
          animation: status === 'live' ? 'pulse 1s ease infinite' : 'none',
        }} />
        {status === 'idle' && 'Selfie Not Captured'}
        {status === 'requesting' && 'Requesting Camera...'}
        {status === 'live' && 'Camera Active — Live Preview'}
        {status === 'captured' && 'Selfie Captured ✓'}
        {status === 'error_permission' && 'Camera Permission Required'}
        {status === 'error_camera' && 'Camera Not Available'}
      </div>
    </div>
  );
}
