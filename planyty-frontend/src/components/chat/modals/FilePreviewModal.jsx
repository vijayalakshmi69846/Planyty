// components/modals/FilePreviewModal.jsx
import React, { useState } from 'react';
import { 
  X, Download, ExternalLink, Maximize2, 
  FileText, Image, Video, File, Volume2,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut
} from 'lucide-react';

const FilePreviewModal = ({ 
  isOpen, 
  onClose, 
  files = [], 
  initialIndex = 0 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!isOpen || files.length === 0) return null;

  const currentFile = files[currentIndex];
  const isImage = currentFile.type === 'image';
  const isVideo = currentFile.type === 'video';
  const isAudio = currentFile.type === 'audio';
  const isDocument = currentFile.type === 'document';

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? files.length - 1 : prev - 1));
    setZoomLevel(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === files.length - 1 ? 0 : prev + 1));
    setZoomLevel(1);
  };

  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = file.url.startsWith('http') ? file.url : `http://localhost:5000${file.url}`;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = (file) => {
    const url = file.url.startsWith('http') ? file.url : `http://localhost:5000${file.url}`;
    window.open(url, '_blank');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="flex items-center gap-3">
            {isImage ? (
              <Image size={24} className="text-blue-300" />
            ) : isVideo ? (
              <Video size={24} className="text-purple-300" />
            ) : isAudio ? (
              <Volume2 size={24} className="text-green-300" />
            ) : (
              <FileText size={24} className="text-gray-300" />
            )}
            <div>
              <h2 className="text-lg font-semibold truncate max-w-md">
                {currentFile.name}
              </h2>
              <p className="text-sm text-gray-300">
                {formatFileSize(currentFile.size)} • {getFileExtension(currentFile.name)}
                {files.length > 1 && ` • ${currentIndex + 1} of ${files.length}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={files.length === 1}
              className={`p-2 rounded-lg ${files.length === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20'}`}
              title="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              disabled={files.length === 1}
              className={`p-2 rounded-lg ${files.length === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20'}`}
              title="Next"
            >
              <ChevronRight size={20} />
            </button>
            {isImage && (
              <>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                  className="p-2 hover:bg-white/20 rounded-lg"
                  title="Zoom in"
                >
                  <ZoomIn size={20} />
                </button>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                  className="p-2 hover:bg-white/20 rounded-lg"
                  title="Zoom out"
                >
                  <ZoomOut size={20} />
                </button>
              </>
            )}
            <button
              onClick={() => handleOpenInNewTab(currentFile)}
              className="p-2 hover:bg-white/20 rounded-lg"
              title="Open in new tab"
            >
              <ExternalLink size={20} />
            </button>
            <button
              onClick={() => handleDownload(currentFile)}
              className="p-2 hover:bg-white/20 rounded-lg"
              title="Download"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500/20 rounded-lg"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* File Content Area */}
        <div className="flex-1 overflow-auto bg-gray-900 p-4">
          <div className="flex items-center justify-center h-full">
            {isImage ? (
              <img
                src={currentFile.url.startsWith('http') ? currentFile.url : `http://localhost:5000${currentFile.url}`}
                alt={currentFile.name}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
                crossOrigin="anonymous"
              />
            ) : isVideo ? (
              <video
                src={currentFile.url.startsWith('http') ? currentFile.url : `http://localhost:5000${currentFile.url}`}
                controls
                className="max-w-full max-h-full"
                crossOrigin="anonymous"
              />
            ) : isAudio ? (
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl">
                <div className="w-64 h-64 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
                  <Volume2 size={48} className="text-white" />
                </div>
                <audio
                  src={currentFile.url.startsWith('http') ? currentFile.url : `http://localhost:5000${currentFile.url}`}
                  controls
                  className="w-full"
                  crossOrigin="anonymous"
                />
              </div>
            ) : (
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl max-w-2xl">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mb-6">
                    <FileText size={48} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{currentFile.name}</h3>
                  <p className="text-gray-300 mb-6">
                    {formatFileSize(currentFile.size)} • {getFileExtension(currentFile.name)}
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleDownload(currentFile)}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <Download size={20} />
                      Download
                    </button>
                    <button
                      onClick={() => handleOpenInNewTab(currentFile)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <ExternalLink size={20} />
                      Open
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail Strip */}
        {files.length > 1 && (
          <div className="p-4 bg-gray-800 border-t border-gray-700">
            <div className="flex gap-2 overflow-x-auto">
              {files.map((file, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setZoomLevel(1);
                  }}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex 
                      ? 'border-blue-500 scale-105' 
                      : 'border-transparent hover:border-gray-500'
                  }`}
                >
                  {file.type === 'image' ? (
                    <img
                      src={file.url.startsWith('http') ? file.url : `http://localhost:5000${file.url}`}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                      {file.type === 'video' ? (
                        <Video size={20} className="text-purple-300" />
                      ) : file.type === 'audio' ? (
                        <Volume2 size={20} className="text-green-300" />
                      ) : (
                        <FileText size={20} className="text-blue-300" />
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePreviewModal;