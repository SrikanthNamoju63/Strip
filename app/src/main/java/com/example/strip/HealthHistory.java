package com.example.strip;

public class HealthHistory {
    private int history_id;
    private String condition_name;
    private String description;
    private String recorded_at;

    public HealthHistory() {}

    // Getters and setters
    public int getHistory_id() { return history_id; }
    public void setHistory_id(int history_id) { this.history_id = history_id; }

    public String getCondition_name() { return condition_name; }
    public void setCondition_name(String condition_name) { this.condition_name = condition_name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getRecorded_at() { return recorded_at; }
    public void setRecorded_at(String recorded_at) { this.recorded_at = recorded_at; }
}