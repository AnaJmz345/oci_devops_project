package com.springboot.MyTodoList.util;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.service.DeepSeekService;
import com.springboot.MyTodoList.service.NaturalLanguageIntentService;
import com.springboot.MyTodoList.service.TaskNaturalLanguageService;
import com.springboot.MyTodoList.service.TaskNaturalLanguageService.TaskDraft;
import com.springboot.MyTodoList.service.TelegramTaskDraftService;
import com.springboot.MyTodoList.service.ToDoItemService;
import com.springboot.MyTodoList.service.UserService;
import com.springboot.MyTodoList.task.Task;
import com.springboot.MyTodoList.task.TaskAssignee;
import com.springboot.MyTodoList.task.TaskService;
import com.springboot.MyTodoList.sprint.Sprint;
import com.springboot.MyTodoList.sprint.SprintService;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.KeyboardRow;
import org.telegram.telegrambots.meta.generics.TelegramClient;

public class BotActions{

    private static final Logger logger = LoggerFactory.getLogger(BotActions.class);

    String requestText;
    long chatId;
    TelegramClient telegramClient;
    boolean exit;

    ToDoItemService todoService;
    DeepSeekService deepSeekService;
    NaturalLanguageIntentService naturalLanguageIntentService;
    TaskService taskService;
    TaskNaturalLanguageService taskNaturalLanguageService;
    TelegramTaskDraftService telegramTaskDraftService;
    UserService userService;
    SprintService sprintService;
    String detectedIntent;

    private static final String NO_SPRINT = "NO SPRINT";

    public BotActions(TelegramClient tc, ToDoItemService ts, DeepSeekService ds,
            NaturalLanguageIntentService nlIntentService, TaskService taskSvc,
            TaskNaturalLanguageService taskNlService, TelegramTaskDraftService taskDraftService,
            UserService usrService, SprintService sprService){
        telegramClient = tc;
        todoService = ts;
        deepSeekService = ds;
        naturalLanguageIntentService = nlIntentService;
        taskService = taskSvc;
        taskNaturalLanguageService = taskNlService;
        telegramTaskDraftService = taskDraftService;
        userService = usrService;
        sprintService = sprService;
        exit  = false;
    }

    public void setRequestText(String cmd){
        requestText=cmd;
    }

    public void setChatId(long chId){
        chatId=chId;
    }

    public void setTelegramClient(TelegramClient tc){
        telegramClient=tc;
    }

    public void setTodoService(ToDoItemService tsvc){
        todoService = tsvc;
    }

    public ToDoItemService getTodoService(){
        return todoService;
    }

    public void setDeepSeekService(DeepSeekService dssvc){
        deepSeekService = dssvc;
    }

    public DeepSeekService getDeepSeekService(){
        return deepSeekService;
    }

    public void setNaturalLanguageIntentService(NaturalLanguageIntentService nlIntentService){
        naturalLanguageIntentService = nlIntentService;
    }

    public void translateNaturalLanguageIntent(){
        if (requestText == null || requestText.startsWith("/") || naturalLanguageIntentService == null || exit) {
            return;
        }

        String intent = getDetectedIntent();
        if ("LIST_TASKS".equals(intent)) {
            requestText = BotCommands.TODO_LIST.getCommand();
        }
    }

    private String getDetectedIntent() {
        if (detectedIntent == null && naturalLanguageIntentService != null) {
            detectedIntent = naturalLanguageIntentService.detectIntent(requestText);
        }

        return detectedIntent;
    }


    

    public void fnStart() {
        if (!(requestText.equals(BotCommands.START_COMMAND.getCommand()) || requestText.equals(BotLabels.SHOW_MAIN_SCREEN.getLabel())) || exit) 
            return;

        BotHelper.sendMessageToTelegram(chatId, BotMessages.HELLO_MYTODO_BOT.getMessage(), telegramClient,  ReplyKeyboardMarkup
            .builder()
            .keyboardRow(new KeyboardRow(BotLabels.LIST_ALL_ITEMS.getLabel(),BotLabels.ADD_NEW_ITEM.getLabel()))
            .keyboardRow(new KeyboardRow(BotLabels.SHOW_MAIN_SCREEN.getLabel(),BotLabels.HIDE_MAIN_SCREEN.getLabel()))
            .build()
        );
        exit = true;
    }

