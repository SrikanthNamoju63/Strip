package com.example.strip;

import android.content.Intent;
import android.os.Bundle;
import android.util.Patterns;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import java.util.HashMap;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ForgotPasswordActivity extends AppCompatActivity {

    EditText etEmail;
    Button btnSendOtp;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_forgot_password);

        etEmail = findViewById(R.id.etEmail);
        btnSendOtp = findViewById(R.id.btnSendOtp);

        btnSendOtp.setOnClickListener(v -> {
            String email = etEmail.getText().toString().trim();

            if (email.isEmpty()) {
                etEmail.setError("Enter your email");
                etEmail.requestFocus();
                return;
            }

            if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                etEmail.setError("Enter valid registered email");
                etEmail.requestFocus();
                return;
            }

            sendOtp(email);
        });
    }

    private void sendOtp(String email) {
        android.widget.ProgressBar pbSendOtp = findViewById(R.id.pbSendOtp);
        LoadingUtils.showLoading(btnSendOtp, pbSendOtp);

        ApiService apiService = RetrofitClient.getApiService();
        Map<String, String> body = new HashMap<>();
        body.put("email", email);

        Call<Map<String, Object>> call = apiService.forgotPassword(body);
        call.enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                LoadingUtils.hideLoading(btnSendOtp, pbSendOtp);
                if (response.isSuccessful() && response.body() != null) {
                    Toast.makeText(ForgotPasswordActivity.this, "OTP sent to your email", Toast.LENGTH_SHORT).show();

                    Intent intent = new Intent(ForgotPasswordActivity.this, OtpVerificationActivity.class);
                    intent.putExtra("email", email);
                    startActivity(intent);
                    finish(); // Close this so user can't go back easily
                } else {
                    try {
                        String errorBody = response.errorBody().string();
                        org.json.JSONObject jsonObject = new org.json.JSONObject(errorBody);
                        String message = jsonObject.optString("message", "Failed to send OTP");
                        Toast.makeText(ForgotPasswordActivity.this, message, Toast.LENGTH_SHORT).show();
                    } catch (Exception e) {
                        Toast.makeText(ForgotPasswordActivity.this, "Account not found", Toast.LENGTH_SHORT).show();
                    }
                }
            }

            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                LoadingUtils.hideLoading(btnSendOtp, pbSendOtp);
                Toast.makeText(ForgotPasswordActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT)
                        .show();
            }
        });
    }
}
