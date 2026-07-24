import { useRef } from 'react';
import { Camera } from 'react-camera-pro';
import { useNavigate } from 'react-router-dom';

export default function Capture() {
  const camera = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // 1. Existing Camera Capture Logic
  const handleCapture = () => {
    if (camera.current) {
      const photoBase64 = camera.current.takePhoto();
      navigate('/analyze', { state: { image: photoBase64 } });
    }
  };

  // 2. New File Upload Logic
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Read the image file and convert it to a Base64 string
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      // Send the uploaded image to the exact same analyze route!
      navigate('/analyze', { state: { image: base64String } });
    };
    reader.readAsDataURL(file);
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
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden" 
      />

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