    public void fnDone() {
        if (!(requestText.indexOf(BotLabels.DONE.getLabel()) != -1) || exit) 
            return;
            
        String done = requestText.substring(0, requestText.indexOf(BotLabels.DASH.getLabel()));
        Integer id = Integer.valueOf(done);

        try {

            ToDoItem item = todoService.getToDoItemById(id);
            item.setDone("DONE");
            todoService.updateToDoItem(id, item);
            BotHelper.sendMessageToTelegram(chatId, BotMessages.ITEM_DONE.getMessage(), telegramClient);

        } catch (Exception e) {
            logger.error(e.getLocalizedMessage(), e);
        }
        exit = true;
    }

    public void fnUndo() {
        if (requestText.indexOf(BotLabels.UNDO.getLabel()) == -1 || exit)
            return;

        String undo = requestText.substring(0,
                requestText.indexOf(BotLabels.DASH.getLabel()));
        Integer id = Integer.valueOf(undo);

        try {

            ToDoItem item = todoService.getToDoItemById(id);
            item.setDone("TODO");
            todoService.updateToDoItem(id, item);
            BotHelper.sendMessageToTelegram(chatId, BotMessages.ITEM_UNDONE.getMessage(), telegramClient);

        } catch (Exception e) {
            logger.error(e.getLocalizedMessage(), e);
        }
        exit = true;
    }

    public void fnDelete(){
        if (requestText.indexOf(BotLabels.DELETE.getLabel()) == -1 || exit)
            return;

        String delete = requestText.substring(0,
                requestText.indexOf(BotLabels.DASH.getLabel()));
        Integer id = Integer.valueOf(delete);

        try {
            todoService.deleteToDoItem(id);
            BotHelper.sendMessageToTelegram(chatId, BotMessages.ITEM_DELETED.getMessage(), telegramClient);

        } catch (Exception e) {
            logger.error(e.getLocalizedMessage(), e);
        }
        exit = true;
    }

    public void fnHide(){
        if (requestText.equals(BotCommands.HIDE_COMMAND.getCommand())
				|| requestText.equals(BotLabels.HIDE_MAIN_SCREEN.getLabel()) && !exit)
			BotHelper.sendMessageToTelegram(chatId, BotMessages.BYE.getMessage(), telegramClient);
        else
            return;
        exit = true;
    }

