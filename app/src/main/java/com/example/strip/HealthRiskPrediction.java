package com.example.strip;

import java.util.Date;

public class HealthRiskPrediction {
    private int prediction_id;
    private int user_id;
    private String predicted_risks;
    private String risk_level;
    private String prevention_plan;
    private String recommendations;
    private Date predicted_at;
    private Date valid_until;

    public HealthRiskPrediction() {}

    // Getters and setters
    public int getPrediction_id() { return prediction_id; }
    public void setPrediction_id(int prediction_id) { this.prediction_id = prediction_id; }

    public int getUser_id() { return user_id; }
    public void setUser_id(int user_id) { this.user_id = user_id; }

    public String getPredicted_risks() { return predicted_risks; }
    public void setPredicted_risks(String predicted_risks) { this.predicted_risks = predicted_risks; }

    public String getRisk_level() { return risk_level; }
    public void setRisk_level(String risk_level) { this.risk_level = risk_level; }

    public String getPrevention_plan() { return prevention_plan; }
    public void setPrevention_plan(String prevention_plan) { this.prevention_plan = prevention_plan; }

    public String getRecommendations() { return recommendations; }
    public void setRecommendations(String recommendations) { this.recommendations = recommendations; }

    public Date getPredicted_at() { return predicted_at; }
    public void setPredicted_at(Date predicted_at) { this.predicted_at = predicted_at; }

    public Date getValid_until() { return valid_until; }
    public void setValid_until(Date valid_until) { this.valid_until = valid_until; }
}