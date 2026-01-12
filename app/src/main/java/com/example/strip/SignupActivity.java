package com.example.strip;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.util.Map;

public class SignupActivity extends AppCompatActivity {

    private EditText edtName, edtEmail, edtPassword, edtDob;
    private Button btnSignUp;
    private TextView txtLogin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_signup);

        // Initialize Views
        edtName = findViewById(R.id.edtName);
        edtEmail = findViewById(R.id.edtEmail);
        edtPassword = findViewById(R.id.edtPassword);
        edtDob = findViewById(R.id.edtDob);
        btnSignUp = findViewById(R.id.btnSignUp);
        txtLogin = findViewById(R.id.txtLogin);

        // Date Picker for DOB
        edtDob.setOnClickListener(v -> {
            java.util.Calendar calendar = java.util.Calendar.getInstance();
            int year = calendar.get(java.util.Calendar.YEAR);
            int month = calendar.get(java.util.Calendar.MONTH);
            int day = calendar.get(java.util.Calendar.DAY_OF_MONTH);

            android.app.DatePickerDialog datePickerDialog = new android.app.DatePickerDialog(
                    SignupActivity.this,
                    (view, year1, month1, dayOfMonth) -> {
                        // Format: YYYY-MM-DD
                        String date = year1 + "-" + String.format("%02d", (month1 + 1)) + "-"
                                + String.format("%02d", dayOfMonth);
                        edtDob.setText(date);
                    }, year, month, day);
            datePickerDialog.show();
        });

        // Sign Up Button Click
        btnSignUp.setOnClickListener(v -> {
            String name = edtName.getText().toString().trim();
            String email = edtEmail.getText().toString().trim();
            String password = edtPassword.getText().toString().trim();
            String dob = edtDob.getText().toString().trim();

            if (name.isEmpty()) {
                edtName.setError("Please enter name");
                edtName.requestFocus();
                return;
            }

            if (email.isEmpty()) {
                edtEmail.setError("Please enter email");
                edtEmail.requestFocus();
                return;
            }

            if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                edtEmail.setError("Enter valid email address");
                edtEmail.requestFocus();
                return;
            }

            if (password.isEmpty()) {
                edtPassword.setError("Please enter password");
                edtPassword.requestFocus();
                return;
            }

            if (password.length() < 6) {
                edtPassword.setError("Password must be at least 6 characters");
                edtPassword.requestFocus();
                return;
            }

            if (dob.isEmpty()) {
                edtDob.setError("Please select date of birth");
                edtDob.requestFocus();
                return;
            }

            android.widget.ProgressBar pbSignUp = findViewById(R.id.pbSignUp);
            LoadingUtils.showLoading(btnSignUp, pbSignUp);

            // Create user object (Age is null, calculated from DOB)
            User user = new User(name, email, password, null, dob, null);

            // Call API
            ApiService apiService = RetrofitClient.getApiService();
            Call<Map<String, Object>> call = apiService.signup(user);

            call.enqueue(new Callback<Map<String, Object>>() {
                @Override
                public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                    LoadingUtils.hideLoading(btnSignUp, pbSignUp);

                    if (response.isSuccessful() && response.body() != null) {
                        Map<String, Object> result = response.body();
                        Toast.makeText(SignupActivity.this,
                                "Account created successfully!", Toast.LENGTH_SHORT).show();

                        // Navigate to Login Activity
                        Intent intent = new Intent(SignupActivity.this, LoginActivity.class);
                        startActivity(intent);
                        finish();
                    } else {
                        try {
                            String errorBody = response.errorBody().string();
                            org.json.JSONObject jsonObject = new org.json.JSONObject(errorBody);
                            String errorMessage = jsonObject.optString("error", "Signup failed");
                            Toast.makeText(SignupActivity.this, errorMessage, Toast.LENGTH_SHORT).show();
                        } catch (Exception e) {
                            Toast.makeText(SignupActivity.this, "Server error, try again", Toast.LENGTH_SHORT).show();
                        }
                    }
                }

                @Override
                public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                    LoadingUtils.hideLoading(btnSignUp, pbSignUp);
                    if (t instanceof java.io.IOException) {
                        Toast.makeText(SignupActivity.this, "Check your internet connection", Toast.LENGTH_SHORT)
                                .show();
                    } else {
                        Toast.makeText(SignupActivity.this, "Server error: " + t.getMessage(), Toast.LENGTH_SHORT)
                                .show();
                    }
                }
            });
        });

        // Login Text Click → Go to LoginActivity
        txtLogin.setOnClickListener(v -> {
            // Clear session to prevent auto-redirect to HomeActivity
            new SessionManager(SignupActivity.this).logout();
            Intent intent = new Intent(SignupActivity.this, LoginActivity.class);
            startActivity(intent);
            finish();
        });
    }
}