    public void fnListAll(){
                boolean isListCommand = requestText.equals(BotCommands.TODO_LIST.getCommand())
				|| requestText.equals(BotLabels.LIST_ALL_ITEMS.getLabel())
				|| requestText.equals(BotLabels.MY_TODO_LIST.getLabel());
                if (!isListCommand || exit)
            return;

        logger.info("todoSvc: " + todoService);

        ReplyKeyboardMarkup keyboardMarkup = ReplyKeyboardMarkup.builder()
            .resizeKeyboard(true)
            .oneTimeKeyboard(false)
            .selective(true)
            .build();

        List<KeyboardRow> keyboard = new ArrayList<>();

        KeyboardRow mainScreenRowTop = new KeyboardRow();
        mainScreenRowTop.add(BotLabels.SHOW_MAIN_SCREEN.getLabel());
        keyboard.add(mainScreenRowTop);

        KeyboardRow firstRow = new KeyboardRow();
        firstRow.add(BotLabels.ADD_NEW_ITEM.getLabel());
        keyboard.add(firstRow);

        KeyboardRow myTodoListTitleRow = new KeyboardRow();
        myTodoListTitleRow.add(BotLabels.MY_TODO_LIST.getLabel());
        keyboard.add(myTodoListTitleRow);

        List<TaskView> taskViews = buildTaskViews();
        Map<String, List<TaskView>> tasksBySprint = groupBySprint(taskViews);

        StringBuilder responseText = new StringBuilder("<b>HERE ARE ALL YOUR TASKS:</b>");

        boolean hasAnyTasks = !taskViews.isEmpty();
        if (!hasAnyTasks) {
            responseText.append("\n\n<i>You do not have any tasks yet.</i>");
        }

        for (Map.Entry<String, List<TaskView>> entry : tasksBySprint.entrySet()) {
            String sprintName = entry.getKey();
            List<TaskView> sprintTasks = entry.getValue();

            responseText.append("\n\n<b>SPRINT: ")
                    .append(BotHelper.escapeHtml(sprintName.toUpperCase()))
                    .append("</b>");

            List<TaskView> todoItems = filterByStatus(sprintTasks, "TODO");
            List<TaskView> inProgressItems = filterByStatus(sprintTasks, "IN PROGRESS");
            List<TaskView> blockedItems = filterByStatus(sprintTasks, "BLOCKED");
            List<TaskView> doneItems = filterByStatus(sprintTasks, "DONE");

            if (!todoItems.isEmpty()) {
                appendStatusSection(responseText, "TODO", todoItems, null);
                addKeyboardRows(todoItems, false, keyboard);
            }

            if (!inProgressItems.isEmpty()) {
                appendStatusSection(responseText, "IN PROGRESS", inProgressItems, null);
                addKeyboardRows(inProgressItems, false, keyboard);
            }

            if (!blockedItems.isEmpty()) {
                appendStatusSection(responseText, "BLOCKED", blockedItems, null);
                addKeyboardRows(blockedItems, false, keyboard);
            }

            if (!doneItems.isEmpty()) {
                appendStatusSection(responseText, "DONE", doneItems, null);
                addKeyboardRows(doneItems, true, keyboard);
            }
        }

        KeyboardRow mainScreenRowBottom = new KeyboardRow();
        mainScreenRowBottom.add(BotLabels.SHOW_MAIN_SCREEN.getLabel());
        keyboard.add(mainScreenRowBottom);

        keyboardMarkup.setKeyboard(keyboard);

        BotHelper.sendMessageToTelegram(chatId, responseText.toString(), telegramClient, keyboardMarkup);
        exit = true;
    }

    public void fnAddItem(){
        logger.info("Adding item");
		if (!(requestText.contains(BotCommands.ADD_ITEM.getCommand())
				|| requestText.contains(BotLabels.ADD_NEW_ITEM.getLabel())) || exit )
            return;
        logger.info("Adding item by BotHelper");
        BotHelper.sendMessageToTelegram(chatId, BotMessages.TYPE_NEW_TODO_ITEM.getMessage(), telegramClient);
        exit = true;
    }

    public void fnElse(){
        if(exit)
            return;
        ToDoItem newItem = new ToDoItem();
        newItem.setDescription(requestText);
        newItem.setDone("TODO");
        todoService.addToDoItem(newItem);

        BotHelper.sendMessageToTelegram(chatId, BotMessages.NEW_ITEM_ADDED.getMessage(), telegramClient, null);
    }

    public void fnLLM(){
        logger.info("Calling LLM");
        if (!(requestText.contains(BotCommands.LLM_REQ.getCommand())) || exit)
            return;
        
        String prompt = "Give me the weather in Monterrey";
        String out = "<empty>";
        try{
            out = deepSeekService.generateText(prompt);
        }catch(Exception exc){

        }

        BotHelper.sendMessageToTelegram(chatId, "<b>LLM:</b> " + BotHelper.escapeHtml(out), telegramClient, null);

    }

