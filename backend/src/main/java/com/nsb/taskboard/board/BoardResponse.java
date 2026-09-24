package com.nsb.taskboard.board;

import java.util.List;
import java.util.UUID;

public record BoardResponse(
	UUID id,
	String title,
	List<ListResponse> lists
) {
}
