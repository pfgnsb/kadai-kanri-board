package com.nsb.taskboard.board;

import java.time.LocalDate;
import java.util.UUID;

public record CardResponse(
	UUID id,
	String title,
	String description,
	String priority,
	LocalDate dueDate,
	int position
) {
}
