import { useRef, useState } from 'react';
import { Camera as CameraIcon, ImagePlus, ScanLine } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../common/Button';
import { Camera } from 'react-camera-pro';

export default function CameraView({ onCapture, onUpload, isAnalyzing }) {
  const cameraRef = useRef(null);
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');

  const handleCapture = () => {
    try {
      const photo = cameraRef.current?.takePhoto();
      if (photo) {
        onCapture(photo);
      }
    } catch (e) {
      setError('Camera did not return a capture. Please try again.');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[#f9f6ff] p-3 shadow-[0_22px_70px_-28px_rgba(88,43,174,0.45)]">
      <div className="relative overflow-hidden rounded-[1.5rem]">
        <Camera
          ref={cameraRef}
          facingMode="environment"
          errorMessages={{
            noCameraAccessible: 'No camera detected. Please try uploading an image instead.',
            permissionDenied: 'Camera access was blocked. Please enable it to continue.',
            switchCamera: 'Camera switching is unavailable.',
            canvas: 'This device does not support the preview.',
          }}
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.01, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex h-56 w-56 items-center justify-center rounded-[2rem] border-[3px] border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)]"
          >
            <div className="rounded-[1.4rem] border border-white/60 p-4">
              <ScanLine size={32} className="text-white/80" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-3 rounded-[1.2rem] border border-[#ebe2ff] bg-white/70 p-3 text-sm text-[#66558a]">
        <div className="flex items-center gap-2">
          <CameraIcon size={16} className="text-[#4f2fa4]" />
          <span>Position the prescription within the frame and capture clearly.</span>
        </div>
        {error ? <p className="mt-2 text-sm text-[#b42318]">{error}</p> : null}
      </div>

      <div className="mt-4 flex gap-3">
        <Button className="flex-1" onClick={handleCapture} disabled={isAnalyzing}>
          {isAnalyzing ? 'Preparing…' : 'Capture'}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
          <span className="flex items-center gap-2">
            <ImagePlus size={16} />
            Upload
          </span>
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onUpload}
        className="hidden"
      />
    </div>
  );
}