    public void fnCreateTaskFromNaturalLanguage(){
        if (exit || requestText == null || taskService == null || taskNaturalLanguageService == null
                || telegramTaskDraftService == null || userService == null) {
            return;
        }

        Long chatKey = chatId;

        try {
            if (telegramTaskDraftService.hasDraft(chatKey)) {
                telegramTaskDraftService.fillNextMissing(chatKey, requestText);
                TaskDraft draft = telegramTaskDraftService.getDraft(chatKey);
                handleTaskDraft(chatKey, draft);
                exit = true;
                return;
            }

            String intent = getDetectedIntent();
            if (!"CREATE_TASK".equals(intent)) {
                return;
            }

            TaskDraft draft = taskNaturalLanguageService.extractTaskDraft(requestText);
            handleTaskDraft(chatKey, draft);
            exit = true;
        } catch (Exception exc) {
            logger.error("Could not create task from natural language", exc);
            BotHelper.sendMessageToTelegram(chatId,
                    "I could not create the task. Please check the data and try again.",
                    telegramClient, null);
            exit = true;
        }
    }

    private void handleTaskDraft(Long chatKey, TaskDraft draft) {
        if (draft == null) {
            BotHelper.sendMessageToTelegram(chatId,
                    "I could not understand the task details. Let's try again: what should the task be called?",
                    telegramClient, null);
            return;
        }

        String validationMessage = validateDraft(draft);
        if (validationMessage != null) {
            telegramTaskDraftService.saveDraft(chatKey, draft);
            BotHelper.sendMessageToTelegram(chatId, validationMessage, telegramClient, null);
            return;
        }

        Optional<User> assignee = userService.findByMail(draft.getAssigneeEmail());
        if (assignee.isEmpty()) {
            draft.setAssigneeEmail(null);
            draft.setPendingField("ASSIGNEE_EMAIL");
            telegramTaskDraftService.saveDraft(chatKey, draft);
            BotHelper.sendMessageToTelegram(chatId,
                    "I could not find a developer with that email. Send me a valid one.\n\n" + developerEmailsMessage(),
                    telegramClient, null);
            return;
        }

        Optional<Sprint> sprint = resolveSprint(draft);
        if (draft.getSprintId() != null && sprint.isEmpty()) {
            draft.setSprintId(null);
            draft.setPendingField("SPRINT");
            telegramTaskDraftService.saveDraft(chatKey, draft);
            BotHelper.sendMessageToTelegram(chatId,
                    "I could not find that sprint. The number must match the sprint name, for example: Sprint 3.\n\n"
                            + sprintOptionsMessage(),
                    telegramClient, null);
            return;
        }

        createTask(draft, assignee.get(), sprint.orElse(null));
        telegramTaskDraftService.clearDraft(chatKey);
    }

    private String validateDraft(TaskDraft draft) {
        if (draft.getTaskName() == null || draft.getTaskName().isBlank()) {
            draft.setTaskName(null);
            draft.setPendingField("TASK_NAME");
            return "What should the task be called?";
        }

        LocalDate today = LocalDate.now();
        if (draft.getDueDate() == null) {
            draft.setPendingField("DUE_DATE");
            return "What is the due date? Today is " + today + ". It must be today or later.";
        }

        if (draft.getDueDate().isBefore(today)) {
            draft.setDueDate(null);
            draft.setPendingField("DUE_DATE");
            return "The due date is invalid because it already passed. Today is " + today
                    + ". Send me a date that is today or later.";
        }

        if (draft.getAssigneeEmail() == null || draft.getAssigneeEmail().isBlank()) {
            draft.setAssigneeEmail(null);
            draft.setPendingField("ASSIGNEE_EMAIL");
            return "Which developer email should I assign it to?\n\n" + developerEmailsMessage();
        }

        draft.setPendingField(null);
        return null;
    }

    private Optional<Sprint> resolveSprint(TaskDraft draft) {
        if (draft.getSprintId() == null || sprintService == null) {
            return Optional.empty();
        }

        return sprintService.findBySprintNumber(draft.getSprintId());
    }

