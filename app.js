const STORAGE_KEY = "task-board-v1";
const PRIORITY_LABEL = { high: "高", medium: "中", low: "低" };

const boardEl = document.getElementById("board");
const boardTitleEl = document.getElementById("board-title");
const dialogEl = document.getElementById("card-dialog");
const formEl = document.getElementById("card-form");
const titleInput = document.getElementById("card-title");
const descriptionInput = document.getElementById("card-description");
const priorityInput = document.getElementById("card-priority");
const dueInput = document.getElementById("card-due");
const formError = document.getElementById("form-error");
const cancelEditBtn = document.getElementById("cancel-edit");
const deleteCardBtn = document.getElementById("delete-card");

let board = loadBoard();
let composingListId = null;
let addingList = false;
let editing = null;

function createId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultBoard() {
  return {
    title: "課題管理",
    lists: [
      {
        id: createId(),
        title: "未着手",
        cards: [
          {
            id: createId(),
            title: "最初のカード（消してOK）",
            description: "カードをクリックすると、説明・優先度・期限を編集できます。",
            priority: "medium",
            dueDate: "",
          },
        ],
      },
      { id: createId(), title: "作業中", cards: [] },
      { id: createId(), title: "完了", cards: [] },
    ],
  };
}

function loadBoard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultBoard();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.lists)) return defaultBoard();
    return parsed;
  } catch {
    return defaultBoard();
  }
}

function saveBoard() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
}

function findList(listId) {
  return board.lists.find((list) => list.id === listId);
}

