import { useEffect, useState } from "react";
import { fetchBoard } from "./api.js";
import Board from "./components/Board.jsx";

export default function App() {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchBoard()
      .then((data) => {
        if (!cancelled) {
          setBoard(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "ボードを読み込めませんでした。");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="status">読み込み中です。</p>;
  }

  if (error) {
    return <p className="status">{error}</p>;
  }

  return <Board board={board} />;
}
