import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';

import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/stores/useAppStore';

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const { fontSize, lineHeight } = useAppStore(
    useShallow((s) => ({ fontSize: s.fontSize, lineHeight: s.lineHeight })),
  );

  return (
    <div className="h-full overflow-y-auto">
      <div
        className="markdown-preview max-w-4xl mx-auto"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize, rehypeHighlight]}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
