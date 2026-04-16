import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineCloudUpload, HiOutlineDocument, HiOutlineX } from "react-icons/hi";

export default function FileUpload({
  onFileSelect,
  accept = { "image/*": [], "application/pdf": [] },
  label = "Upload ID Proof",
}) {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setFileName(file.name);

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }

      if (onFileSelect) onFileSelect(file);
    },
    [onFileSelect]
  );

  const removeFile = (e) => {
    e.stopPropagation();
    setPreview(null);
    setFileName("");
    if (onFileSelect) onFileSelect(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
  });

  return (
    <div className="file-upload-wrapper">
      <motion.div
        {...getRootProps()}
        className={`file-upload-area ${isDragActive ? "active" : ""}`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {fileName ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="file-preview"
            >
              {preview ? (
                <img src={preview} alt="Preview" className="file-preview-img" />
              ) : (
                <HiOutlineDocument className="file-preview-icon" />
              )}
              <div className="file-preview-info">
                <span className="file-preview-name">{fileName}</span>
                <button
                  onClick={removeFile}
                  className="file-preview-remove"
                  title="Remove file"
                >
                  <HiOutlineX className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="file-preview"
            >
              <div className="file-upload-icon-wrapper">
                <HiOutlineCloudUpload className="file-upload-icon" />
              </div>
              <div>
                <p className="file-upload-text-primary">{label}</p>
                <p className="file-upload-text-secondary">
                  {isDragActive
                    ? "Drop the file to upload"
                    : "Drag & drop or click to browse"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
