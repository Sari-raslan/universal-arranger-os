import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '../services/api.js';

export default function MultiFileUpload({ onUploaded }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const formData = new FormData();
    acceptedFiles.forEach((file) => formData.append('files', file));

    setBusy(true);
    setMessage('');
    try {
      const response = await api.post('/upload', formData);
      setMessage(`${response.data.uploaded || acceptedFiles.length} file(s) uploaded`);
      onUploaded?.(response.data);
    } catch (error) {
      setMessage(error.response?.data?.error || error.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="multiUpload">
      <div {...getRootProps()} className="multiDropzone" aria-busy={busy}>
        <input {...getInputProps()} />
        <h2>{isDragActive ? 'Drop files to upload' : 'Upload SET/STY/MID/KMP/PAD Files'}</h2>
        <p>{busy ? 'Uploading...' : 'Drag files here or click to choose multiple arranger files.'}</p>
      </div>
      {message && <p className="uploadMessage">{message}</p>}
    </div>
  );
}
