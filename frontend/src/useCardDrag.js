import { useEffect, useRef } from "react";

const DRAG_THRESHOLD = 8;

export function useCardDrag(boardRef, onPlace) {
  const onPlaceRef = useRef(onPlace);
  onPlaceRef.current = onPlace;

  useEffect(() => {
    const boardEl = boardRef.current;
    if (!boardEl) {
      return undefined;
    }

    let drag = null;
    let justDragged = false;

    function onPointerDown(event) {
      if (event.button !== 0) {
        return;
      }
      if (event.target.closest("button, input, textarea, select, a, label")) {
        return;
      }
      const card = event.target.closest(".card");
      if (!card || !boardEl.contains(card)) {
        return;
      }

      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        listId: card.dataset.listId,
        cardId: card.dataset.cardId,
        started: false,
        ghost: null,
        drop: null,
        offsetX: 0,
        offsetY: 0,
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    }

    function onPointerMove(event) {
      if (!drag || event.pointerId !== drag.pointerId) {
        return;
      }
      const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      if (!drag.started) {
        if (distance < DRAG_THRESHOLD) {
          return;
        }
        startDrag(event);
      }
      event.preventDefault();
      updateDrag(event);
    }

    function onPointerUp(event) {
      if (drag && event.pointerId !== drag.pointerId) {
        return;
      }
      endDrag();
    }

    function onClickCapture(event) {
      if (!justDragged) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      justDragged = false;
    }

    function startDrag(event) {
      const cardEl = boardEl.querySelector(`.card[data-card-id="${drag.cardId}"]`);
      if (!cardEl) {
        return;
      }
      const rect = cardEl.getBoundingClientRect();
      drag.started = true;
      drag.offsetX = event.clientX - rect.left;
      drag.offsetY = event.clientY - rect.top;

      const ghost = cardEl.cloneNode(true);
      ghost.classList.add("card-ghost");
      ghost.style.width = `${rect.width}px`;
      ghost.style.left = `${rect.left}px`;
      ghost.style.top = `${rect.top}px`;
      document.body.appendChild(ghost);
      drag.ghost = ghost;

      const placeholder = getPlaceholder();
      placeholder.style.height = `${rect.height}px`;
      cardEl.insertAdjacentElement("afterend", placeholder);
      cardEl.classList.add("card-origin");
      document.body.classList.add("is-dragging");
    }

    function updateDrag(event) {
      if (!drag.ghost) {
        return;
      }
      drag.ghost.style.left = `${event.clientX - drag.offsetX}px`;
      drag.ghost.style.top = `${event.clientY - drag.offsetY}px`;

      const target = getDropTarget(event);
      if (!target) {
        return;
      }
      const placeholder = getPlaceholder();
      const before = target.cards[target.index] || null;
      if (before) {
        if (placeholder.nextElementSibling !== before || placeholder.parentElement !== target.cardsEl) {
          target.cardsEl.insertBefore(placeholder, before);
        }
      } else if (placeholder.parentElement !== target.cardsEl || placeholder.nextElementSibling) {
        target.cardsEl.appendChild(placeholder);
      }
      drag.drop = { listId: target.listId, index: target.index };
    }

    function endDrag() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      const current = drag;
      drag = null;
      if (!current?.started) {
        return;
      }

      justDragged = true;
      window.setTimeout(() => {
        justDragged = false;
      }, 80);
      current.ghost?.remove();
      document.getElementById("card-placeholder")?.remove();
      document.body.classList.remove("is-dragging");
      boardEl.querySelector(".card-origin")?.classList.remove("card-origin");

      if (current.drop) {
        onPlaceRef.current(current.cardId, current.drop.listId, current.drop.index);
      }
    }

    boardEl.addEventListener("pointerdown", onPointerDown);
    boardEl.addEventListener("click", onClickCapture, true);
    return () => {
      boardEl.removeEventListener("pointerdown", onPointerDown);
      boardEl.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.getElementById("card-placeholder")?.remove();
      document.querySelector(".card-ghost")?.remove();
      document.body.classList.remove("is-dragging");
    };
  }, [boardRef]);
}

function getPlaceholder() {
  let placeholder = document.getElementById("card-placeholder");
  if (placeholder) {
    return placeholder;
  }
  placeholder = document.createElement("div");
  placeholder.id = "card-placeholder";
  placeholder.className = "card-placeholder";
  placeholder.setAttribute("aria-hidden", "true");
  return placeholder;
}

function getDropTarget(event) {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const listEl = element?.closest(".list");
  if (!listEl) {
    return null;
  }
  const cardsEl = listEl.querySelector(".cards");
  if (!cardsEl) {
    return null;
  }
  const cards = [...cardsEl.querySelectorAll(".card:not(.card-origin)")];
  let index = cards.length;
  for (let i = 0; i < cards.length; i += 1) {
    const rect = cards[i].getBoundingClientRect();
    if (event.clientY < rect.top + rect.height / 2) {
      index = i;
      break;
    }
  }
  return { listId: listEl.dataset.listId, index, cardsEl, cards };
}
