import { useEffect, useState } from "react";
import { createCard, createList, fetchBoard, moveCard, updateCard } from "./api.js";
import Board from "./components/Board.jsx";

export default function App() {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState(null);
  const [movingCardId, setMovingCardId] = useState("");
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

  async function handleMoveCard(cardId, direction) {
    setActionError("");
    setMovingCardId(cardId);
    try {
      const moved = await moveCard(cardId, direction);
      setBoard((current) => moveCardOnBoard(current, cardId, moved));
    } catch (err) {
      setActionError(err.message || "カードを移動できませんでした。");
    } finally {
      setMovingCardId("");
    }
  }

  return (
    <Board
      board={board}
      actionError={actionError}
      movingCardId={movingCardId}
      editingCard={editingCard}
      onCreateList={handleCreateList}
      onCreateCard={handleCreateCard}
      onOpenCard={setEditingCard}
      onMoveCard={handleMoveCard}
      onSaveCard={handleSaveCard}
      onCloseEditor={() => setEditingCard(null)}
    />
  );
}

function moveCardOnBoard(board, cardId, moved) {
  let moving = null;
  const withoutCard = board.lists.map((list) => ({
    ...list,
    cards: list.cards.filter((card) => {
      if (card.id !== cardId) {
        return true;
      }
      moving = card;
      return false;
    }),
  }));
  if (!moving) {
    return board;
  }
  return {
    ...board,
    lists: withoutCard.map((list) =>
      list.id === moved.listId
        ? { ...list, cards: [...list.cards, { ...moving, position: moved.position }] }
        : list
    ),
  };
}
