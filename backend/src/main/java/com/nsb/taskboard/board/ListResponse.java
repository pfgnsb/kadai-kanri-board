package com.nsb.taskboard.board;

import java.util.List;
import java.util.UUID;

public record ListResponse(
	UUID id,
	String title,
	int position,
	List<CardResponse> cards
) {
}
