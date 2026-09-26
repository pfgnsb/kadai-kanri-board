import { useEffect, useRef } from "react";

export default function ConfirmDialog({ message, pending, onYes, onNo }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return undefined;
    }
    if (!dialog.open) {
      dialog.showModal();
    }
    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="dialog confirm-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onNo();
      }}
    >
      <p className="confirm-message">{message}</p>
      <div className="dialog-actions">
        <button type="button" className="btn btn-primary" onClick={onYes} disabled={pending}>
          はい
        </button>
        <button type="button" className="btn" onClick={onNo} disabled={pending}>
          いいえ
        </button>
      </div>
    </dialog>
  );
}
