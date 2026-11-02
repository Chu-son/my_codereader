/** リポジトリ・ブランチ単位のリクエストを中断するためのコントローラ。切替のたびに作り直す */
let controller = new AbortController();

/** 進行中のリクエストを中断し、新しい signal を返す */
export function renewRepoSignal(): AbortSignal {
  controller.abort();
  controller = new AbortController();
  return controller.signal;
}

/** 現在のリポジトリに紐づく signal */
export function currentRepoSignal(): AbortSignal {
  return controller.signal;
}
