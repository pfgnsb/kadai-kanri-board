package com.nsb.taskboard.board;

import java.util.UUID;

public record MoveCardRequest(UUID listId, Integer index) {
}
