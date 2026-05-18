package com.springboot.MyTodoList.util;

public enum BotCommands {

	START_COMMAND("/start"), 
	HIDE_COMMAND("/hide"), 
	TODO_LIST("/todolist"),
	ADD_ITEM("/additem"),
	LLM_REQ("/llm"),
	CREATE_TASK("/creartarea"),
	COMPLETED_BY_SPRINT("/completadas_sprint"),
	COMPLETED_BY_USER_SPRINT("/completadas_usuario_sprint");

	private String command;

	BotCommands(String enumCommand) {
		this.command = enumCommand;
	}

	public String getCommand() {
		return command;
	}
}
