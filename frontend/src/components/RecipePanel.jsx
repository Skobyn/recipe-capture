import React, { useState } from 'react';
import './RecipePanel.css';

export default function RecipePanel({ recipeText, imageBase64, imageMimeType, recipeName }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(recipeText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownloadImage() {
    if (!imageBase64) return;
    const byteString = atob(imageBase64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: imageMimeType || 'image/png' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipeName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="recipe-panel">
      <div className="recipe-panel-inner">
        {imageBase64 ? (
          <div className="recipe-image-wrap">
            <img
              src={`data:${imageMimeType || 'image/png'};base64,${imageBase64}`}
              alt={recipeName}
              className="recipe-image"
            />
            <button className="btn-download" onClick={handleDownloadImage}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Photo
            </button>
          </div>
        ) : (
          <div className="recipe-image-placeholder">
            <span>📸</span>
            <p>Photo generation failed — check API key</p>
          </div>
        )}

        <div className="recipe-text-section">
          <div className="recipe-text-header">
            <h3>Recime Format</h3>
            <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={handleCopy}>
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>
          <pre className="recipe-text">{recipeText}</pre>
        </div>

        <div className="recime-hint">
          <span>💡</span>
          <p>Copy the text above and paste it into Recime — it will auto-detect the format.</p>
        </div>
      </div>
    </div>
  );
}
