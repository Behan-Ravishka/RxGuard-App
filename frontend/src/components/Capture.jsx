import { useRef, useState } from 'react';
import { Camera } from 'react-camera-pro';
import { useNavigate } from 'react-router-dom';

export default function Capture() {
  const camera = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [imageQueue, setImageQueue] = useState([]);

  const addImagesToQueue = (images) => {
    const validImages = images.filter(Boolean);

    if (validImages.length === 0) {
      return;
    }

    setImageQueue((currentQueue) => [...currentQueue, ...validImages]);
  };

  const handleCapture = () => {
    if (camera.current) {
      const photoBase64 = camera.current.takePhoto();

      if (photoBase64) {
        addImagesToQueue([photoBase64]);
      }
    }
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
      event.target.value = '';
    });
  };

  const handleAnalyzeAll = () => {
    if (imageQueue.length === 0) {
      return;
    }

    navigate('/analyze', { state: { images: imageQueue } });
  };

  const removeImage = (indexToRemove) => {
    setImageQueue((currentQueue) =>
      currentQueue.filter((_, index) => index !== indexToRemove),
    );
  };

  return (
    <div className="relative w-full h-[80vh] flex flex-col items-center justify-center bg-black overflow-hidden rounded-lg mt-2">
      
      <Camera
        ref={camera}
        facingMode="environment"
        errorMessages={{
          noCameraAccessible: 'No camera device accessible. Please connect your camera.',
          permissionDenied: 'Permission denied. Please refresh and allow camera access.',
          switchCamera: 'Cannot switch camera.',
          canvas: 'Canvas is not supported.'
        }}
      />

      {/* Viewfinder UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-80 relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-severity-green"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-severity-green"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-severity-green"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-severity-green"></div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/50 text-sm font-semibold tracking-widest text-center px-4 drop-shadow-md">
              ALIGN PRESCRIPTION
            </span>
          </div>
        </div>
      </div>

      {/* Hidden File Input for the Gallery */}
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
          <div className="rounded-2xl border border-gray-700 bg-gray-950/90 backdrop-blur-md p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Image Queue</p>
                <p className="text-sm font-semibold text-white">{imageQueue.length} image{imageQueue.length === 1 ? '' : 's'} ready</p>
              </div>

              <button
                onClick={handleAnalyzeAll}
                className="shrink-0 rounded-full bg-severity-green px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-950 transition-transform active:scale-95"
              >
                Analyze All
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
              {imageQueue.map((image, index) => (
                <div key={`${index}-${image.slice(0, 24)}`} className="relative shrink-0">
                  <img
                    src={image}
                    alt={`Queued prescription ${index + 1}`}
                    className="h-20 w-20 rounded-xl object-cover border border-gray-700"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white border border-gray-600"
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

      {/* Bottom Controls Container */}
      <div className="absolute bottom-8 z-20 w-full px-8 flex items-center justify-between">
        
        {/* Empty div to balance the flexbox layout */}
        <div className="w-16"></div>

        {/* Floating Capture Button (Center) */}
        <button 
          onClick={handleCapture}
          className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <div className="w-16 h-16 bg-white rounded-full border-2 border-gray-400"></div>
        </button>

        {/* Upload from Gallery Button (Right) */}
        <button 
          onClick={() => fileInputRef.current.click()}
          className="w-16 h-16 bg-gray-800/80 rounded-full border border-gray-600 flex flex-col items-center justify-center active:scale-95 transition-transform"
        >
          <span className="text-2xl">📁</span>
          <span className="text-[10px] text-gray-300 mt-1 font-semibold tracking-wider">Upload</span>
        </button>

      </div>
    </div>
  );
}