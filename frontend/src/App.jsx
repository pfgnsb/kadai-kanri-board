import { useEffect, useState } from "react";
import { createCard, createList, fetchBoard } from "./api.js";
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

  async function handleCreateList(title) {
    const list = await createList(title);
    setBoard((current) => ({
      ...current,
      lists: [...current.lists, list],
    }));
  }

  async function handleCreateCard(listId, title) {
    const card = await createCard(listId, title);
    setBoard((current) => ({
      ...current,
      lists: current.lists.map((list) =>
        list.id === listId ? { ...list, cards: [...list.cards, card] } : list
      ),
    }));
  }

  return (
    <Board
      board={board}
      onCreateList={handleCreateList}
      onCreateCard={handleCreateCard}
    />
  );
}
