package com.example.strip;

public class PopularLocation {
    private String location;
    private int doctor_count;

    public PopularLocation() {
        // Default constructor
    }

    // Getters and setters
    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public int getDoctor_count() {
        return doctor_count;
    }

    public void setDoctor_count(int doctor_count) {
        this.doctor_count = doctor_count;
    }
}