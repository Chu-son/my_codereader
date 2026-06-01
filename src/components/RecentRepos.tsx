import { useAppStore } from '@/stores/useAppStore';
import { History, FolderGit2, Trash2, ArrowRight } from 'lucide-react';

export function RecentRepos() {
  const { recentRepos, loadRepository, removeRecentRepo } = useAppStore();

  if (recentRepos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: 'var(--bg-surface)' }}>
          <FolderGit2 size={32} className="text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>My CodeReader にようこそ</h2>
        <p className="text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>
          ヘッダーの入力欄にGitHubリポジトリ（例: facebook/react）を入力して、ソースコードの閲覧を開始してください。
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-8 animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <History size={24} className="text-[var(--accent-blue)]" />
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>最近開いたリポジトリ</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentRepos.map((repo) => (
            <div 
              key={repo}
              className="group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden"
              style={{ 
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-primary)',
              }}
              onClick={() => loadRepository(repo)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-blue)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-primary)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <FolderGit2 size={20} className="text-[var(--text-primary)]" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{repo}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentRepo(repo);
                  }}
                  className="p-2 rounded-lg transition-colors hover:bg-[var(--accent-red)] hover:text-white"
                  style={{ color: 'var(--text-muted)' }}
                  title="履歴から削除"
                >
                  <Trash2 size={16} />
                </button>
                <div 
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--accent-blue)', backgroundColor: 'rgba(137, 180, 250, 0.1)' }}
                >
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