    private String developerEmailsMessage() {
        List<User> developers = userService.findByRole("DEVELOPER");
        if (developers == null || developers.isEmpty()) {
            return "There are no registered developers.";
        }

        StringBuilder message = new StringBuilder("<b>Registered developers:</b>");
        developers.stream()
                .sorted(Comparator.comparing(User::getMail))
            .forEach(user -> message.append("\n- ").append(BotHelper.escapeHtml(user.getMail())));
        return message.toString();
    }

    private String sprintOptionsMessage() {
        if (sprintService == null) {
            return "I could not check the sprints.";
        }

        List<Sprint> sprints = sprintService.findAll();
        if (sprints == null || sprints.isEmpty()) {
            return "There are no registered sprints.";
        }

        StringBuilder message = new StringBuilder("<b>Registered sprints:</b>");
        sprints.stream()
                .sorted(Comparator.comparing(Sprint::getSprintName))
                .forEach(sprint -> message.append("\n- ")
                .append(BotHelper.escapeHtml(sprint.getSprintName()))
                        .append(" (internal ID: ")
                .append(BotHelper.escapeHtml(String.valueOf(sprint.getSprintId())))
                        .append(")"));
        return message.toString();
    }

    private void createTask(TaskDraft draft, User assignee, Sprint sprint) {
        Task task = new Task();
        task.setTaskName(draft.getTaskName());
        task.setDescription(draft.getDescription());
        task.setDueDate(draft.getDueDate());
        task.setSprintId(sprint == null ? null : sprint.getSprintId());
        task.setStatus("TODO");
        task.setCategory("FEATURE");
        task.setStoryPoints(1);
        task.setCreatedBy(1L);

        Task savedTask = taskService.addTask(task);

        TaskAssignee taskAssignee = new TaskAssignee();
        taskAssignee.setTaskId(savedTask.getTaskId());
        taskAssignee.setOracleId(assignee.getOracleId());
        taskAssignee.setRealTimeSpent(0.0);
        taskService.assignTask(taskAssignee);

        String message = "<b>Task created</b>\n"
            + "Name: <b>" + BotHelper.escapeHtml(savedTask.getTaskName()) + "</b>\n"
            + "Description: " + BotHelper.escapeHtml(valueOrEmpty(savedTask.getDescription())) + "\n"
            + "Due date: <code>" + BotHelper.escapeHtml(String.valueOf(savedTask.getDueDate())) + "</code>\n"
            + "Sprint: " + BotHelper.escapeHtml(sprint == null ? "No data" : sprint.getSprintName()) + "\n"
            + "Assigned to: " + BotHelper.escapeHtml(assignee.getName()) + " ("
            + BotHelper.escapeHtml(assignee.getMail()) + ")";

        BotHelper.sendMessageToTelegram(chatId, message, telegramClient, null);
    }

    private List<TaskView> buildTaskViews() {
        List<TaskView> views = new ArrayList<>();
        if (taskService != null) {
            Map<Long, String> sprintNames = loadSprintNames();
            List<Task> tasks = taskService.findAll();
            for (Task task : tasks) {
                String sprintName = resolveSprintName(task.getSprintId(), sprintNames);
                views.add(new TaskView(
                        task.getTaskId() == null ? 0L : task.getTaskId(),
                        task.getTaskName(),
                        normalizeStatus(task.getStatus()),
                        sprintName
                ));
            }
            return views;
        }

        if (todoService != null) {
            List<ToDoItem> allItems = todoService.findAll();
            for (ToDoItem item : allItems) {
                views.add(new TaskView(
                        item.getID(),
                        item.getDescription(),
                        normalizeStatus(item.getDone()),
                        NO_SPRINT
                ));
            }
        }

        return views;
    }

    private Map<Long, String> loadSprintNames() {
        Map<Long, String> sprintNames = new HashMap<>();
        if (sprintService == null) {
            return sprintNames;
        }

        List<Sprint> sprints = sprintService.findAll();
        for (Sprint sprint : sprints) {
            if (sprint.getSprintId() != null) {
                sprintNames.put(sprint.getSprintId(), sprint.getSprintName());
            }
        }
        return sprintNames;
    }

