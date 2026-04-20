export default function Loading({ label = 'Đang tải...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full animate-bounce" style={{ background: '#E6B422', animationDelay: '-0.3s' }} />
        <div className="w-3 h-3 rounded-full animate-bounce" style={{ background: '#E6B422', animationDelay: '-0.15s' }} />
        <div className="w-3 h-3 rounded-full animate-bounce" style={{ background: '#E6B422' }} />
      </div>
      <p className="font-medium text-sm" style={{ color: '#8D6E63' }}>{label}</p>
    </div>
  );
}
