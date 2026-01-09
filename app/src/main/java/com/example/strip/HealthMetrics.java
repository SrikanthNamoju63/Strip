package com.example.strip;

import java.util.Date;

public class HealthMetrics {
    private int metrics_id;
    private int user_id;
    private Integer heart_rate;
    private Integer steps_count;
    private Integer calories_burned;
    private Integer sleep_hours;
    private Integer systolic_bp;
    private Integer diastolic_bp;
    private Float body_temperature;
    private Integer blood_oxygen;
    private String ai_analysis;
    private String risk_prediction;
    private Date recorded_at;

    public HealthMetrics() {}

    // Getters and setters
    public int getMetrics_id() { return metrics_id; }
    public void setMetrics_id(int metrics_id) { this.metrics_id = metrics_id; }

    public int getUser_id() { return user_id; }
    public void setUser_id(int user_id) { this.user_id = user_id; }

    public Integer getHeart_rate() { return heart_rate; }
    public void setHeart_rate(Integer heart_rate) { this.heart_rate = heart_rate; }

    public Integer getSteps_count() { return steps_count; }
    public void setSteps_count(Integer steps_count) { this.steps_count = steps_count; }

    public Integer getCalories_burned() { return calories_burned; }
    public void setCalories_burned(Integer calories_burned) { this.calories_burned = calories_burned; }

    public Integer getSleep_hours() { return sleep_hours; }
    public void setSleep_hours(Integer sleep_hours) { this.sleep_hours = sleep_hours; }

    public Integer getSystolic_bp() { return systolic_bp; }
    public void setSystolic_bp(Integer systolic_bp) { this.systolic_bp = systolic_bp; }

    public Integer getDiastolic_bp() { return diastolic_bp; }
    public void setDiastolic_bp(Integer diastolic_bp) { this.diastolic_bp = diastolic_bp; }

    public Float getBody_temperature() { return body_temperature; }
    public void setBody_temperature(Float body_temperature) { this.body_temperature = body_temperature; }

    public Integer getBlood_oxygen() { return blood_oxygen; }
    public void setBlood_oxygen(Integer blood_oxygen) { this.blood_oxygen = blood_oxygen; }

    public String getAi_analysis() { return ai_analysis; }
    public void setAi_analysis(String ai_analysis) { this.ai_analysis = ai_analysis; }

    public String getRisk_prediction() { return risk_prediction; }
    public void setRisk_prediction(String risk_prediction) { this.risk_prediction = risk_prediction; }

    public Date getRecorded_at() { return recorded_at; }
    public void setRecorded_at(Date recorded_at) { this.recorded_at = recorded_at; }
}