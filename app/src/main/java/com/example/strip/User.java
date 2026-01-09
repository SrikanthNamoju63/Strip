package com.example.strip;

public class User {
    private String name;
    private String email;
    private String password;
    private Integer age;
    private String dob;
    private String gender;

    public User() {
        // Default constructor required for Retrofit
    }

    public User(String name, String email, String password, Integer age, String dob, String gender) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.age = age;
        this.dob = dob;
        this.gender = gender;
    }

    // Getters and setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getDob() {
        return dob;
    }

    public void setDob(String dob) {
        this.dob = dob;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }
}