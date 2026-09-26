package com.nsb.taskboard;

import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(ResponseStatusException.class)
	public ProblemDetail handleResponseStatus(ResponseStatusException exception) {
		String reason = exception.getReason() == null ? "" : exception.getReason();
		return ProblemDetail.forStatusAndDetail(exception.getStatusCode(), reason);
	}

}
