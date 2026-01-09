package com.example.strip;

public class HealthDocument {
    private int document_id;
    private String document_type;
    private String document_name;
    private String document_url;
    private String uploaded_date;
    private String description;
    private String uploaded_at;

    public HealthDocument() {}

    // Getters and setters
    public int getDocument_id() { return document_id; }
    public void setDocument_id(int document_id) { this.document_id = document_id; }

    public String getDocument_type() { return document_type; }
    public void setDocument_type(String document_type) { this.document_type = document_type; }

    public String getDocument_name() { return document_name; }
    public void setDocument_name(String document_name) { this.document_name = document_name; }

    public String getDocument_url() { return document_url; }
    public void setDocument_url(String document_url) { this.document_url = document_url; }

    public String getUploaded_date() { return uploaded_date; }
    public void setUploaded_date(String uploaded_date) { this.uploaded_date = uploaded_date; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getUploaded_at() { return uploaded_at; }
    public void setUploaded_at(String uploaded_at) { this.uploaded_at = uploaded_at; }
}