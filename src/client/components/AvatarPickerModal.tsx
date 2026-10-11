import React, { useState, useRef } from 'react';
import { DEMO_AVATARS, compressAndSaveAvatar, saveAvatar } from '../utils/avatar';

interface AvatarPickerModalProps {
  currentAvatar: string;
  onSelect: (newAvatar: string) => void;
  onClose: () => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  currentAvatar,
  onSelect,
  onClose,
}) => {
  const [selected, setSelected] = useState<string>(currentAvatar);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন (JPEG/PNG/WebP)');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg('');
      const compressedDataUri = await compressAndSaveAvatar(file);
      setSelected(compressedDataUri);
    } catch (err) {
      setErrorMsg('ছবি প্রসেস করতে সমস্যা হয়েছে। অনুগ্রহ করে অন্য ছবি নির্বাচন করুন।');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = () => {
    saveAvatar(selected);
    onSelect(selected);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box-sleek avatar-modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        <div className="avatar-modal-header">
          <div className="modal-title-sleek gold-text">
            <span>অ্যাভাটার নির্বাচন</span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
              Choose Player Avatar
            </span>
          </div>
          <button className="btn-close-modal" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Current Active Preview */}
        <div className="avatar-preview-section">
          <div className="avatar-preview-ring">
            <img
              src={selected}
              alt="Selected Avatar Preview"
              className="avatar-preview-img"
            />
          </div>
          <div className="avatar-upload-action">
            <button
              type="button"
              className="btn-upload-photo"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <span>📷</span>
              <span>{isUploading ? 'প্রসেসিং হচ্ছে...' : 'ছবি আপলোড করুন (Upload Photo)'}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <span className="upload-hint">JPG, PNG বা WebP ছবি সাপোর্ট করে</span>
          </div>
        </div>

        {errorMsg && <div className="avatar-error-msg">{errorMsg}</div>}

        {/* Demo Avatars Grid */}
        <div className="avatar-grid-title">
          <span>অথবা ডেমো অ্যাভাটার পছন্দ করুন:</span>
        </div>
        <div className="demo-avatars-grid">
          {DEMO_AVATARS.map((demo) => {
            const isChosen = selected === demo.svgDataUri;
            return (
              <div
                key={demo.id}
                className={`demo-avatar-card ${isChosen ? 'chosen' : ''}`}
                onClick={() => {
                  setSelected(demo.svgDataUri);
                  setErrorMsg('');
                }}
              >
                <div className="demo-avatar-img-wrap">
                  <img src={demo.svgDataUri} alt={demo.name} className="demo-avatar-img" />
                </div>
                <span className="demo-avatar-label">{demo.name}</span>
                {isChosen && <div className="demo-avatar-check">✓</div>}
              </div>
            );
          })}
        </div>

        {/* Modal Bottom Actions */}
        <div className="avatar-modal-actions">
          <button type="button" className="btn-modal-cancel" onClick={onClose}>
            বাতিল (Cancel)
          </button>
          <button type="button" className="btn-emerald-sleek" onClick={handleConfirm}>
            নিশ্চিত করুন (Save &amp; Use)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarPickerModal;

