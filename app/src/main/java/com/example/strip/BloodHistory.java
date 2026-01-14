package com.example.strip;

public class BloodHistory {
    private String _id;
    private int user_id;
    private String blood_group;
    private String donated_date;
    private String place;

    public BloodHistory(String donated_date, String blood_group, String place) {
        this.donated_date = donated_date;
        this.blood_group = blood_group;
        this.place = place;
    }

    public String getBlood_group() {
        return blood_group;
    }

    public String getDonated_date() {
        return donated_date;
    }

    public String getPlace() {
        return place;
    }
}
