import { useEffect, useRef, useState } from "react";
import { useCardDrag } from "../useCardDrag.js";
import CardEditor from "./CardEditor.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import ListColumn from "./ListColumn.jsx";

export default function Board({
  board,
  actionError,
  editingCard,
  onCreateList,
  onCreateCard,
  onOpenCard,
  onPlaceCard,
  onSaveCard,
  onDeleteCard,
  onDeleteList,
  confirm,
  onConfirmYes,
  onConfirmNo,
  onCloseEditor,
}) {
  const boardRef = useRef(null);
  useCardDrag(boardRef, onPlaceCard);

  return (
    <>
      <header className="topbar">
        <h1 className="board-title">{board.title}</h1>
        <p className="topbar-note">追加や更新はサーバに残ります</p>
      </header>
      {actionError ? <p className="banner-error">{actionError}</p> : null}
      <main className="board" aria-label="タスクボード" ref={boardRef}>
        {board.lists.map((list) => (
          <ListColumn
            key={list.id}
            list={list}
            onOpenCard={onOpenCard}
            onCreateCard={onCreateCard}
            onDeleteList={onDeleteList}
          />
        ))}
        <AddList onCreate={onCreateList} />
      </main>
      {editingCard ? (
        <CardEditor card={editingCard} onSave={onSaveCard} onDelete={onDeleteCard} onClose={onCloseEditor} />
      ) : null}
      {confirm ? (
        <ConfirmDialog
          message={confirm.message}
          pending={confirm.pending}
          onYes={onConfirmYes}
          onNo={onConfirmNo}
        />
      ) : null}
    </>
  );
}

function AddList({ onCreate }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  function close() {
    setOpen(false);
    setTitle("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("列の名前を入力してください。");
      return;
    }
    setPending(true);
    setError("");
    try {
      await onCreate(trimmed);
      close();
    } catch (err) {
      setError(err.message || "リストを追加できませんでした。");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <section className="add-list">
        <button type="button" className="btn ghost" onClick={() => setOpen(true)}>
          + リストを追加
        </button>
      </section>
    );
  }

  return (
    <section className="add-list">
      <form className="add-list-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          name="title"
          maxLength={30}
          placeholder="列の名前"
          aria-label="列の名前"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        {error ? <p className="form-error">{error}</p> : null}
        <div className="composer-actions">
          <button className="btn btn-primary" type="submit" disabled={pending}>
            追加
          </button>
          <button className="btn" type="button" onClick={close} disabled={pending}>
            キャンセル
          </button>
        </div>
      </form>
    </section>
  );
}