function findCard(listId, cardId) {
  const list = findList(listId);
  return list?.cards.find((card) => card.id === cardId);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${dueDate}T00:00:00`) < today;
}

function formatDueDate(dueDate) {
  const [year, month, day] = dueDate.split("-");
  if (!year || !month || !day) return dueDate;
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}

function render() {
  boardTitleEl.value = board.title;
  boardEl.innerHTML = board.lists.map(renderList).join("") + renderAddList();
}

function renderList(list, index) {
  const cards =
    list.cards.length === 0
      ? `<p class="empty-hint">カードはまだありません</p>`
      : list.cards.map((card) => renderCard(list, card, index)).join("");

  const composer = composingListId === list.id ? renderCardComposer(list.id) : `<button class="btn ghost" data-action="start-add-card" data-list-id="${list.id}">+ カードを追加</button>`;

  return `
    <section class="list" data-list-id="${list.id}">
      <div class="list-header">
        <input class="list-title" data-action="rename-list" data-list-id="${list.id}" value="${escapeHtml(list.title)}" maxlength="30" aria-label="列の名前" />
        <button class="icon-btn" data-action="delete-list" data-list-id="${list.id}" title="列を削除">削除</button>
      </div>
      <div class="cards">${cards}</div>
      <div class="add-card">${composer}</div>
    </section>
  `;
}

function renderCard(list, card, listIndex) {
  const due = card.dueDate
    ? `<span class="due ${isOverdue(card.dueDate) ? "overdue" : ""}">期限 ${escapeHtml(formatDueDate(card.dueDate))}</span>`
    : "";
  const preview = card.description
    ? `<p class="card-preview">${escapeHtml(card.description)}</p>`
    : "";

  return `
    <article class="card" data-action="open-card" data-list-id="${list.id}" data-card-id="${card.id}">
      <p class="card-title">${escapeHtml(card.title)}</p>
      <div class="card-meta">
        <span class="badge badge-${card.priority}">優先度 ${PRIORITY_LABEL[card.priority]}</span>
        ${due}
      </div>
      ${preview}
      <div class="card-move">
        <button type="button" data-action="move-left" data-list-id="${list.id}" data-card-id="${card.id}" ${listIndex === 0 ? "disabled" : ""}>左へ</button>
        <button type="button" data-action="move-right" data-list-id="${list.id}" data-card-id="${card.id}" ${listIndex === board.lists.length - 1 ? "disabled" : ""}>右へ</button>
      </div>
    </article>
  `;
}

function renderCardComposer(listId) {
  return `
    <form data-action="add-card" data-list-id="${listId}">
      <textarea name="title" rows="2" maxlength="80" placeholder="カードのタイトル" required></textarea>
      <div class="composer-actions">
        <button class="btn btn-primary" type="submit">追加</button>
        <button class="btn" type="button" data-action="cancel-add-card">キャンセル</button>
      </div>
    </form>
  `;
}

function renderAddList() {
  if (addingList) {
    return `
      <section class="add-list">
        <form class="add-list-form" data-action="add-list">
          <input name="title" maxlength="30" placeholder="列の名前" required />
          <div class="composer-actions">
            <button class="btn btn-primary" type="submit">追加</button>
            <button class="btn" type="button" data-action="cancel-add-list">キャンセル</button>
          </div>
        </form>
      </section>
    `;
  }

  return `
    <section class="add-list">
      <button class="btn ghost" data-action="start-add-list">+ リストを追加</button>
    </section>
  `;
}

function persistAndRender() {
  saveBoard();
  render();
}

boardTitleEl.addEventListener("change", () => {
  const title = boardTitleEl.value.trim() || "課題管理";
  board.title = title;
  saveBoard();
  boardTitleEl.value = title;
});

boardEl.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  const listId = target.dataset.listId;
  const cardId = target.dataset.cardId;

  if (action === "start-add-card") {
    composingListId = listId;
    addingList = false;
    render();
    boardEl.querySelector("textarea")?.focus();
    return;
  }

  if (action === "cancel-add-card") {
    composingListId = null;
    render();
    return;
  }

  if (action === "start-add-list") {
    addingList = true;
    composingListId = null;
    render();
    boardEl.querySelector(".add-list input")?.focus();
    return;
  }

  if (action === "cancel-add-list") {
    addingList = false;
    render();
    return;
  }

  if (action === "delete-list") {
    const list = findList(listId);
    if (!list) return;
    if (!confirm(`「${list.title}」を削除しますか？中のカードも消えます。`)) return;
    board.lists = board.lists.filter((item) => item.id !== listId);
    persistAndRender();
    return;
  }

  if (action === "open-card") {
    openCard(listId, cardId);
    return;
  }

  if (action === "move-left" || action === "move-right") {
    event.stopPropagation();
    moveCard(listId, cardId, action === "move-left" ? -1 : 1);
  }
});

boardEl.addEventListener("change", (event) => {
  const target = event.target;
  if (target.dataset.action !== "rename-list") return;
  const list = findList(target.dataset.listId);
  if (!list) return;
  const title = target.value.trim();
  if (!title) {
    target.value = list.title;
    return;
  }
  list.title = title;
  saveBoard();
});

boardEl.addEventListener("submit", (event) => {
  const form = event.target;
  const action = form.dataset.action;
  if (!action) return;
  event.preventDefault();

  if (action === "add-card") {
    const title = form.title.value.trim();
    if (!title) return;
    const list = findList(form.dataset.listId);
    list.cards.push({
      id: createId(),
      title,
      description: "",
      priority: "medium",
      dueDate: "",
    });
    composingListId = null;
    persistAndRender();
    return;
  }

  if (action === "add-list") {
    const title = form.title.value.trim();
    if (!title) return;
    board.lists.push({ id: createId(), title, cards: [] });
    addingList = false;
    persistAndRender();
  }
});

function openCard(listId, cardId) {
  const card = findCard(listId, cardId);
  if (!card) return;
  editing = { listId, cardId };
  titleInput.value = card.title;
  descriptionInput.value = card.description || "";
  priorityInput.value = card.priority || "medium";
  dueInput.value = card.dueDate || "";
  formError.hidden = true;
  dialogEl.showModal();
  titleInput.focus();
}

function closeDialog() {
  editing = null;
  dialogEl.close();
}

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!editing) return;
  const title = titleInput.value.trim();
  if (!title) {
    formError.hidden = false;
    return;
  }
  const card = findCard(editing.listId, editing.cardId);
  card.title = title;
  card.description = descriptionInput.value.trim();
  card.priority = priorityInput.value;
  card.dueDate = dueInput.value;
  persistAndRender();
  closeDialog();
});

cancelEditBtn.addEventListener("click", closeDialog);

deleteCardBtn.addEventListener("click", () => {
  if (!editing) return;
  const card = findCard(editing.listId, editing.cardId);
  if (!confirm(`「${card.title}」を削除しますか？`)) return;
  const list = findList(editing.listId);
  list.cards = list.cards.filter((item) => item.id !== editing.cardId);
  persistAndRender();
  closeDialog();
});

dialogEl.addEventListener("click", (event) => {
  if (event.target === dialogEl) closeDialog();
});

function moveCard(listId, cardId, direction) {
  const fromIndex = board.lists.findIndex((list) => list.id === listId);
  const toIndex = fromIndex + direction;
  if (toIndex < 0 || toIndex >= board.lists.length) return;

  const fromList = board.lists[fromIndex];
  const cardIndex = fromList.cards.findIndex((card) => card.id === cardId);
  const [card] = fromList.cards.splice(cardIndex, 1);
  board.lists[toIndex].cards.push(card);
  persistAndRender();
}

render();
