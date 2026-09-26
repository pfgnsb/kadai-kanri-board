import { useEffect, useRef, useState } from "react";

export default function CardEditor({ card, onSave, onClose }) {
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [priority, setPriority] = useState(card.priority);
  const [dueDate, setDueDate] = useState(card.dueDate ?? "");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return undefined;
    }
    if (!dialog.open) {
      dialog.showModal();
    }
    titleRef.current?.focus();
    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

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
      await onSave({
        title: trimmed,
        description: description.trim(),
        priority,
        dueDate,
      });
    } catch (err) {
      setError(err.message || "カードを更新できませんでした。");
      setPending(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form className="dialog-form" onSubmit={handleSubmit}>
        <h2>カードを編集</h2>
        <label>
          タイトル（必須）
          <input
            ref={titleRef}
            type="text"
            maxLength={80}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          説明文
          <textarea
            rows={4}
            maxLength={500}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label>
          優先度
          <select value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </label>
        <label>
          期限（任意）
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="dialog-actions">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            保存
          </button>
          <button type="button" className="btn" onClick={onClose} disabled={pending}>
            キャンセル
          </button>
        </div>
      </form>
    </dialog>
  );
}
