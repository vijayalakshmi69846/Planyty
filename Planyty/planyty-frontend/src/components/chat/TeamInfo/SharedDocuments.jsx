// src/components/chat/TeamInfo/SharedDocuments.jsx
import React from 'react';
import { FileText, Download, ExternalLink, File, FileSpreadsheet } from 'lucide-react';

const SharedDocuments = ({ documents }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Shared Documents</h3>
      
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center gap-3">
              {getIcon(doc.type)}
              <div>
                <div className="font-medium text-gray-800">{doc.name}</div>
                <div className="text-sm text-gray-500">
                  {doc.size} • {doc.date}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                <Download className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <button className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium">
          View All Documents ({documents.length})
        </button>
      </div>
    </div>
  );
};

export default SharedDocuments;