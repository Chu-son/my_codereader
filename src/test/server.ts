import { setupServer } from 'msw/node';

// GitHub API のモックサーバー。各テストで server.use() してハンドラを登録する
export const server = setupServer();
