import { useState, useRef } from "react";
import C from "../config/colors";
import s from "../config/styles";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function PhotoUploader({
  photos,
  onPhotosChange,
  label = "Upload Photos",
  maxPhotos = 10,
}) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files) => {
    Array.from(files).forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      if (photos.length >= maxPhotos) return;

      const reader = new FileReader();
      reader.onload = (e) =>
        onPhotosChange((prev) => [
          ...prev,
          { id: Date.now() + Math.random(), name: file.name, dataUrl: e.target.result },
        ]);
      reader.readAsDataURL(file);
    });
  };

  return (
    <div>
      <label style={s.label}>{label}</label>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        style={{
          border: `2px dashed ${dragOver ? C.primary : C.border}`,
          borderRadius: 12,
          padding: 24,
          textAlign: "center",
          cursor: "pointer",
          background: dragOver ? `${C.primary}08` : C.bgCardAlt,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>{"\u{1F4F7}"}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.textMid }}>
          Click or drag photos here
        </div>
        <div style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>
          JPG, PNG, GIF, WEBP — Max {maxPhotos}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {photos.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: 8,
          }}
        >
          {photos.map((p) => (
            <div
              key={p.id}
              style={{
                position: "relative",
                borderRadius: 10,
                overflow: "hidden",
                aspectRatio: "1",
                border: `1px solid ${C.border}`,
              }}
            >
              <img
                src={p.dataUrl}
                alt={p.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPhotosChange((prev) => prev.filter((x) => x.id !== p.id));
                }}
                aria-label={`Remove ${p.name}`}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {"\u00D7"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
