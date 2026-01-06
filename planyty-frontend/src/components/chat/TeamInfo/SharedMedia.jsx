// src/components/chat/TeamInfo/SharedMedia.jsx
import React from 'react';
import { Image as ImageIcon, Video, Download, Eye } from 'lucide-react';

const SharedMedia = ({ media }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <ImageIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Shared Media</h3>
      
      <div className="grid grid-cols-3 gap-2">
        {media.map((item) => (
          <div
            key={item.id}
            className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square cursor-pointer"
          >
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                <Video className="w-8 h-8 text-purple-600" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <button className="p-2 bg-white rounded-full hover:bg-gray-100">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 bg-white rounded-full hover:bg-gray-100">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <div className="flex items-center gap-1 text-white text-xs">
                {getIcon(item.type)}
                <span className="truncate">{item.name}</span>
              </div>
              <div className="text-white/80 text-xs">{item.date}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <button className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium">
          View All Media ({media.length})
        </button>
      </div>
    </div>
  );
};

export default SharedMedia;