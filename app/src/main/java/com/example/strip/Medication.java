package com.example.strip;

public class Medication {
    private int medication_id;
    private String medication_name;
    private String dosage;
    private String frequency;
    private String start_date;
    private String end_date;
    private String prescribed_by;

    public Medication() {}

    // Getters and setters
    public int getMedication_id() { return medication_id; }
    public void setMedication_id(int medication_id) { this.medication_id = medication_id; }

    public String getMedication_name() { return medication_name; }
    public void setMedication_name(String medication_name) { this.medication_name = medication_name; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public String getStart_date() { return start_date; }
    public void setStart_date(String start_date) { this.start_date = start_date; }

    public String getEnd_date() { return end_date; }
    public void setEnd_date(String end_date) { this.end_date = end_date; }

    public String getPrescribed_by() { return prescribed_by; }
    public void setPrescribed_by(String prescribed_by) { this.prescribed_by = prescribed_by; }
}