package com.example.strip;

import android.app.DatePickerDialog;
import android.os.Bundle;
import android.util.Log;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.example.strip.UserProfile;
import com.example.strip.ApiService;
import com.example.strip.RetrofitClient;
import com.example.strip.SessionManager;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class EditProfileActivity extends AppCompatActivity {

    private EditText etName, etAge, etDob, etPhone, etBio, etBloodGroup, etCity, etState;
    private Spinner spGender;
    private Button btnSave;
    private ImageView imgBack;
    private UserProfile userProfile;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_edit_profile);

        sessionManager = new SessionManager(this);
        initializeViews();
        loadUserData();
        setupDatePicker();

        btnSave.setOnClickListener(v -> updateProfile());
        imgBack.setOnClickListener(v -> finish());
    }

    private void initializeViews() {
        etName = findViewById(R.id.etName);
        etAge = findViewById(R.id.etAge);
        etDob = findViewById(R.id.etDob);
        etPhone = findViewById(R.id.etPhone);
        etBio = findViewById(R.id.etBio);
        etBloodGroup = findViewById(R.id.etBloodGroup);
        etCity = findViewById(R.id.etCity);
        etState = findViewById(R.id.etState);
        spGender = findViewById(R.id.spGender);
        btnSave = findViewById(R.id.btnSave);
        imgBack = findViewById(R.id.imgBack);

        // Setup gender spinner
        ArrayAdapter<CharSequence> adapter = ArrayAdapter.createFromResource(this,
                R.array.gender_array, android.R.layout.simple_spinner_item);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spGender.setAdapter(adapter);
    }

    private void setupDatePicker() {
        final Calendar calendar = Calendar.getInstance();

        DatePickerDialog.OnDateSetListener dateSetListener = (view, year, month, dayOfMonth) -> {
            calendar.set(Calendar.YEAR, year);
            calendar.set(Calendar.MONTH, month);
            calendar.set(Calendar.DAY_OF_MONTH, dayOfMonth);

            // Format as YYYY-MM-DD only (no time component)
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
            etDob.setText(dateFormat.format(calendar.getTime()));
        };

        etDob.setOnClickListener(v -> {
            new DatePickerDialog(EditProfileActivity.this, dateSetListener,
                    calendar.get(Calendar.YEAR),
                    calendar.get(Calendar.MONTH),
                    calendar.get(Calendar.DAY_OF_MONTH)).show();
        });

        // Make the field non-editable to force using date picker
        etDob.setKeyListener(null);
    }

    private void loadUserData() {
        userProfile = (UserProfile) getIntent().getSerializableExtra("userProfile");
        if (userProfile != null) {
            etName.setText(userProfile.getName());
            if (userProfile.getAge() != null) {
                etAge.setText(String.valueOf(userProfile.getAge()));
            }

            // Format date to remove time component if present
            String dob = userProfile.getDob();
            if (dob != null && dob.contains("T")) {
                dob = dob.split("T")[0];
            }
            etDob.setText(dob);

            etPhone.setText(userProfile.getPhone());
            etBio.setText(userProfile.getBio());
            etBloodGroup.setText(userProfile.getBlood_group());
            etCity.setText(userProfile.getDisplayCity());
            etState.setText(userProfile.getState());

            // Set gender spinner
            if (userProfile.getGender() != null) {
                int position = getGenderPosition(userProfile.getGender());
                spGender.setSelection(position);
            }
        }
    }

    private int getGenderPosition(String gender) {
        String[] genders = getResources().getStringArray(R.array.gender_array);
        for (int i = 0; i < genders.length; i++) {
            if (genders[i].equalsIgnoreCase(gender)) {
                return i;
            }
        }
        return 0;
    }

    private boolean validateForm() {
        boolean isValid = true;

        // Name validation
        if (etName.getText().toString().trim().isEmpty()) {
            etName.setError("Name is required");
            isValid = false;
        } else {
            etName.setError(null);
        }

        // Age validation
        String ageStr = etAge.getText().toString().trim();
        if (!ageStr.isEmpty()) {
            try {
                int age = Integer.parseInt(ageStr);
                if (age < 1 || age > 120) {
                    etAge.setError("Age must be between 1 and 120");
                    isValid = false;
                } else {
                    etAge.setError(null);
                }
            } catch (NumberFormatException e) {
                etAge.setError("Invalid age");
                isValid = false;
            }
        } else {
            etAge.setError(null);
        }

        return isValid;
    }

    private void updateProfile() {
        if (!validateForm()) {
            return;
        }

        String name = etName.getText().toString().trim();
        String ageStr = etAge.getText().toString().trim();
        String dob = etDob.getText().toString().trim();
        String gender = spGender.getSelectedItem().toString();
        String phone = etPhone.getText().toString().trim();
        String bio = etBio.getText().toString().trim();
        String bloodGroup = etBloodGroup.getText().toString().trim();
        String city = etCity.getText().toString().trim();
        String state = etState.getText().toString().trim();

        Integer age = null;
        if (!ageStr.isEmpty()) {
            try {
                age = Integer.parseInt(ageStr);
            } catch (NumberFormatException e) {
                etAge.setError("Invalid age");
                return;
            }
        }

        // Ensure date is in correct format (remove any time component)
        if (dob != null && dob.contains("T")) {
            dob = dob.split("T")[0]; // Take only the date part
        }

        // Create the request body map
        Map<String, Object> profileData = new HashMap<>();
        profileData.put("name", name);
        if (age != null) {
            profileData.put("age", age);
        } else {
            profileData.put("age", null); // Send null if age is empty
        }
        profileData.put("dob", dob); // Now it's just YYYY-MM-DD
        profileData.put("gender", gender);
        profileData.put("phone", phone != null ? phone : "");
        profileData.put("bio", bio != null ? bio : "");
        profileData.put("blood_group", bloodGroup != null ? bloodGroup : "");
        profileData.put("city", city != null ? city : "");
        profileData.put("state", state != null ? state : "");

        Log.d("EditProfile", "Sending update request for user: " + userProfile.getUser_id());
        Log.d("EditProfile", "Update data: " + profileData.toString());

        ApiService apiService = RetrofitClient.getApiService();
        Call<Map<String, Object>> call = apiService.updateProfile(userProfile.getUser_id(), profileData);

        // Show loading
        btnSave.setEnabled(false);
        btnSave.setText("Updating...");

        call.enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                btnSave.setEnabled(true);
                btnSave.setText("Save Changes");

                if (response.isSuccessful() && response.body() != null) {
                    Map<String, Object> responseBody = response.body();
                    if (responseBody.get("success").equals(true)) {
                        Toast.makeText(EditProfileActivity.this, "Profile updated successfully", Toast.LENGTH_SHORT)
                                .show();
                        setResult(RESULT_OK);
                        finish();
                    } else {
                        String error = responseBody.containsKey("error") ? responseBody.get("error").toString()
                                : "Failed to update profile";
                        Toast.makeText(EditProfileActivity.this, error, Toast.LENGTH_SHORT).show();
                        Log.e("EditProfile", "Server error: " + error);
                    }
                } else {
                    // Log the error for debugging
                    try {
                        String errorBody = response.errorBody() != null ? response.errorBody().string()
                                : "Unknown error";
                        Log.e("EditProfile", "HTTP " + response.code() + " Error: " + errorBody);
                    } catch (Exception e) {
                        Log.e("EditProfile", "Error reading error body: " + e.getMessage());
                    }
                    Toast.makeText(EditProfileActivity.this, "Failed to update profile: HTTP " + response.code(),
                            Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                btnSave.setEnabled(true);
                btnSave.setText("Save Changes");

                Log.e("EditProfile", "Network error: " + t.getMessage(), t);
                Toast.makeText(EditProfileActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}