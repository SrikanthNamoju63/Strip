package com.example.strip;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.util.Map;

public class LoginActivity extends AppCompatActivity {

    EditText edtEmail, edtPassword;
    Button btnLogin;
    TextView txtSignup, txtForgotPassword;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        sessionManager = new SessionManager(this);

        // Check if user is already logged in
        if (sessionManager.isLoggedIn()) {
            Intent intent = new Intent(LoginActivity.this, HomeActivity.class);
            startActivity(intent);
            finish();
        }

        // Initialize views
        edtEmail = findViewById(R.id.edtEmail);
        edtPassword = findViewById(R.id.edtPassword);
        btnLogin = findViewById(R.id.btnLogin);
        txtSignup = findViewById(R.id.txtSignup);
        txtForgotPassword = findViewById(R.id.txtForgotPassword);

        // Handle Login button click
        btnLogin.setOnClickListener(v -> {
            String email = edtEmail.getText().toString().trim();
            String password = edtPassword.getText().toString().trim();

            if (TextUtils.isEmpty(email)) {
                edtEmail.setError("Please enter email");
                edtEmail.requestFocus();
                return;
            }

            if (TextUtils.isEmpty(password)) {
                edtPassword.setError("Please enter password");
                edtPassword.requestFocus();
                return;
            }

            android.widget.ProgressBar pbLogin = findViewById(R.id.pbLogin);
            LoadingUtils.showLoading(btnLogin, pbLogin);

            LoginRequest loginRequest = new LoginRequest(email, password);
            ApiService apiService = RetrofitClient.getApiService();
            Call<Map<String, Object>> call = apiService.login(loginRequest);

            call.enqueue(new Callback<Map<String, Object>>() {
                @Override
                public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                    LoadingUtils.hideLoading(btnLogin, pbLogin);

                    if (response.isSuccessful() && response.body() != null) {
                        Map<String, Object> result = response.body();
                        int userId = ((Double) result.get("userId")).intValue();
                        String name = (String) result.get("name");

                        // Handle user map if present for display_id
                        String displayId = "";
                        if (result.containsKey("user")) {
                            Map<String, Object> userMap = (Map<String, Object>) result.get("user");
                            if (userMap != null && userMap.containsKey("display_id")) {
                                displayId = (String) userMap.get("display_id");
                            }
                        }

                        // Save user session
                        sessionManager.createSession(userId, name, email, displayId);

                        Toast.makeText(LoginActivity.this, "Login Successful", Toast.LENGTH_SHORT).show();
                        Intent intent = new Intent(LoginActivity.this, HomeActivity.class);
                        startActivity(intent);
                        finish();
                    } else {
                        // Handle specific backend errors (401, 404, etc.)
                        try {
                            String errorBody = response.errorBody().string();
                            org.json.JSONObject jsonObject = new org.json.JSONObject(errorBody);
                            String errorMessage = jsonObject.optString("error", "Login failed");
                            Toast.makeText(LoginActivity.this, errorMessage, Toast.LENGTH_SHORT).show();
                        } catch (Exception e) {
                            Toast.makeText(LoginActivity.this, "Server error, try again", Toast.LENGTH_SHORT).show();
                        }
                    }
                }

                @Override
                public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                    LoadingUtils.hideLoading(btnLogin, pbLogin);

                    if (t instanceof java.io.IOException) {
                        Toast.makeText(LoginActivity.this, "No internet connection", Toast.LENGTH_SHORT).show();
                    } else {
                        Toast.makeText(LoginActivity.this, "Server not responding, try again", Toast.LENGTH_SHORT)
                                .show();
                    }
                }
            });
        });

        // Handle Signup click -> Navigate to SignupActivity
        txtSignup.setOnClickListener(v -> {
            Intent intent = new Intent(LoginActivity.this, SignupActivity.class);
            startActivity(intent);
        });

        // Handle Forgot Password click
        txtForgotPassword.setOnClickListener(v -> {
            Intent intent = new Intent(LoginActivity.this, ForgotPasswordActivity.class);
            startActivity(intent);
        });
    }
}