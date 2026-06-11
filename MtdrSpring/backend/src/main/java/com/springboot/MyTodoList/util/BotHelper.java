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
	private static final int TELEGRAM_MESSAGE_LIMIT = 4096;
	private static final int SAFE_MESSAGE_LIMIT = 3800;

	public static void sendMessageToTelegram(Long chatId, String text, TelegramClient bot) {
		sendMessageToTelegram(chatId, text, bot, null, true);
	}

	public static void sendMessageToTelegram(Long chatId, String text,TelegramClient bot, ReplyKeyboardMarkup rk ) {
		sendMessageToTelegram(chatId, text, bot, rk, false);
	}

	private static void sendMessageToTelegram(Long chatId, String text, TelegramClient bot,
			ReplyKeyboardMarkup rk, boolean removeKeyboard) {
		try {
			java.util.List<String> chunks = splitMessage(text);
			for (int i = 0; i < chunks.size(); i++) {
				boolean lastChunk = i == chunks.size() - 1;
				SendMessage.SendMessageBuilder<?, ?> builder = SendMessage
						.builder()
						.chatId(chatId)
						.text(chunks.get(i))
						.parseMode(PARSE_MODE_HTML);

				if (lastChunk) {
					if (rk != null) {
						builder.replyMarkup(rk);
					} else if (removeKeyboard) {
						builder.replyMarkup(new ReplyKeyboardRemove(true));
					}
				}

				bot.execute(builder.build());
			}
		} catch (Exception e) {
			logger.error(e.getLocalizedMessage(), e);
		}
	}

	private static java.util.List<String> splitMessage(String text) {
		String safeText = text == null ? "" : text;
		java.util.List<String> chunks = new java.util.ArrayList<>();
		if (safeText.length() <= TELEGRAM_MESSAGE_LIMIT) {
			chunks.add(safeText);
			return chunks;
		}

		StringBuilder current = new StringBuilder();
		for (String line : safeText.split("\\n", -1)) {
			int candidateLength = current.length() + line.length() + 1;
			if (current.length() > 0 && candidateLength > SAFE_MESSAGE_LIMIT) {
				chunks.add(current.toString());
				current.setLength(0);
			}

			if (line.length() > SAFE_MESSAGE_LIMIT) {
				if (current.length() > 0) {
					chunks.add(current.toString());
					current.setLength(0);
				}
				for (int start = 0; start < line.length(); start += SAFE_MESSAGE_LIMIT) {
					chunks.add(line.substring(start, Math.min(start + SAFE_MESSAGE_LIMIT, line.length())));
				}
				continue;
			}

			if (current.length() > 0) {
				current.append('\n');
			}
			current.append(line);
		}

		if (current.length() > 0 || chunks.isEmpty()) {
			chunks.add(current.toString());
		}
		return chunks;
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
