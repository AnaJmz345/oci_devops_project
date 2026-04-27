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
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
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
    String detectedIntent;

    public BotActions(TelegramClient tc, ToDoItemService ts, DeepSeekService ds,
            NaturalLanguageIntentService nlIntentService, TaskService taskSvc,
            TaskNaturalLanguageService taskNlService, TelegramTaskDraftService taskDraftService,
            UserService usrService){
        telegramClient = tc;
        todoService = ts;
        deepSeekService = ds;
        naturalLanguageIntentService = nlIntentService;
        taskService = taskSvc;
        taskNaturalLanguageService = taskNlService;
        telegramTaskDraftService = taskDraftService;
        userService = usrService;
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
        if (!(requestText.equals(BotCommands.TODO_LIST.getCommand())
				|| requestText.equals(BotLabels.LIST_ALL_ITEMS.getLabel())
				|| requestText.equals(BotLabels.MY_TODO_LIST.getLabel())) || exit)
            return;

        List<ToDoItem> allItems = todoService.findAll();
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

        List<ToDoItem> activeItems = allItems.stream().filter(item -> "TODO".equalsIgnoreCase(item.getDone()))
                .collect(Collectors.toList());

        StringBuilder responseText = new StringBuilder("Aqui estan todas tus tareas:");

        if (activeItems.isEmpty() && allItems.stream().noneMatch(item -> "DONE".equalsIgnoreCase(item.getDone()))) {
            responseText.append("\n\nNo tienes tareas registradas.");
        }

        if (!activeItems.isEmpty()) {
            responseText.append("\n\nPendientes:");
        }

        for (ToDoItem item : activeItems) {
            responseText.append("\n- ")
                    .append(item.getDescription())
                    .append(" [TODO]");

            KeyboardRow currentRow = new KeyboardRow();
            currentRow.add(item.getDescription());
            currentRow.add(item.getID() + BotLabels.DASH.getLabel() + BotLabels.DONE.getLabel());
            keyboard.add(currentRow);
        }

        List<ToDoItem> doneItems = allItems.stream().filter(item -> "DONE".equalsIgnoreCase(item.getDone()))
                .collect(Collectors.toList());

        if (!doneItems.isEmpty()) {
            responseText.append("\n\nCompletadas:");
        }

        for (ToDoItem item : doneItems) {
            responseText.append("\n- ")
                    .append(item.getDescription())
                    .append(" [DONE]");

            KeyboardRow currentRow = new KeyboardRow();
            currentRow.add(item.getDescription());
            currentRow.add(item.getID() + BotLabels.DASH.getLabel() + BotLabels.UNDO.getLabel());
            currentRow.add(item.getID() + BotLabels.DASH.getLabel() + BotLabels.DELETE.getLabel());
            keyboard.add(currentRow);
        }

        KeyboardRow mainScreenRowBottom = new KeyboardRow();
        mainScreenRowBottom.add(BotLabels.SHOW_MAIN_SCREEN.getLabel());
        keyboard.add(mainScreenRowBottom);

        keyboardMarkup.setKeyboard(keyboard);

        BotHelper.sendMessageToTelegram(chatId, responseText.toString(), telegramClient,  keyboardMarkup);
        exit = true;
    }

    public void fnAddItem(){
        if (!(requestText.contains(BotCommands.ADD_ITEM.getCommand())
				|| requestText.contains(BotLabels.ADD_NEW_ITEM.getLabel())) || exit )
            return;

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
        if (!(requestText.contains(BotCommands.LLM_REQ.getCommand())) || exit)
            return;
        
        String prompt = "Dame los datos del clima en mty";
        String out = "<empty>";
        try{
            out = deepSeekService.generateText(prompt);
        }catch(Exception exc){

        }

        BotHelper.sendMessageToTelegram(chatId, "LLM: "+out, telegramClient, null);
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
            logger.error("No se pudo crear la tarea desde lenguaje natural", exc);
            BotHelper.sendMessageToTelegram(chatId,
                    "No pude crear la tarea. Revisa los datos e intenta otra vez.",
                    telegramClient, null);
            exit = true;
        }
    }

    private void handleTaskDraft(Long chatKey, TaskDraft draft) {
        if (draft == null) {
            BotHelper.sendMessageToTelegram(chatId,
                    "No pude entender los datos de la tarea. Intentemos de nuevo: como se llama la tarea?",
                    telegramClient, null);
            return;
        }

        if (!draft.isComplete()) {
            telegramTaskDraftService.saveDraft(chatKey, draft);
            BotHelper.sendMessageToTelegram(chatId, draft.nextMissingQuestion(), telegramClient, null);
            return;
        }

        Optional<User> assignee = userService.findByMail(draft.getAssigneeEmail());
        if (assignee.isEmpty()) {
            draft.setAssigneeEmail(null);
            telegramTaskDraftService.saveDraft(chatKey, draft);
            BotHelper.sendMessageToTelegram(chatId,
                    "No encontre un developer con ese correo. Enviame otro correo de developer.",
                    telegramClient, null);
            return;
        }

        createTask(draft, assignee.get());
        telegramTaskDraftService.clearDraft(chatKey);
    }

    private void createTask(TaskDraft draft, User assignee) {
        Task task = new Task();
        task.setTaskName(draft.getTaskName());
        task.setDescription(draft.getDescription());
        task.setDueDate(draft.getDueDate());
        task.setSprintId(draft.getSprintId());
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

        BotHelper.sendMessageToTelegram(
                chatId,
                "Tarea creada:\n- " + savedTask.getTaskName()
                        + "\nDescripcion: " + valueOrEmpty(savedTask.getDescription())
                        + "\nFecha de entrega: " + savedTask.getDueDate()
                        + "\nSprint: " + valueOrEmpty(savedTask.getSprintId())
                        + "\nAsignada a: " + assignee.getName() + " (" + assignee.getMail() + ")",
                telegramClient,
                null
        );
    }

    private String valueOrEmpty(Object value) {
        return value == null ? "Sin dato" : value.toString();
    }

}
