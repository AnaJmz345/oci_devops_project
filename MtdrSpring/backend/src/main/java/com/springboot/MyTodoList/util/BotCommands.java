package com.springboot.MyTodoList.util;

public enum BotCommands {

	START_COMMAND("/start"), 
	HIDE_COMMAND("/hide"), 
	TODO_LIST("/todolist"),
	ADD_ITEM("/additem"),
	SHOW_ALL_DONE("/showdone"),
	LLM_REQ("/llm"),
	CREATE_TASK("/create_task"),
	COMPLETED_BY_SPRINT("/completed_by_sprint"),
	COMPLETED_BY_USER_SPRINT("/completed_by_user_sprint");

	private String command;

	BotCommands(String enumCommand) {
		this.command = enumCommand;
	}

	public String getCommand() {
		return command;
	}
}