    private String resolveSprintName(Long sprintId, Map<Long, String> sprintNames) {
        if (sprintId == null) {
            return NO_SPRINT;
        }
        String sprintName = sprintNames.get(sprintId);
        if (sprintName == null || sprintName.isBlank()) {
            return NO_SPRINT;
        }
        return sprintName;
    }

    private Map<String, List<TaskView>> groupBySprint(List<TaskView> taskViews) {
        List<TaskView> sorted = new ArrayList<>(taskViews);
        sorted.sort(Comparator.comparing(TaskView::getSprintName, this::compareSprintNames)
                .thenComparing(TaskView::getTitle, String.CASE_INSENSITIVE_ORDER));

        return sorted.stream()
                .collect(Collectors.groupingBy(TaskView::getSprintName, LinkedHashMap::new, Collectors.toList()));
    }

    private int compareSprintNames(String left, String right) {
        if (NO_SPRINT.equals(left) && NO_SPRINT.equals(right)) {
            return 0;
        }
        if (NO_SPRINT.equals(left)) {
            return 1;
        }
        if (NO_SPRINT.equals(right)) {
            return -1;
        }
        return left.compareToIgnoreCase(right);
    }

    private List<TaskView> filterByStatus(List<TaskView> tasks, String status) {
        return tasks.stream()
                .filter(task -> status.equals(task.getStatus()))
                .collect(Collectors.toList());
    }

    private void appendStatusSection(StringBuilder responseText, String status, List<TaskView> items, String meta) {
        if (items.isEmpty()) {
            return;
        }
        String heading = statusHeading(status, items.size(), meta);
        responseText.append("\n\n<b>").append(heading).append("</b>");
        for (TaskView item : items) {
            responseText.append("\n- ")
                    .append(BotHelper.escapeHtml(item.getTitle()));
        }
    }

    private String statusHeading(String status, int count, String meta) {
        String base = statusEmoji(status) + " " + status + " (" + count + ")";
        if (meta == null || meta.isBlank()) {
            return base;
        }
        return base + " - " + meta;
    }

    private String statusEmoji(String status) {
        switch (status) {
            case "IN PROGRESS":
                return "\uD83D\uDFE1"; // yellow circle
            case "DONE":
                return "\uD83D\uDFE2"; // green circle
            case "BLOCKED":
                return "\uD83D\uDD34"; // red circle
            case "TODO":
            default:
                return "\u26AB"; // black circle
        }
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "TODO";
        }
        String normalized = status.trim().toUpperCase();
        if ("IN_PROGRESS".equals(normalized)) {
            return "IN PROGRESS";
        }
        return normalized;
    }

    private void addKeyboardRows(List<TaskView> items, boolean isDone, List<KeyboardRow> keyboard) {
        for (TaskView item : items) {
            KeyboardRow currentRow = new KeyboardRow();
            currentRow.add(item.getTitle());
            if (isDone) {
                currentRow.add(item.getId() + BotLabels.DASH.getLabel() + BotLabels.UNDO.getLabel());
                currentRow.add(item.getId() + BotLabels.DASH.getLabel() + BotLabels.DELETE.getLabel());
            } else {
                currentRow.add(item.getId() + BotLabels.DASH.getLabel() + BotLabels.DONE.getLabel());
            }
            keyboard.add(currentRow);
        }
    }

    private static class TaskView {
        private final long id;
        private final String title;
        private final String status;
        private final String sprintName;

        private TaskView(long id, String title, String status, String sprintName) {
            this.id = id;
            this.title = title == null ? "" : title;
            this.status = status == null ? "TODO" : status;
            this.sprintName = sprintName == null ? NO_SPRINT : sprintName;
        }

        private long getId() {
            return id;
        }

        private String getTitle() {
            return title;
        }

        private String getStatus() {
            return status;
        }

        private String getSprintName() {
            return sprintName;
        }
    }

    private String valueOrEmpty(Object value) {
        return value == null ? "No data" : value.toString();
    }

}
