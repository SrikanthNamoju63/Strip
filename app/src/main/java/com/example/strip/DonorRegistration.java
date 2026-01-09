package com.example.strip;

public class DonorRegistration {
    private int user_id;
    private String blood_group;
    private String location;
    private String city;
    private String state;
    private String phone;
    private String smoker;
    private String alcohol_consumer;
    private String last_donation_date;

    public DonorRegistration() {}

    public DonorRegistration(int user_id, String blood_group, String location, String city, String state, String phone) {
        this.user_id = user_id;
        this.blood_group = blood_group;
        this.location = location;
        this.city = city;
        this.state = state;
        this.phone = phone;
    }

    public int getUser_id() { return user_id; }
    public void setUser_id(int user_id) { this.user_id = user_id; }

    public String getBlood_group() { return blood_group; }
    public void setBlood_group(String blood_group) { this.blood_group = blood_group; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSmoker() { return smoker; }
    public void setSmoker(String smoker) { this.smoker = smoker; }

    public String getAlcohol_consumer() { return alcohol_consumer; }
    public void setAlcohol_consumer(String alcohol_consumer) { this.alcohol_consumer = alcohol_consumer; }

    public String getLast_donation_date() { return last_donation_date; }
    public void setLast_donation_date(String last_donation_date) { this.last_donation_date = last_donation_date; }
}
