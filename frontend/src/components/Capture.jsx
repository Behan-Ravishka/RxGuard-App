import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera } from "react-camera-pro";
import { useNavigate } from "react-router-dom";
import { Image, X } from "lucide-react";

export default function Capture() {
  const camera = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [imageQueue, setImageQueue] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("Align the prescription");

  const addImagesToQueue = (images) => {
    const validImages = images.filter(Boolean);

    if (validImages.length === 0) {
      return;
    }

    setImageQueue((currentQueue) => [...currentQueue, ...validImages]);
  };

  const handleCapture = () => {
    setIsScanning(true);
    setScanStatus("Scanning prescription…");

    window.setTimeout(() => {
      if (camera.current) {
        const photoBase64 = camera.current.takePhoto();

        if (photoBase64) {
          addImagesToQueue([photoBase64]);
        }
      }

      setIsScanning(false);
      setScanStatus("Prescription ready");
    }, 1500);
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();

            reader.onloadend = () => {
              resolve(reader.result);
            };

            reader.readAsDataURL(file);
          }),
      ),
    ).then((base64Images) => {
      addImagesToQueue(base64Images);
      event.target.value = "";
    });
  };

  const handleAnalyzeAll = () => {
    if (imageQueue.length === 0) {
      return;
    }

    navigate("/analyze", { state: { images: imageQueue } });
  };

  const removeImage = (indexToRemove) => {
    setImageQueue((currentQueue) =>
      currentQueue.filter((_, index) => index !== indexToRemove),
    );
  };

  return (
    <div className="relative mt-2 flex h-[calc(90vh-8.5rem)] w-full items-center justify-center overflow-hidden rounded-[1.75rem] bg-black shadow-lg">
      
      {/* Camera Feed */}
      <div className="absolute inset-0">
        <Camera
          ref={camera}
          facingMode="environment"
          errorMessages={{
            noCameraAccessible: "No camera device accessible. Please connect your camera.",
            permissionDenied: "Permission denied. Please refresh and allow camera access.",
            switchCamera: "Cannot switch camera.",
            canvas: "Canvas is not supported.",
          }}
        />
      </div>

      {/* Viewfinder Overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/40">
        <div className="relative h-[72%] w-[84%] max-w-[320px] rounded-[2rem] border border-white/20">
          <div className="absolute inset-0 rounded-[2rem] border border-white/10" />
          {/* Viewfinder Corners */}
          <div className="absolute left-4 top-4 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-white/80" />
          <div className="absolute right-4 top-4 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-white/80" />
          <div className="absolute bottom-4 left-4 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-white/80" />
          <div className="absolute bottom-4 right-4 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-white/80" />

          {/* Scanning Animation */}
          <AnimatePresence>
            {isScanning ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 240, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute left-4 right-4 top-4 h-1 rounded-full bg-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.9)]"
              />
            ) : null}
          </AnimatePresence>

          {/* Status Pill */}
          <div className="absolute inset-x-0 bottom-10 flex justify-center px-4 text-center">
            <span className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white backdrop-blur-md shadow-sm">
              {scanStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Image Queue overlay */}
      <AnimatePresence>
        {imageQueue.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-32 z-20 w-full px-4"
          >
            <div className="rounded-[1.5rem] border border-white/40 bg-white/20 p-4 shadow-lg backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                    Image Queue
                  </p>
                  <p className="text-sm font-bold text-white drop-shadow-sm">
                    {imageQueue.length} image{imageQueue.length === 1 ? "" : "s"} ready
                  </p>
                </div>

                <button
                  onClick={handleAnalyzeAll}
                  className="shrink-0 rounded-full bg-[#8b5cf6] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-white shadow-md shadow-purple-500/30 transition-transform hover:bg-[#7c3aed] active:scale-95"
                >
                  Analyze All
                </button>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1">
                {imageQueue.map((image, index) => (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={`${index}-${image.slice(0, 24)}`}
                    className="relative shrink-0"
                  >
                    <img
                      src={image}
                      alt={`Queued prescription ${index + 1}`}
                      className="h-16 w-16 rounded-xl border border-white/40 object-cover shadow-sm"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/40 bg-rose-500 text-white shadow-sm transition-transform hover:scale-110 active:scale-95"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="absolute bottom-6 left-0 z-20 flex w-full items-center justify-end px-6">
        
        {/* FIX: Wrapper div handles the absolute positioning and centering */}
        <div className="absolute left-1/2 -translate-x-1/2">
          {/* motion.button only handles the scale now, preventing the CSS conflict */}
          <motion.button
            type="button"
            onClick={handleCapture}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-white/80 bg-white/20 shadow-[0_8px_30px_rgba(255,255,255,0.3)] backdrop-blur-md"
          >
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] shadow-inner" />
          </motion.button>
        </div>

        {/* Gallery button */}
        <motion.button
          type="button"
          onClick={() => fileInputRef.current.click()}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white shadow-md backdrop-blur-md"
          aria-label="Open Gallery"
        >
          <Image size={20} />
        </motion.button>
      </div>
    </div>
  );
}