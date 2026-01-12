package com.example.strip;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import java.util.HashMap;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ResetPasswordActivity extends AppCompatActivity {

    EditText etNewPassword, etConfirmPassword;
    Button btnReset;
    String email;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_reset_password);

        email = getIntent().getStringExtra("email");

        etNewPassword = findViewById(R.id.etNewPassword);
        etConfirmPassword = findViewById(R.id.etConfirmPassword);
        btnReset = findViewById(R.id.btnReset);

        btnReset.setOnClickListener(v -> {
            String newPass = etNewPassword.getText().toString().trim();
            String confirmPass = etConfirmPassword.getText().toString().trim();

            if (newPass.length() < 6) {
                etNewPassword.setError("Password must be at least 6 characters");
                return;
            }

            if (!newPass.equals(confirmPass)) {
                etConfirmPassword.setError("Passwords do not match");
                return;
            }

            resetPassword(email, newPass);
        });
    }

    private void resetPassword(String email, String newPassword) {
        android.widget.ProgressBar pbReset = findViewById(R.id.pbReset);
        LoadingUtils.showLoading(btnReset, pbReset);

        ApiService apiService = RetrofitClient.getApiService();
        Map<String, String> body = new HashMap<>();
        body.put("email", email);
        body.put("newPassword", newPassword);

        Call<Map<String, Object>> call = apiService.resetPassword(body);
        call.enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                LoadingUtils.hideLoading(btnReset, pbReset);
                if (response.isSuccessful()) {
                    Toast.makeText(ResetPasswordActivity.this, "Password updated successfully", Toast.LENGTH_LONG)
                            .show();

                    // Go to Login
                    Intent intent = new Intent(ResetPasswordActivity.this, LoginActivity.class);
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(intent);
                } else {
                    Toast.makeText(ResetPasswordActivity.this, "Failed to reset password", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                LoadingUtils.hideLoading(btnReset, pbReset);
                Toast.makeText(ResetPasswordActivity.this, "Network error", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
