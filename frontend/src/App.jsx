import { useEffect, useState } from "react";
import { createCard, createList, fetchBoard, moveCard, updateCard } from "./api.js";
import Board from "./components/Board.jsx";

export default function App() {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState(null);
  const [actionError, setActionError] = useState("");

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

  async function handleSaveCard(fields) {
    const updated = await updateCard(editingCard.id, fields);
    setBoard((current) => ({
      ...current,
      lists: current.lists.map((list) => ({
        ...list,
        cards: list.cards.map((card) => (card.id === updated.id ? { ...card, ...updated } : card)),
      })),
    }));
    setEditingCard(null);
  }

  async function handlePlaceCard(cardId, listId, index) {
    const next = placeCardOnBoard(board, cardId, listId, index);
    if (!next) {
      return;
    }
    setActionError("");
    setBoard(next);
    try {
      await moveCard(cardId, listId, index);
    } catch (err) {
      setActionError(err.message || "カードを移動できませんでした。");
      try {
        setBoard(await fetchBoard());
      } catch {
        // 移動に失敗したあと、読み直しも失敗したときは今の表示を残す。
      }
    }
  }

  return (
    <Board
      board={board}
      actionError={actionError}
      editingCard={editingCard}
      onCreateList={handleCreateList}
      onCreateCard={handleCreateCard}
      onOpenCard={setEditingCard}
      onPlaceCard={handlePlaceCard}
      onSaveCard={handleSaveCard}
      onCloseEditor={() => setEditingCard(null)}
    />
  );
}

function placeCardOnBoard(board, cardId, listId, index) {
  let fromListId = null;
  let fromIndex = -1;
  let moving = null;
  for (const list of board.lists) {
    const found = list.cards.findIndex((card) => card.id === cardId);
    if (found >= 0) {
      fromListId = list.id;
      fromIndex = found;
      moving = list.cards[found];
      break;
    }
  }
  if (!moving || !board.lists.some((list) => list.id === listId)) {
    return null;
  }
  if (fromListId === listId && index === fromIndex) {
    return null;
  }
  const withoutCard = board.lists.map((list) => ({
    ...list,
    cards: list.cards.filter((card) => card.id !== cardId),
  }));
  return {
    ...board,
    lists: withoutCard.map((list) => {
      if (list.id !== listId) {
        return list;
      }
      const cards = [...list.cards];
      const insertAt = Math.max(0, Math.min(index, cards.length));
      cards.splice(insertAt, 0, moving);
      return {
        ...list,
        cards: cards.map((card, position) => ({ ...card, position })),
      };
    }),
  };
}
