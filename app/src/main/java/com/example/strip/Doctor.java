package com.example.strip;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

public class Doctor implements Serializable {
    @SerializedName("doctor_id")
    private String doctor_id;

    @SerializedName("doctor_name")
    private String doctor_name;

    @SerializedName("specialization")
    private String specialization_name;

    @SerializedName("hospital_name")
    private String hospital_name;

    @SerializedName("experience_years")
    private int experience;

    @SerializedName("consultation_fee")
    private double fees;

    @SerializedName("education")
    private String education;

    @SerializedName("languages")
    private String languages;

    @SerializedName("rating")
    private double rating;

    @SerializedName("total_reviews")
    private int total_reviews;

    // New fields for search functionality
    private String hospital_city;
    private String hospital_state;
    private String hospital_landmark;
    private String search_keywords;
    private String profile_image;

    public Doctor() {
        // Default constructor
    }

    // Getters and setters for new fields
    public String getHospital_city() {
        return hospital_city;
    }

    public void setHospital_city(String hospital_city) {
        this.hospital_city = hospital_city;
    }

    public String getHospital_state() {
        return hospital_state;
    }

    public void setHospital_state(String hospital_state) {
        this.hospital_state = hospital_state;
    }

    public String getHospital_landmark() {
        return hospital_landmark;
    }

    public void setHospital_landmark(String hospital_landmark) {
        this.hospital_landmark = hospital_landmark;
    }

    public String getSearch_keywords() {
        return search_keywords;
    }

    public void setSearch_keywords(String search_keywords) {
        this.search_keywords = search_keywords;
    }

    public String getProfile_image() {
        return profile_image;
    }

    public void setProfile_image(String profile_image) {
        this.profile_image = profile_image;
    }

    // Existing getters and setters
    public String getDoctor_id() {
        return doctor_id;
    }

    public void setDoctor_id(String doctor_id) {
        this.doctor_id = doctor_id;
    }

    public String getDoctor_name() {
        return doctor_name;
    }

    public void setDoctor_name(String doctor_name) {
        this.doctor_name = doctor_name;
    }

    public String getSpecialization_name() {
        return specialization_name;
    }

    public void setSpecialization_name(String specialization_name) {
        this.specialization_name = specialization_name;
    }

    public String getHospital_name() {
        return hospital_name;
    }

    public void setHospital_name(String hospital_name) {
        this.hospital_name = hospital_name;
    }

    public int getExperience() {
        return experience;
    }

    public void setExperience(int experience) {
        this.experience = experience;
    }

    public double getFees() {
        return fees;
    }

    public void setFees(double fees) {
        this.fees = fees;
    }

    public String getEducation() {
        return education;
    }

    public void setEducation(String education) {
        this.education = education;
    }

    public String getLanguages() {
        return languages;
    }

    public void setLanguages(String languages) {
        this.languages = languages;
    }

    public double getRating() {
        return rating;
    }

    public void setRating(double rating) {
        this.rating = rating;
    }

    public int getTotal_reviews() {
        return total_reviews;
    }

    public void setTotal_reviews(int total_reviews) {
        this.total_reviews = total_reviews;
    }
}