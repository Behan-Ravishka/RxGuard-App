import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera } from "react-camera-pro";
import { useNavigate } from "react-router-dom";
import { Image } from "lucide-react";

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
    <div className="relative mt-2 flex h-[calc(90vh-8.5rem)] w-full items-center justify-center overflow-hidden rounded-[1.75rem] bg-black">
      <div className="absolute inset-0">
        <Camera
          ref={camera}
          facingMode="environment"
          errorMessages={{
            noCameraAccessible:
              "No camera device accessible. Please connect your camera.",
            permissionDenied:
              "Permission denied. Please refresh and allow camera access.",
            switchCamera: "Cannot switch camera.",
            canvas: "Canvas is not supported.",
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/60">
        <div className="relative h-[72%] w-[84%] max-w-[320px] rounded-[2rem] border border-white/20">
          <div className="absolute inset-0 rounded-[2rem] border border-white/15" />
          <div className="absolute left-4 top-4 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-white" />
          <div className="absolute right-4 top-4 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-white" />
          <div className="absolute bottom-4 left-4 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-white" />
          <div className="absolute bottom-4 right-4 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-white" />

          <AnimatePresence>
            {isScanning ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 240, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute left-4 right-4 top-4 h-1 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.95)]"
              />
            ) : null}
          </AnimatePresence>

          <div className="absolute inset-x-0 bottom-10 flex justify-center px-4 text-center">
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80 backdrop-blur-sm">
              {scanStatus}
            </span>
          </div>
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        multiple
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {imageQueue.length > 0 && (
        <div className="absolute bottom-28 z-20 w-full px-4">
          <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/80 p-4 shadow-2xl backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
                  Image Queue
                </p>
                <p className="text-sm font-semibold text-white">
                  {imageQueue.length} image{imageQueue.length === 1 ? "" : "s"}{" "}
                  ready
                </p>
              </div>

              <button
                onClick={handleAnalyzeAll}
                className="shrink-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white transition-transform active:scale-95"
              >
                Analyze All
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
              {imageQueue.map((image, index) => (
                <div
                  key={`${index}-${image.slice(0, 24)}`}
                  className="relative shrink-0"
                >
                  <img
                    src={image}
                    alt={`Queued prescription ${index + 1}`}
                    className="h-20 w-20 rounded-xl border border-white/10 object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-xs font-bold text-white"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-0 z-20 flex w-full items-center justify-end px-6">
        {/* Capture button — always exactly centered */}
        <motion.button
          type="button"
          onClick={handleCapture}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          className="absolute left-1/2 -translate-x-1/2 flex h-20 w-20 items-center justify-center rounded-full border border-white/80 bg-white shadow-[0_20px_60px_-20px_rgba(255,255,255,0.9)]"
        >
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#4c2c97] to-[#7e58cf]" />
        </motion.button>

        {/* Gallery button */}
        <motion.button
          type="button"
          onClick={() => fileInputRef.current.click()}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/20 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md"
        >
          <Image size={18} />
          Gallery
        </motion.button>
      </div>
    </div>
  );
}
