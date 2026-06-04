import { useState } from "react";

export default function DishImage({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  rounded = "",
}) {
  const [failed, setFailed] = useState(false);
  const canShowImage = Boolean(src) && !failed;

  if (canShowImage) {
    return (
      <img
        src={src}
        alt={alt || "Món ăn"}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`w-full h-full object-cover ${rounded} ${className}`}
      />
    );
  }

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center text-center px-4 ${rounded} ${fallbackClassName}`}
      style={{ background: "linear-gradient(135deg, #F7EFE4, #FFF7DF)" }}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#F0D28A" }}>
        <span className="text-2xl">🍽️</span>
      </div>
      <div className="text-xs font-semibold line-clamp-2" style={{ color: "#6D4C41" }}>
        {alt || "Món ăn"}
      </div>
    </div>
  );
}
