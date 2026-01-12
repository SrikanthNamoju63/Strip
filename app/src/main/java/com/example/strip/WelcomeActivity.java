package com.example.strip;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class WelcomeActivity extends AppCompatActivity {

    Button btnGetStarted;
    TextView txtLoginLink;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Check Login State
        SessionManager sessionManager = new SessionManager(this);
        if (sessionManager.isLoggedIn()) {
            Intent intent = new Intent(WelcomeActivity.this, HomeActivity.class);
            startActivity(intent);
            finish(); // Close Welcome
            return;
        }

        setContentView(R.layout.activity_welcome);

        // Initialize Views
        btnGetStarted = findViewById(R.id.btnGetStarted);
        txtLoginLink = findViewById(R.id.txtLoginLink);

        // Handle "Get Started" Button click → Open SignupActivity
        btnGetStarted.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(WelcomeActivity.this, SignupActivity.class);
                startActivity(intent);
            }
        });

        // Handle "Log in" Text click → Open LoginActivity
        txtLoginLink.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(WelcomeActivity.this, SignupActivity.class);
                startActivity(intent);
            }
        });
    }
}
