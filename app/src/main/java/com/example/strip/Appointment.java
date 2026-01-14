package com.example.strip;

import java.io.Serializable;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

public class Appointment implements Serializable {
    private int appointment_id;
    private String doctor_name;
    private String specialization;
    private String hospital_name;
    private String appointment_date; // DATETIME format: "YYYY-MM-DD HH:MM:SS"
    private String status;
    private String symptoms;
    private String appointment_type;
    private String notes;
    private String created_at;
    private String contacted_at;
    private String expires_at;
    private String token_created_at;
    private int token_number;

    // Default constructor
    public Appointment() {
    }

    // Getters and setters
    public int getAppointment_id() {
        return appointment_id;
    }

    public void setAppointment_id(int appointment_id) {
        this.appointment_id = appointment_id;
    }

    public int getToken_number() {
        return token_number;
    }

    public void setToken_number(int token_number) {
        this.token_number = token_number;
    }

    public String getDoctor_name() {
        return doctor_name;
    }

    public void setDoctor_name(String doctor_name) {
        this.doctor_name = doctor_name;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getHospital_name() {
        return hospital_name;
    }

    public void setHospital_name(String hospital_name) {
        this.hospital_name = hospital_name;
    }

    public String getAppointment_date() {
        return appointment_date;
    }

    public void setAppointment_date(String appointment_date) {
        this.appointment_date = appointment_date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public String getCreated_at() {
        return created_at;
    }

    public void setCreated_at(String created_at) {
        this.created_at = created_at;
    }

    public String getContacted_at() {
        return contacted_at;
    }

    public void setContacted_at(String contacted_at) {
        this.contacted_at = contacted_at;
    }

    public String getExpires_at() {
        return expires_at;
    }

    public void setExpires_at(String expires_at) {
        this.expires_at = expires_at;
    }

    public String getToken_created_at() {
        return token_created_at;
    }

    public void setToken_created_at(String token_created_at) {
        this.token_created_at = token_created_at;
    }

    // Helper method to check if appointment is expired - FIXED DATE PARSING
    public boolean isExpired() {
        if ("Expired".equals(status) || "Completed".equals(status) || "Cancelled".equals(status)) {
            return true;
        }

        // Check if appointment has expired based on expiry time
        if (expires_at != null && !expires_at.isEmpty()) {
            try {
                // Handle both ISO format (2025-11-29T15:22:59.000Z) and regular format
                String formatPattern = "yyyy-MM-dd HH:mm:ss";
                if (expires_at.contains("T")) {
                    formatPattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";
                }

                SimpleDateFormat format = new SimpleDateFormat(formatPattern, Locale.getDefault());
                Date expiryDate = format.parse(expires_at);
                return new Date().after(expiryDate);
            } catch (Exception e) {
                // If parsing fails, assume not expired
                return false;
            }
        }
        return false;
    }

    // Helper method to get remaining validity in days - FIXED DATE PARSING
    public long getRemainingValidityDays() {
        if (expires_at == null || expires_at.isEmpty()) {
            return 0;
        }

        try {
            // Handle both ISO format (2025-11-29T15:22:59.000Z) and regular format
            String formatPattern = "yyyy-MM-dd HH:mm:ss";
            if (expires_at.contains("T")) {
                formatPattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";
            }

            SimpleDateFormat format = new SimpleDateFormat(formatPattern, Locale.getDefault());
            Date expiryDate = format.parse(expires_at);
            Date currentDate = new Date();

            long diffInMillis = expiryDate.getTime() - currentDate.getTime();
            if (diffInMillis <= 0)
                return 0;

            return TimeUnit.DAYS.convert(diffInMillis, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            // If parsing fails, return 0
            return 0;
        }
    }

    // Helper method to get formatted date and time - FIXED DATE PARSING
    public String getFormattedDateTime() {
        if (appointment_date == null || appointment_date.isEmpty()) {
            return "Date not specified";
        }

        try {
            // Handle different datetime formats
            String formatPattern = "yyyy-MM-dd HH:mm:ss";
            if (appointment_date.contains("T")) {
                formatPattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";
            }

            SimpleDateFormat inputFormat = new SimpleDateFormat(formatPattern, Locale.getDefault());
            Date date = inputFormat.parse(appointment_date);

            // Format date and time
            SimpleDateFormat dateFormat = new SimpleDateFormat("MMM dd, yyyy", Locale.getDefault());
            SimpleDateFormat timeFormat = new SimpleDateFormat("h:mm a", Locale.getDefault());

            return dateFormat.format(date) + " at " + timeFormat.format(date);
        } catch (Exception e) {
            // If parsing fails, return the original string
            return appointment_date;
        }
    }

    // Helper method to get expiry status message
    public String getExpiryStatus() {
        if (isExpired()) {
            return "Expired";
        }

        long remainingDays = getRemainingValidityDays();
        if (remainingDays > 0) {
            return "Valid for " + remainingDays + " day" + (remainingDays > 1 ? "s" : "");
        } else {
            return "Expires today";
        }
    }
}