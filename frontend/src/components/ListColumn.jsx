import { useEffect, useRef, useState } from "react";
import CardView from "./CardView.jsx";

export default function ListColumn({ list, onOpenCard, onCreateCard, onDeleteList }) {
  return (
    <section className="list" data-list-id={list.id}>
      <div className="list-header">
        <h2 className="list-title">{list.title}</h2>
        <button type="button" className="icon-btn" onClick={() => onDeleteList(list)}>
          削除
        </button>
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
        <AddCard onCreate={(fields) => onCreateCard(list.id, fields)} />
      </div>
    </section>
  );
}

function AddCard({ onCreate }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
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
    setDescription("");
    setPriority("medium");
    setDueDate("");
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
      await onCreate({
        title: trimmed,
        description: description.trim(),
        priority,
        dueDate,
      });
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
    <form className="add-card-form" onSubmit={handleSubmit}>
      <label>
        タイトル（必須）
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
      </label>
      <label>
        説明文
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          aria-label="説明文"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <label>
        優先度
        <select name="priority" aria-label="優先度" value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
      </label>
      <label>
        期限（任意）
        <input
          name="dueDate"
          type="date"
          aria-label="期限"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
      </label>
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
