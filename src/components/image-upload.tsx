'use client';

import { useState, useRef } from 'react';

interface ImageUploadProps {
  onImageUploaded?: (imageUrl: string, imageId: string, analysis?: string) => void;
  onError?: (error: string) => void;
  showAnalysis?: boolean;
  analysisModel?: 'gpt-4-turbo' | 'gemini-1.5-pro';
  analysisPrompt?: string;
  buttonText?: string;
  acceptedTypes?: string;
  maxSizeMB?: number;
}

interface UploadResponse {
  success: boolean;
  image: {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
}

interface UploadErrorResponse {
  error: string;
  details?: unknown;
}

interface AnalysisResponse {
  success: boolean;
  analysis: string;
}

export function ImageUpload({
  onImageUploaded,
  onError,
  showAnalysis = false,
  analysisModel = 'gpt-4-turbo',
  analysisPrompt,
  buttonText = '📸 Upload Image',
  acceptedTypes = 'image/*',
  maxSizeMB = 10,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{
    url: string;
    id: string;
    filename: string;
  } | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      const error = `File size must be less than ${maxSizeMB}MB`;
      onError?.(error);
      alert(error);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const error = 'Please select an image file';
      onError?.(error);
      alert(error);
      return;
    }

    setUploading(true);
    setAnalysis(null);

    try {
      // Upload to Cloudflare Images
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = (await uploadResponse.json()) as UploadErrorResponse;
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadData = (await uploadResponse.json()) as UploadResponse;
      const imageId = uploadData.image.id;
      const imageUrl = uploadData.image.variants[0]; // Use first variant

      setUploadedImage({
        url: imageUrl,
        id: imageId,
        filename: uploadData.image.filename,
      });

      // Analyze image if requested
      if (showAnalysis) {
        setAnalyzing(true);
        try {
          const analysisResponse = await fetch('/api/images/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageId,
              model: analysisModel,
              prompt: analysisPrompt || 'Analyze this image in the context of Tokyo travel. What do you see?',
            }),
          });

          if (analysisResponse.ok) {
            const analysisData = (await analysisResponse.json()) as AnalysisResponse;
            setAnalysis(analysisData.analysis);
            onImageUploaded?.(imageUrl, imageId, analysisData.analysis);
          } else {
            onImageUploaded?.(imageUrl, imageId);
          }
        } catch (err) {
          console.error('Analysis failed:', err);
          onImageUploaded?.(imageUrl, imageId);
        } finally {
          setAnalyzing(false);
        }
      } else {
        onImageUploaded?.(imageUrl, imageId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      console.error('Upload error:', err);
      onError?.(errorMessage);
      alert(errorMessage);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={uploading || analyzing}
          id="image-upload-input"
        />
        <label htmlFor="image-upload-input">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || analyzing}
            style={{
              padding: '0.75rem 1.5rem',
              background: uploading || analyzing ? 'var(--border)' : 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: uploading || analyzing ? 'not-allowed' : 'pointer',
              fontSize: '0.9375rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {uploading && (
              <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
            )}
            {analyzing && '🔍 '}
            {uploading ? 'Uploading...' : analyzing ? 'Analyzing...' : buttonText}
          </button>
        </label>
      </div>

      {uploadedImage && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1rem',
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem',
          }}>
            ✅ Uploaded: {uploadedImage.filename}
          </div>
          <img
            src={uploadedImage.url}
            alt={uploadedImage.filename}
            style={{
              maxWidth: '100%',
              maxHeight: '300px',
              borderRadius: '8px',
              objectFit: 'contain',
            }}
          />

          {analysis && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'var(--bg-tertiary)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              lineHeight: 1.6,
            }}>
              <div style={{
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: 'var(--accent)',
              }}>
                🤖 AI Analysis:
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {analysis}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
