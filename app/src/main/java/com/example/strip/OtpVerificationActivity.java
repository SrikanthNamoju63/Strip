package com.example.strip;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import java.util.HashMap;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class OtpVerificationActivity extends AppCompatActivity {

    EditText etOtp;
    Button btnVerify;
    TextView tvDescription;
    String email;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_otp_verification);

        email = getIntent().getStringExtra("email");

        etOtp = findViewById(R.id.etOtp);
        btnVerify = findViewById(R.id.btnVerify);
        tvDescription = findViewById(R.id.tvDescription);

        tvDescription.setText("Enter the 6-digit code sent to " + email);

        btnVerify.setOnClickListener(v -> {
            String otp = etOtp.getText().toString().trim();

            if (otp.length() != 6) {
                etOtp.setError("Enter valid 6-digit OTP");
                return;
            }

            verifyOtp(email, otp);
        });
    }

    private void verifyOtp(String email, String otp) {
        android.widget.ProgressBar pbVerify = findViewById(R.id.pbVerify);
        LoadingUtils.showLoading(btnVerify, pbVerify);

        ApiService apiService = RetrofitClient.getApiService();
        Map<String, String> body = new HashMap<>();
        body.put("email", email);
        body.put("otp", otp);

        Call<Map<String, Object>> call = apiService.verifyOtp(body);
        call.enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                LoadingUtils.hideLoading(btnVerify, pbVerify);
                if (response.isSuccessful()) {
                    Toast.makeText(OtpVerificationActivity.this, "OTP Verified", Toast.LENGTH_SHORT).show();

                    Intent intent = new Intent(OtpVerificationActivity.this, ResetPasswordActivity.class);
                    intent.putExtra("email", email);
                    startActivity(intent);
                    finish();
                } else {
                    try {
                        String errorBody = response.errorBody().string();
                        org.json.JSONObject jsonObject = new org.json.JSONObject(errorBody);
                        String message = jsonObject.optString("message", "Invalid OTP");
                        Toast.makeText(OtpVerificationActivity.this, message, Toast.LENGTH_SHORT).show();
                    } catch (Exception e) {
                        Toast.makeText(OtpVerificationActivity.this, "Invalid OTP", Toast.LENGTH_SHORT).show();
                    }
                }
            }

            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                LoadingUtils.hideLoading(btnVerify, pbVerify);
                Toast.makeText(OtpVerificationActivity.this, "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
