package com.example.strip;

public class Allergy {
    private int allergy_id;
    private String allergy_name;
    private String severity;
    private String symptoms;

    public Allergy() {}

    // Getters and setters
    public int getAllergy_id() { return allergy_id; }
    public void setAllergy_id(int allergy_id) { this.allergy_id = allergy_id; }

    public String getAllergy_name() { return allergy_name; }
    public void setAllergy_name(String allergy_name) { this.allergy_name = allergy_name; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }
}