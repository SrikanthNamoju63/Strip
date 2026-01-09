package com.example.strip;

import android.content.Context;
import android.content.SharedPreferences;

public class SessionManager {
    private static final String PREF_NAME = "UserSession";
    private static final String KEY_USER_ID = "user_id";
    private static final String KEY_USER_NAME = "user_name";
    private static final String KEY_USER_EMAIL = "user_email";
    private static final String KEY_IS_LOGGED_IN = "is_logged_in";

    private SharedPreferences prefs;
    private SharedPreferences.Editor editor;
    private Context context;

    public SessionManager(Context context) {
        this.context = context;
        prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        editor = prefs.edit();
    }

    public void createSession(int userId, String name, String email) {
        editor.putInt(KEY_USER_ID, userId);
        editor.putString(KEY_USER_NAME, name);
        editor.putString(KEY_USER_EMAIL, email);
        editor.putBoolean(KEY_IS_LOGGED_IN, true);
        editor.apply();
    }

    public int getUserId() {
        return prefs.getInt(KEY_USER_ID, -1);
    }

    public String getUserName() {
        return prefs.getString(KEY_USER_NAME, "");
    }

    public String getUserEmail() {
        return prefs.getString(KEY_USER_EMAIL, "");
    }

    public boolean isLoggedIn() {
        return prefs.getBoolean(KEY_IS_LOGGED_IN, false);
    }

    public void logout() {
        editor.clear();
        editor.apply();
    }

    // Additional utility methods for better session management

    public void setUserProfile(String key, String value) {
        editor.putString(key, value);
        editor.apply();
    }

    public String getUserProfile(String key, String defaultValue) {
        return prefs.getString(key, defaultValue);
    }

    public void setInt(String key, int value) {
        editor.putInt(key, value);
        editor.apply();
    }

    public int getInt(String key, int defaultValue) {
        return prefs.getInt(key, defaultValue);
    }

    public void setBoolean(String key, boolean value) {
        editor.putBoolean(key, value);
        editor.apply();
    }

    public boolean getBoolean(String key, boolean defaultValue) {
        return prefs.getBoolean(key, defaultValue);
    }

    public void removeKey(String key) {
        editor.remove(key);
        editor.apply();
    }

    public boolean containsKey(String key) {
        return prefs.contains(key);
    }

    public void clearSession() {
        editor.clear();
        editor.apply();
    }

    // Method to check if it's the first time app launch
    public boolean isFirstTimeLaunch() {
        return prefs.getBoolean("is_first_time", true);
    }

    public void setFirstTimeLaunch(boolean isFirstTime) {
        editor.putBoolean("is_first_time", isFirstTime);
        editor.apply();
    }

    // Method to save user login token (if needed in future)
    public void saveAuthToken(String token) {
        editor.putString("auth_token", token);
        editor.apply();
    }

    public String getAuthToken() {
        return prefs.getString("auth_token", null);
    }

    // Method to save user role (if you implement roles in future)
    public void saveUserRole(String role) {
        editor.putString("user_role", role);
        editor.apply();
    }

    public String getUserRole() {
        return prefs.getString("user_role", "user");
    }

    // Method to check if user has completed profile
    public boolean isProfileComplete() {
        return prefs.getBoolean("profile_complete", false);
    }

    public void setProfileComplete(boolean complete) {
        editor.putBoolean("profile_complete", complete);
        editor.apply();
    }

    // Method to save last login timestamp
    public void saveLastLogin(long timestamp) {
        editor.putLong("last_login", timestamp);
        editor.apply();
    }

    public long getLastLogin() {
        return prefs.getLong("last_login", 0);
    }

    // Method to check if session is expired (optional)
    public boolean isSessionExpired() {
        long lastLogin = getLastLogin();
        long currentTime = System.currentTimeMillis();
        // Session expires after 7 days (adjust as needed)
        return (currentTime - lastLogin) > (7 * 24 * 60 * 60 * 1000);
    }

    // Method to automatically logout if session expired
    public void checkAndHandleExpiredSession() {
        if (isLoggedIn() && isSessionExpired()) {
            logout();
            // You can show a message or redirect to login page here
            // For example, using a broadcast or callback
        }
    }
}