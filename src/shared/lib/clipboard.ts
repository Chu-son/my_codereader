/** テキストをクリップボードへ書き込む。非対応・拒否されたときは false（呼び出し側で案内する） */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
