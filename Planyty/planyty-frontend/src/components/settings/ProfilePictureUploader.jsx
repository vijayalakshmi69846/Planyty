// src/components/settings/ProfilePictureUploader.jsx
import React, { useState, useRef } from 'react';
import { Upload, User, X } from 'lucide-react';

const ProfilePictureUploader = ({ currentImage, onImageChange }) => {
  const [preview, setPreview] = useState(currentImage);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        if (onImageChange) {
          onImageChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    if (onImageChange) {
      onImageChange(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-200 shadow-lg">
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <User className="w-16 h-16 text-white" />
            </div>
          )}
        </div>
        
        <button
          onClick={triggerFileInput}
          className="absolute -bottom-2 -right-2 p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-110"
        >
          <Upload className="w-4 h-4" />
        </button>
        
        {preview && (
          <button
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all duration-300 hover:scale-110"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Click the upload button to change your profile picture
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supported formats: JPG, PNG, GIF • Max size: 5MB
        </p>
      </div>
    </div>
  );
};

export default ProfilePictureUploader;