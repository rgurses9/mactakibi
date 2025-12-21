import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Files } from 'lucide-react';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  isAnalyzing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, isAnalyzing }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelect(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect(Array.from(e.target.files));
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div 
      className={`relative p-8 rounded-xl border-2 border-dashed transition-all duration-300 ${
        dragActive 
          ? 'border-blue-500 bg-blue-50 
          : 'border-gray-300 bg-white hover:border-gray-400
      } ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple // Enable multiple file selection
        accept="image/*,application/pdf,.xlsx,.xls,.csv"
        onChange={handleChange}
      />
      
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className={`p-4 rounded-full ${dragActive ? 'bg-blue-100 text-blue-600 : 'bg-gray-100 text-gray-500}`}>
          <Files size={32} />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Dosyaları Buraya Sürükleyin
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Google Drive'dan indirdiğiniz <strong>Excel (.xlsx)</strong>, PDF veya Resim dosyalarını buraya bırakın.
          </p>
        </div>

        <button
          onClick={onButtonClick}
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          Dosyaları Seç
        </button>
      </div>
    </div>
  );
};

export default FileUpload;