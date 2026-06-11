package com.springboot.MyTodoList.util;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.model.ToDoItem;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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
    NaturalLanguageIntentService naturalLanguageIntentService;
    TaskService taskService;
    TaskNaturalLanguageService taskNaturalLanguageService;
    TelegramTaskDraftService telegramTaskDraftService;
    UserService userService;
    SprintService sprintService;
    String detectedIntent;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
    private static final Pattern NUMBER_PATTERN = Pattern.compile("\\d+");

    private static final String NO_SPRINT = "NO SPRINT";

    public BotActions(TelegramClient tc, ToDoItemService ts,
            NaturalLanguageIntentService nlIntentService, TaskService taskSvc,
            TaskNaturalLanguageService taskNlService, TelegramTaskDraftService taskDraftService,
            UserService usrService, SprintService sprService){
        telegramClient = tc;
        todoService = ts;
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
            .keyboardRow(new KeyboardRow(BotLabels.LIST_ALL_ITEMS.getLabel(), BotLabels.ADD_NEW_ITEM.getLabel()))
            .keyboardRow(new KeyboardRow(BotLabels.CREATE_TASK.getLabel(), BotLabels.COMPLETED_BY_SPRINT.getLabel()))
            .keyboardRow(new KeyboardRow(BotLabels.COMPLETED_BY_USER_SPRINT.getLabel()))
            .keyboardRow(new KeyboardRow(BotLabels.SHOW_MAIN_SCREEN.getLabel(), BotLabels.HIDE_MAIN_SCREEN.getLabel()))
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

        StringBuilder responseText = new StringBuilder("<b>HERE ARE ALL VANTAGE TASKS:</b>");

        boolean hasAnyTasks = !taskViews.isEmpty();
        if (!hasAnyTasks) {
            responseText.append("\n\n<i>There are no Vantage tasks yet.</i>");
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

        BotHelper.sendMessageToTelegram(chatId,
                "I can answer task questions locally now. Try: <code>show all tasks</code>, "
                        + "<code>tasks assigned to each developer</code>, or "
                        + "<code>create task Login | Build auth | 2026-06-20 | dev@correo.com | Sprint 1</code>.",
                telegramClient, null);
        exit = true;

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

            boolean explicitCreateCommand = isCreateTaskCommand(requestText);
            String intent = explicitCreateCommand ? "CREATE_TASK" : getDetectedIntent();
            if (!"CREATE_TASK".equals(intent)) {
                return;
            }

            if (explicitCreateCommand && commandPayload(requestText).isBlank()) {
                BotHelper.sendMessageToTelegram(chatId, createTaskHelpMessage(), telegramClient, null);
                exit = true;
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

    public void fnCompletedTasksBySprint() {
        if (exit || requestText == null || taskService == null || sprintService == null) {
            return;
        }

        if (!isCompletedBySprintCommand(requestText)) {
            return;
        }

        Long sprintNumber = firstNumber(requestText);
        if (sprintNumber == null) {
            BotHelper.sendMessageToTelegram(chatId,
                    "Tell me which sprint. Example: /completed_by_sprint 1",
                    telegramClient, null);
            exit = true;
            return;
        }

        Optional<Sprint> sprint = sprintService.findBySprintNumber(sprintNumber);
        if (sprint.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId,
                    "I could not find Sprint " + sprintNumber + ".\n\n" + sprintOptionsMessage(),
                    telegramClient, null);
            exit = true;
            return;
        }

        List<Task> completedTasks = taskService.findBySprintId(sprint.get().getSprintId()).stream()
                .filter(task -> "DONE".equalsIgnoreCase(task.getStatus()))
                .sorted(Comparator.comparing(Task::getTaskName))
                .collect(Collectors.toList());

        BotHelper.sendMessageToTelegram(chatId,
                completedTasksMessage("Completed tasks for " + sprint.get().getSprintName(), completedTasks),
                telegramClient, null);
        exit = true;
    }

    public void fnCompletedTasksByUserInSprint() {
        if (exit || requestText == null || taskService == null || sprintService == null || userService == null) {
            return;
        }

        if (!isCompletedByUserSprintCommand(requestText)) {
            return;
        }

        String email = firstEmail(requestText);
        Long sprintNumber = firstNumber(email == null ? requestText : requestText.replace(email, ""));
        if (email == null || sprintNumber == null) {
            BotHelper.sendMessageToTelegram(chatId,
                    "Tell me the developer email and sprint. Example: /completed_by_user_sprint dev@correo.com 1",
                    telegramClient, null);
            exit = true;
            return;
        }

        Optional<User> user = userService.findByMail(email);
        if (user.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId,
                    "I could not find user " + email + ".\n\n" + developerEmailsMessage(),
                    telegramClient, null);
            exit = true;
            return;
        }

        Optional<Sprint> sprint = sprintService.findBySprintNumber(sprintNumber);
        if (sprint.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId,
                    "I could not find Sprint " + sprintNumber + ".\n\n" + sprintOptionsMessage(),
                    telegramClient, null);
            exit = true;
            return;
        }

        Long oracleId = user.get().getOracleId();
        List<Task> completedTasks = taskService.findBySprintId(sprint.get().getSprintId()).stream()
                .filter(task -> "DONE".equalsIgnoreCase(task.getStatus()))
                .filter(task -> taskService.getAssigneesByTaskId(task.getTaskId()).stream()
                        .anyMatch(assignee -> oracleId.equals(assignee.getOracleId())))
                .sorted(Comparator.comparing(Task::getTaskName))
                .collect(Collectors.toList());

        BotHelper.sendMessageToTelegram(chatId,
                completedTasksMessage("Completed tasks for " + user.get().getName()
                        + " in " + sprint.get().getSprintName(), completedTasks),
                telegramClient, null);
        exit = true;
    }

    public void fnListAssignedTasks() {
        if (exit || requestText == null || taskService == null || userService == null) {
            return;
        }

        if (!isAssignedTasksRequest(requestText)) {
            return;
        }

        List<User> developers = loadDevelopers();
        Optional<User> requestedDeveloper = findRequestedDeveloper(requestText, developers);
        boolean askedForSpecificDeveloper = firstEmail(requestText) != null || looksLikeSpecificDeveloperRequest(requestText);

        if (askedForSpecificDeveloper && requestedDeveloper.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId,
                    "I could not find that developer.\n\n" + developerEmailsMessage(),
                    telegramClient, null);
            exit = true;
            return;
        }

        List<Task> tasks = safeTasks();
        Map<Long, Task> tasksById = tasks.stream()
                .filter(task -> task.getTaskId() != null)
                .collect(Collectors.toMap(Task::getTaskId, Function.identity(), (left, right) -> left));
        Map<Long, List<TaskAssignee>> assigneesByTask = loadAssigneesByTask();
        Map<Long, String> sprintNames = loadSprintNames();

        String message = requestedDeveloper
                .map(user -> assignedTasksForDeveloperMessage(user, tasksById, assigneesByTask, sprintNames))
                .orElseGet(() -> assignedTasksByDeveloperMessage(developers, tasksById, assigneesByTask, sprintNames));

        BotHelper.sendMessageToTelegram(chatId, message, telegramClient, null);
        exit = true;
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
            Map<Long, List<TaskAssignee>> assigneesByTask = loadAssigneesByTask();
            Map<Long, String> userLabels = loadUserLabels();
            List<Task> tasks = safeTasks();
            for (Task task : tasks) {
                String sprintName = resolveSprintName(task.getSprintId(), sprintNames);
                views.add(new TaskView(
                        task.getTaskId() == null ? 0L : task.getTaskId(),
                        task.getTaskName(),
                        normalizeStatus(task.getStatus()),
                        sprintName,
                        task.getDueDate() == null ? "No due date" : task.getDueDate().toString(),
                        assigneeNames(task.getTaskId(), assigneesByTask, userLabels)
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
                        NO_SPRINT,
                        "No due date",
                        "Unassigned"
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
        if (sprints == null) {
            return sprintNames;
        }
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
            appendTaskLine(responseText, item);
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

    private void appendTaskLine(StringBuilder responseText, TaskView item) {
        responseText.append("\n- <b>#")
                .append(item.getId())
                .append(" ")
                .append(BotHelper.escapeHtml(item.getTitle()))
                .append("</b>")
                .append("\n  Due: <code>")
                .append(BotHelper.escapeHtml(item.getDueDate()))
                .append("</code>")
                .append("\n  Assigned to: ")
                .append(BotHelper.escapeHtml(item.getAssignees()));
    }

    private List<Task> safeTasks() {
        if (taskService == null) {
            return List.of();
        }
        List<Task> tasks = taskService.findAll();
        return tasks == null ? List.of() : tasks;
    }

    private List<TaskAssignee> safeAssignees() {
        if (taskService == null) {
            return List.of();
        }
        List<TaskAssignee> assignees = taskService.getAllAssignees();
        return assignees == null ? List.of() : assignees;
    }

    private Map<Long, List<TaskAssignee>> loadAssigneesByTask() {
        return safeAssignees().stream()
                .filter(assignee -> assignee.getTaskId() != null)
                .collect(Collectors.groupingBy(TaskAssignee::getTaskId));
    }

    private Map<Long, String> loadUserLabels() {
        if (userService == null) {
            return Map.of();
        }
        List<User> users = userService.findAll();
        if (users == null) {
            return Map.of();
        }
        return users.stream()
                .filter(user -> user.getOracleId() != null)
                .collect(Collectors.toMap(User::getOracleId, this::userLabel, (left, right) -> left));
    }

    private List<User> loadDevelopers() {
        List<User> developers = userService.findByRole("DEVELOPER");
        if (developers == null || developers.isEmpty()) {
            List<User> users = userService.findAll();
            return users == null ? List.of() : users;
        }
        return developers;
    }

    private String assigneeNames(Long taskId, Map<Long, List<TaskAssignee>> assigneesByTask, Map<Long, String> userLabels) {
        if (taskId == null) {
            return "Unassigned";
        }

        List<TaskAssignee> assignees = assigneesByTask.get(taskId);
        if (assignees == null || assignees.isEmpty()) {
            return "Unassigned";
        }

        return assignees.stream()
                .map(TaskAssignee::getOracleId)
                .map(oracleId -> userLabels.getOrDefault(oracleId, "User #" + oracleId))
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .collect(Collectors.joining(", "));
    }

    private String userLabel(User user) {
        if (user == null) {
            return "Unknown user";
        }
        String name = user.getName() == null || user.getName().isBlank() ? "User #" + user.getOracleId() : user.getName();
        String mail = user.getMail() == null || user.getMail().isBlank() ? "no email" : user.getMail();
        return name + " (" + mail + ")";
    }

    private String assignedTasksByDeveloperMessage(List<User> developers, Map<Long, Task> tasksById,
            Map<Long, List<TaskAssignee>> assigneesByTask, Map<Long, String> sprintNames) {
        StringBuilder message = new StringBuilder("<b>Tasks Assigned by Developer</b>");
        if (developers == null || developers.isEmpty()) {
            return message.append("\n\n<i>No developers are registered.</i>").toString();
        }

        developers.stream()
                .sorted(Comparator.comparing(user -> valueOrEmpty(user.getName()), String.CASE_INSENSITIVE_ORDER))
                .forEach(user -> {
                    List<Task> assignedTasks = tasksAssignedTo(user.getOracleId(), tasksById, assigneesByTask);
                    message.append("\n\n<b>")
                            .append(BotHelper.escapeHtml(userLabel(user)))
                            .append("</b>")
                            .append("\nAssigned tasks: <b>")
                            .append(assignedTasks.size())
                            .append("</b>");
                    appendAssignedTaskLines(message, assignedTasks, sprintNames);
                });

        return message.toString();
    }

    private String assignedTasksForDeveloperMessage(User developer, Map<Long, Task> tasksById,
            Map<Long, List<TaskAssignee>> assigneesByTask, Map<Long, String> sprintNames) {
        List<Task> assignedTasks = tasksAssignedTo(developer.getOracleId(), tasksById, assigneesByTask);
        StringBuilder message = new StringBuilder("<b>Tasks Assigned to ")
                .append(BotHelper.escapeHtml(userLabel(developer)))
                .append("</b>")
                .append("\nAssigned tasks: <b>")
                .append(assignedTasks.size())
                .append("</b>");
        appendAssignedTaskLines(message, assignedTasks, sprintNames);
        return message.toString();
    }

    private void appendAssignedTaskLines(StringBuilder message, List<Task> tasks, Map<Long, String> sprintNames) {
        if (tasks.isEmpty()) {
            message.append("\n- No assigned tasks.");
            return;
        }

        tasks.stream()
                .sorted(Comparator.comparing(Task::getTaskName, String.CASE_INSENSITIVE_ORDER))
                .forEach(task -> message.append("\n- <b>#")
                        .append(task.getTaskId())
                        .append(" ")
                        .append(BotHelper.escapeHtml(valueOrEmpty(task.getTaskName())))
                        .append("</b>")
                        .append(" [")
                        .append(BotHelper.escapeHtml(normalizeStatus(task.getStatus())))
                        .append("]")
                        .append("\n  Sprint: ")
                        .append(BotHelper.escapeHtml(resolveSprintName(task.getSprintId(), sprintNames)))
                        .append(" | Due: <code>")
                        .append(BotHelper.escapeHtml(task.getDueDate() == null ? "No due date" : task.getDueDate().toString()))
                        .append("</code>"));
    }

    private List<Task> tasksAssignedTo(Long oracleId, Map<Long, Task> tasksById, Map<Long, List<TaskAssignee>> assigneesByTask) {
        if (oracleId == null) {
            return List.of();
        }
        return assigneesByTask.entrySet().stream()
                .filter(entry -> entry.getValue().stream().anyMatch(assignee -> oracleId.equals(assignee.getOracleId())))
                .map(entry -> tasksById.get(entry.getKey()))
                .filter(task -> task != null)
                .collect(Collectors.toList());
    }

    private Optional<User> findRequestedDeveloper(String text, List<User> developers) {
        String email = firstEmail(text);
        if (email != null) {
            Optional<User> byEmail = userService.findByMail(email);
            if (byEmail.isPresent()) {
                return byEmail;
            }
        }

        String normalizedText = " " + normalize(text) + " ";
        return developers.stream()
                .filter(user -> matchesUserMention(normalizedText, user))
                .findFirst();
    }

    private boolean matchesUserMention(String normalizedText, User user) {
        if (user.getName() != null && !user.getName().isBlank()) {
            String normalizedName = normalize(user.getName());
            if (normalizedName.length() >= 3 && normalizedText.contains(" " + normalizedName + " ")) {
                return true;
            }
            for (String part : normalizedName.split("\\s+")) {
                if (part.length() >= 3 && normalizedText.contains(" " + part + " ")) {
                    return true;
                }
            }
        }

        if (user.getMail() != null && !user.getMail().isBlank()) {
            String normalizedMail = normalize(user.getMail());
            String localPart = normalizedMail.split("@")[0];
            return normalizedText.contains(normalizedMail) || (localPart.length() >= 3 && normalizedText.contains(" " + localPart + " "));
        }
        return false;
    }

    private static class TaskView {
        private final long id;
        private final String title;
        private final String status;
        private final String sprintName;
        private final String dueDate;
        private final String assignees;

        private TaskView(long id, String title, String status, String sprintName, String dueDate, String assignees) {
            this.id = id;
            this.title = title == null ? "" : title;
            this.status = status == null ? "TODO" : status;
            this.sprintName = sprintName == null ? NO_SPRINT : sprintName;
            this.dueDate = dueDate == null ? "No due date" : dueDate;
            this.assignees = assignees == null ? "Unassigned" : assignees;
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

        private String getDueDate() {
            return dueDate;
        }

        private String getAssignees() {
            return assignees;
        }
    }

    private String valueOrEmpty(Object value) {
        return value == null ? "No data" : value.toString();
    }

    private boolean isCreateTaskCommand(String text) {
        String normalized = normalize(text);
        return normalized.startsWith(BotCommands.CREATE_TASK.getCommand())
                || normalized.startsWith("/creartarea")
                || normalized.startsWith("/create_task")
                || normalized.startsWith("create task")
                || normalized.startsWith("crear tarea")
                || normalized.equals(normalize(BotLabels.CREATE_TASK.getLabel()));
    }

    private boolean isCompletedBySprintCommand(String text) {
        String normalized = normalize(text);
        return normalized.startsWith(BotCommands.COMPLETED_BY_SPRINT.getCommand())
                || normalized.startsWith("/completadas_sprint")
                || normalized.startsWith("/completed_by_sprint")
                || normalized.startsWith("completed by sprint")
                || normalized.startsWith("completed tasks by sprint")
                || normalized.startsWith("completadas sprint")
                || normalized.equals(normalize(BotLabels.COMPLETED_BY_SPRINT.getLabel()));
    }

    private boolean isCompletedByUserSprintCommand(String text) {
        String normalized = normalize(text);
        return normalized.startsWith(BotCommands.COMPLETED_BY_USER_SPRINT.getCommand())
                || normalized.startsWith("/completadas_usuario_sprint")
                || normalized.startsWith("/completed_by_user_sprint")
                || normalized.startsWith("completed by user and sprint")
                || normalized.startsWith("completed tasks by user and sprint")
                || normalized.startsWith("completadas usuario sprint")
                || normalized.equals(normalize(BotLabels.COMPLETED_BY_USER_SPRINT.getLabel()));
    }

    private boolean isAssignedTasksRequest(String text) {
        String intent = getDetectedIntent();
        if ("LIST_ASSIGNED_TASKS".equals(intent)) {
            return true;
        }

        String normalized = normalize(text);
        boolean hasTaskNoun = normalized.contains("task")
                || normalized.contains("tasks")
                || normalized.contains("todo")
                || normalized.contains("tarea")
                || normalized.contains("tareas")
                || normalized.contains("pendiente");
        boolean hasAssignmentLanguage = normalized.contains("assigned")
                || normalized.contains("assignee")
                || normalized.contains("developer")
                || normalized.contains("developers")
                || normalized.contains("by user")
                || normalized.contains("by member")
                || normalized.contains("asignad")
                || normalized.contains("desarrollador")
                || normalized.contains("usuario");
        boolean hasListLanguage = normalized.contains("show")
                || normalized.contains("list")
                || normalized.contains("tell me")
                || normalized.contains("what")
                || normalized.contains("who")
                || normalized.contains("muestra")
                || normalized.contains("lista")
                || normalized.contains("dime")
                || normalized.contains("que");

        return hasTaskNoun && hasAssignmentLanguage && hasListLanguage;
    }

    private boolean looksLikeSpecificDeveloperRequest(String text) {
        String normalized = normalize(text);
        if (normalized.contains("each developer") || normalized.contains("every developer")
                || normalized.contains("by developer") || normalized.contains("all developers")
                || normalized.contains("cada desarrollador") || normalized.contains("por desarrollador")) {
            return false;
        }

        return normalized.contains(" assigned to ")
                || normalized.contains(" for ")
                || normalized.contains(" from ")
                || normalized.contains(" of ")
                || normalized.contains(" para ")
                || normalized.contains(" de ")
                || normalized.contains(" asignadas a ")
                || normalized.contains(" asignados a ");
    }

    private String commandPayload(String text) {
        String normalized = normalize(text);
        if (normalized.startsWith(BotCommands.CREATE_TASK.getCommand())) {
            return text.substring(BotCommands.CREATE_TASK.getCommand().length()).trim();
        }
        if (normalized.startsWith("/creartarea")) {
            return text.substring("/creartarea".length()).trim();
        }
        if (normalized.startsWith("/create_task")) {
            return text.substring("/create_task".length()).trim();
        }
        if (normalized.startsWith("create task")) {
            return text.substring("create task".length()).trim();
        }
        if (normalized.startsWith("crear tarea")) {
            return text.substring("crear tarea".length()).trim();
        }
        return "";
    }

    private Long firstNumber(String text) {
        Matcher matcher = NUMBER_PATTERN.matcher(text);
        if (!matcher.find()) {
            return null;
        }
        return Long.valueOf(matcher.group());
    }

    private String firstEmail(String text) {
        Matcher matcher = EMAIL_PATTERN.matcher(text);
        if (!matcher.find()) {
            return null;
        }
        return matcher.group();
    }

    private String completedTasksMessage(String title, List<Task> tasks) {
        StringBuilder message = new StringBuilder(title);
        if (tasks == null || tasks.isEmpty()) {
            return message.append("\n\nNo completed tasks found.").toString();
        }

        tasks.forEach(task -> message.append("\n- #")
                .append(task.getTaskId())
                .append(" ")
                .append(BotHelper.escapeHtml(valueOrEmpty(task.getTaskName())))
                .append(" (due: ")
                .append(valueOrEmpty(task.getDueDate()))
                .append(")"));
        return message.toString();
    }

    private String createTaskHelpMessage() {
        return "Send me the task in this format:\n"
                + "<code>/create_task Name | Description | 2026-06-20 | dev@correo.com | Sprint 1</code>";
    }

    private String normalize(String text) {
        if (text == null) {
            return "";
        }
        return java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .trim();
    }

}
