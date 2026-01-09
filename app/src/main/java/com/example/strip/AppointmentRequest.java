package com.example.strip;

public class AppointmentRequest {
    private int user_id;
    private String doctor_id;
    private String appointment_date;
    private String appointment_time;
    private String symptoms;
    private String appointment_type;
    private String notes;

    public AppointmentRequest() {
        // Default constructor
    }

    public AppointmentRequest(int user_id, String doctor_id, String appointment_date,
            String appointment_time, String symptoms, String appointment_type, String notes) {
        this.user_id = user_id;
        this.doctor_id = doctor_id;
        this.appointment_date = appointment_date;
        this.appointment_time = appointment_time;
        this.symptoms = symptoms;
        this.appointment_type = appointment_type;
        this.notes = notes;
    }

    // Getters and setters
    public int getUser_id() {
        return user_id;
    }

    public void setUser_id(int user_id) {
        this.user_id = user_id;
    }

    public String getDoctor_id() {
        return doctor_id;
    }

    public void setDoctor_id(String doctor_id) {
        this.doctor_id = doctor_id;
    }

    public String getAppointment_date() {
        return appointment_date;
    }

    public void setAppointment_date(String appointment_date) {
        this.appointment_date = appointment_date;
    }

    public String getAppointment_time() {
        return appointment_time;
    }

    public void setAppointment_time(String appointment_time) {
        this.appointment_time = appointment_time;
    }

    public String getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(String symptoms) {
        this.symptoms = symptoms;
    }

    public String getAppointment_type() {
        return appointment_type;
    }

    public void setAppointment_type(String appointment_type) {
        this.appointment_type = appointment_type;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}