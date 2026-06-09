package com.springboot.MyTodoList.productivity;

public class KpiExplanation {
    private final String key;
    private final String label;
    private final String description;
    private final String formula;

    public KpiExplanation(String key, String label, String description, String formula) {
        this.key = key;
        this.label = label;
        this.description = description;
        this.formula = formula;
    }

    public String getKey() { return key; }
    public String getLabel() { return label; }
    public String getDescription() { return description; }
    public String getFormula() { return formula; }
}
