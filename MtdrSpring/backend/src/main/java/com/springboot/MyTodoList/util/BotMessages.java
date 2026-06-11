package com.springboot.MyTodoList.util;

public enum BotMessages {
	
	HELLO_MYTODO_BOT(
	"<b>Hello!</b> I'm <b>MyTodoList Bot</b>!\nType a new todo item below and press the send button (blue arrow), or select an option below:"),
	BOT_REGISTERED_STARTED("<b>Bot registered</b> and started successfully!"),
	ITEM_DONE("<b>Item done!</b> Select /todolist to return to the list of todo items, or /start to go to the main screen."),
	ITEM_UNDONE("<b>Item undone!</b> Select /todolist to return to the list of todo items, or /start to go to the main screen."),
	ITEM_DELETED("<b>Item deleted!</b> Select /todolist to return to the list of todo items, or /start to go to the main screen."),
	TYPE_NEW_TODO_ITEM("<b>New task</b>: type a new todo item below and press the send button (blue arrow) on the right-hand side."),
	NEW_ITEM_ADDED("<b>New item added!</b> Select /todolist to return to the list of todo items, or /start to go to the main screen."),
	BYE("<i>Bye!</i> Select /start to resume!");

	private String message;

	BotMessages(String enumMessage) {
		this.message = enumMessage;
	}

	public String getMessage() {
		return message;
	}

}
