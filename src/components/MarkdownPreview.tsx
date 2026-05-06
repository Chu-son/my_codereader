// ========================================
// MarkdownPreview Component
// ========================================

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

import { useAppStore } from '@/stores/useAppStore';

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const { fontSize, lineHeight } = useAppStore();

  return (
    <div className="h-full overflow-y-auto">
      <div 
        className="markdown-preview max-w-4xl mx-auto"
        style={{ 
          fontSize: `${fontSize}px`, 
          lineHeight: lineHeight 
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
