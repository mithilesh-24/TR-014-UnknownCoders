import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineCloudUpload, HiOutlineDocument, HiOutlineX } from "react-icons/hi";

export default function FileUpload({
  onFileSelect,
  accept = { "image/*": [], "application/pdf": [] },
  label = "Upload a file",
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
    <motion.div
      {...getRootProps()}
      className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 ${
        isDragActive
          ? "border-[var(--accent)] bg-[var(--accent)]/10"
          : "border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/8"
      }`}
      animate={{
        scale: isDragActive ? 1.02 : 1,
        borderColor: isDragActive
          ? "rgba(99, 102, 241, 0.6)"
          : "rgba(255, 255, 255, 0.15)",
      }}
      transition={{ duration: 0.2 }}
    >
      <input {...getInputProps()} />

      <AnimatePresence mode="wait">
        {fileName ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-3"
          >
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-white/10"
              />
            ) : (
              <HiOutlineDocument className="w-12 h-12 text-[var(--accent)]" />
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-primary)] truncate max-w-[200px]">
                {fileName}
              </span>
              <button
                onClick={removeFile}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <HiOutlineX className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-3"
          >
            <HiOutlineCloudUpload className="w-10 h-10 text-[var(--text-secondary)]" />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {label}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {isDragActive
                  ? "Drop the file here"
                  : "Drag & drop or click to browse"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
