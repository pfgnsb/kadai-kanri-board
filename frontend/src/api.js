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

export function createList(title) {
  return postJson("/api/lists", { title }, "リストを追加できませんでした。");
}

export function createCard(listId, title) {
  return postJson(`/api/lists/${listId}/cards`, { title }, "カードを追加できませんでした。");
}

export function updateCard(cardId, fields) {
  return sendJson("PUT", `/api/cards/${cardId}`, fields, "カードを更新できませんでした。");
}

export function moveCard(cardId, direction) {
  return sendJson("POST", `/api/cards/${cardId}/move`, { direction }, "カードを移動できませんでした。");
}

function postJson(path, body, fallback) {
  return sendJson("POST", path, body, fallback);
}

async function sendJson(method, path, body, fallback) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    const error = new Error("API に接続できません。サーバが起動しているか確認してください。");
    error.kind = "network";
    throw error;
  }

  if (!response.ok) {
    const error = new Error(await readErrorMessage(response, fallback));
    error.kind = "http";
    throw error;
  }

  return response.json();
}

async function readErrorMessage(response, fallback) {
  try {
    const body = await response.json();
    if (body && typeof body.detail === "string" && body.detail) {
      return body.detail;
    }
  } catch {
    // 本文が JSON でないときは、呼び出し元の文言を使う。
  }
  return fallback;
}
