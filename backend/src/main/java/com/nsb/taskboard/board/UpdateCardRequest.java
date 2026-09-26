package com.nsb.taskboard.board;

public record UpdateCardRequest(
	String title,
	String description,
	String priority,
	String dueDate
) {
}
