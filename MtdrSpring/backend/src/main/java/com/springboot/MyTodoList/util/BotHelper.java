package com.springboot.MyTodoList.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardRemove;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardMarkup;

public class BotHelper {

	private static final Logger logger = LoggerFactory.getLogger(BotHelper.class);
	private static final String PARSE_MODE_HTML = "HTML";

	public static void sendMessageToTelegram(Long chatId, String text, TelegramClient bot) {

		try {
			// prepare message
			SendMessage messageToTelegram = 
					SendMessage
					.builder()
					.chatId(chatId)
					.text(text)
					.parseMode(PARSE_MODE_HTML)
					.replyMarkup(new ReplyKeyboardRemove(true))
					.build()
				;

			// send message
			bot.execute(messageToTelegram);

		} catch (Exception e) {
			logger.error(e.getLocalizedMessage(), e);
		}
	}

	public static void sendMessageToTelegram(Long chatId, String text,TelegramClient bot, ReplyKeyboardMarkup rk ) {

		try {
			// prepare message
			SendMessage messageToTelegram = 
					SendMessage
					.builder()
					.chatId(chatId)
					.text(text)
					.parseMode(PARSE_MODE_HTML)
					.replyMarkup(rk)
					.build()
				;

			// send message
			bot.execute(messageToTelegram);

		} catch (Exception e) {
			logger.error(e.getLocalizedMessage(), e);
		}
	}

	public static String escapeHtml(String value) {
		if (value == null) {
			return "";
		}
		return value
				.replace("&", "&amp;")
				.replace("<", "&lt;")
				.replace(">", "&gt;")
				.replace("\"", "&quot;");
	}

}
