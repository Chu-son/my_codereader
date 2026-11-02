import { Search } from 'lucide-react';

interface SelectionSearchButtonProps {
  x: number;
  y: number;
  onClick: () => void;
}

/** 選択テキストの上に浮かぶ「検索」ボタン */
export function SelectionSearchButton({ x, y, onClick }: SelectionSearchButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed z-[100] flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg animate-fade-in text-white"
      style={{
        left: `${x}px`,
        top: `${y - 45}px`,
        backgroundColor: 'var(--accent-blue)',
        transform: 'translateX(-50%)',
      }}
    >
      <Search size={14} />
      <span className="text-xs font-medium">検索</span>
    </button>
  );
}
