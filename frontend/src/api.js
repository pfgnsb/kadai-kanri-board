const API_BASE = "http://localhost:8080";

export async function fetchBoard() {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/board`);
  } catch {
    const error = new Error("API に接続できません。サーバが起動しているか確認してください。");
    error.kind = "network";
    throw error;
  }

  if (response.status === 404) {
    const error = new Error("ボードが見つかりません。");
    error.kind = "not-found";
    throw error;
  }

  if (!response.ok) {
    const error = new Error("ボードを読み込めませんでした。");
    error.kind = "http";
    throw error;
  }

  return response.json();
}
