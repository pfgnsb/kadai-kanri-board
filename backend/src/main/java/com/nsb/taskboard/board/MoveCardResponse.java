package com.nsb.taskboard.board;

import java.util.UUID;

public record MoveCardResponse(UUID id, UUID listId, int position) {
}
