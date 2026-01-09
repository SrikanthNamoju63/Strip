package com.example.strip;

import android.content.Intent;
import android.os.Bundle;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class HomeActivity extends AppCompatActivity {

    // Declare UI components
    private ImageView imgProfile, btnSearch;
    private EditText edtSearch;
    private TextView txtLocation;

    private LinearLayout optionBloodFinder, optionHealthPredict, optionDoctorAppointment;
    private LinearLayout navHome, navInsurance, navSettings;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        // Handle edge insets
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Initialize UI components
        imgProfile = findViewById(R.id.imgProfile);
        btnSearch = findViewById(R.id.btnSearch);
        edtSearch = findViewById(R.id.edtSearch);
        txtLocation = findViewById(R.id.txtLocation);

        // Health Options
        optionBloodFinder = (LinearLayout) ((LinearLayout) findViewById(R.id.healthOptions)).getChildAt(0);
        optionHealthPredict = (LinearLayout) ((LinearLayout) findViewById(R.id.healthOptions)).getChildAt(1);
        optionDoctorAppointment = (LinearLayout) ((LinearLayout) findViewById(R.id.healthOptions)).getChildAt(2);

        // Bottom Navigation
        navHome = (LinearLayout) ((LinearLayout) findViewById(R.id.bottomNav)).getChildAt(0);
        navInsurance = (LinearLayout) ((LinearLayout) findViewById(R.id.bottomNav)).getChildAt(1);
        navSettings = (LinearLayout) ((LinearLayout) findViewById(R.id.bottomNav)).getChildAt(2);

        // Set Click Listeners with Navigation
        imgProfile.setOnClickListener(v -> {
            startActivity(new Intent(HomeActivity.this, ProfileActivity.class));
        });

        btnSearch.setOnClickListener(v -> {
            String query = edtSearch.getText().toString().trim();
            // Search functionality would need to be implemented
            startActivity(new Intent(HomeActivity.this, SearchResultsActivity.class));
        });

        optionBloodFinder.setOnClickListener(v -> {
            startActivity(new Intent(HomeActivity.this, BloodFinderActivity.class));
        });

        optionHealthPredict.setOnClickListener(v -> {
            startActivity(new Intent(HomeActivity.this, HealthPredictActivity.class));
        });

        optionDoctorAppointment.setOnClickListener(v -> {
            startActivity(new Intent(HomeActivity.this, AppointmentBookingActivity.class));
        });

        navHome.setOnClickListener(v -> {
            // Already on home, do nothing or refresh
        });

        navInsurance.setOnClickListener(v -> {
            startActivity(new Intent(HomeActivity.this, InsuranceActivity.class));
        });

        navSettings.setOnClickListener(v -> {
            startActivity(new Intent(HomeActivity.this, SettingsActivity.class));
        });
    }
}