package com.example.strip;

import java.io.Serializable;
import java.util.List;

public class UserProfile implements Serializable {
    private int user_id;
    private String display_id;
    private String name;
    private Integer age;
    private String dob;
    private String gender;
    private String email;
    private String profile_image;
    private String city;
    private String phone;
    private String bio;
    private String blood_group;
    private String profile_city;
    private String state;
    private List<Appointment> appointments;

    // Default constructor
    public UserProfile() {}

    // Getters and setters
    public int getUser_id() { return user_id; }
    public void setUser_id(int user_id) { this.user_id = user_id; }

    public String getDisplay_id() { return display_id; }
    public void setDisplay_id(String display_id) { this.display_id = display_id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getProfile_image() { return profile_image; }
    public void setProfile_image(String profile_image) { this.profile_image = profile_image; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getBlood_group() { return blood_group; }
    public void setBlood_group(String blood_group) { this.blood_group = blood_group; }

    public String getProfile_city() { return profile_city; }
    public void setProfile_city(String profile_city) { this.profile_city = profile_city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public List<Appointment> getAppointments() { return appointments; }
    public void setAppointments(List<Appointment> appointments) { this.appointments = appointments; }

    // Helper method to get formatted user ID
    public String getFormattedUserId() {
        if (display_id != null && !display_id.isEmpty()) {
            return display_id;
        }
        return String.format("%06d", user_id);
    }

    // Helper method to get display city
    public String getDisplayCity() {
        if (profile_city != null && !profile_city.isEmpty()) {
            return profile_city;
        }
        return city != null ? city : "Not set";
    }
}