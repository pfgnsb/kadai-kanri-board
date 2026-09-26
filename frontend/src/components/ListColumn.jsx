import { useEffect, useRef, useState } from "react";
import CardView from "./CardView.jsx";

export default function ListColumn({ list, onOpenCard, onCreateCard }) {
  return (
    <section className="list" data-list-id={list.id}>
      <div className="list-header">
        <h2 className="list-title">{list.title}</h2>
      </div>
      <div className="cards">
        {list.cards.length === 0 ? (
          <p className="empty-hint">カードはまだありません</p>
        ) : (
          list.cards.map((card) => (
            <CardView key={card.id} card={card} listId={list.id} onOpen={() => onOpenCard(card)} />
          ))
        )}
      </div>
      <div className="add-card">
        <AddCard onCreate={(title) => onCreateCard(list.id, title)} />
      </div>
    </section>
  );
}

function AddCard({ onCreate }) {
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
      setError("タイトルを入力してください。");
      return;
    }
    setPending(true);
    setError("");
    try {
      await onCreate(trimmed);
      close();
    } catch (err) {
      setError(err.message || "カードを追加できませんでした。");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn ghost" onClick={() => setOpen(true)}>
        タスク追加
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        ref={inputRef}
        name="title"
        rows={2}
        maxLength={80}
        placeholder="カードのタイトル"
        aria-label="カードのタイトル"
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
  );
}
