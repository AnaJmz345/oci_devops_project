package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.service.TaskNaturalLanguageService.TaskDraft;
import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class TelegramTaskDraftService {

    private final Map<Long, TaskDraft> draftsByChat = new ConcurrentHashMap<>();
    private final TaskNaturalLanguageService taskNaturalLanguageService;

    public TelegramTaskDraftService(TaskNaturalLanguageService taskNaturalLanguageService) {
        this.taskNaturalLanguageService = taskNaturalLanguageService;
    }

    public void saveDraft(Long chatId, TaskDraft draft) {
        draftsByChat.put(chatId, draft);
    }

    public TaskDraft getDraft(Long chatId) {
        return draftsByChat.get(chatId);
    }

    public void clearDraft(Long chatId) {
        draftsByChat.remove(chatId);
    }

    public boolean hasDraft(Long chatId) {
        return draftsByChat.containsKey(chatId);
    }

    public void fillNextMissing(Long chatId, String message) {
        TaskDraft draft = draftsByChat.get(chatId);
        if (draft == null) {
            return;
        }

        if ("TASK_NAME".equals(draft.getPendingField()) || draft.getTaskName() == null) {
            draft.setTaskName(message);
            draft.setPendingField(null);
            return;
        }

        if ("DUE_DATE".equals(draft.getPendingField()) || draft.getDueDate() == null) {
            LocalDate dueDate = taskNaturalLanguageService.extractDueDate(message);
            draft.setDueDate(dueDate);
            draft.setPendingField(null);
            return;
        }

        if ("ASSIGNEE_EMAIL".equals(draft.getPendingField()) || draft.getAssigneeEmail() == null) {
            draft.setAssigneeEmail(message.trim());
            draft.setPendingField(null);
            return;
        }

        if ("SPRINT".equals(draft.getPendingField())) {
            TaskDraft sprintDraft = taskNaturalLanguageService.extractTaskDraft("pertenece al " + message);
            draft.setSprintId(sprintDraft.getSprintId());
            draft.setPendingField(null);
        }
    }
}
