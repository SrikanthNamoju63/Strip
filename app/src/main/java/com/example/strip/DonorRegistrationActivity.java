package com.example.strip;

import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DonorRegistrationActivity extends AppCompatActivity {

    private Spinner spinnerDonorBloodGroup, spinnerSmoke, spinnerAlcohol;
    private EditText etDonorName, etDonorLocation, etDonorContact, etLastDonation;
    private Button btnRegister;
    private ProgressBar progressBar;
    private SessionManager sessionManager;
    private String selectedDonorBloodGroup = "A+";
    private String selectedSmoke = "No";
    private String selectedAlcohol = "No";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_donor_registration);

        sessionManager = new SessionManager(this);
        initViews();
        setupSpinners();
        prefillUserData();
        setupDatePicker();

        btnRegister.setOnClickListener(v -> registerDonor());
    }

    private void setupDatePicker() {
        etLastDonation.setOnClickListener(v -> {
            final java.util.Calendar c = java.util.Calendar.getInstance();
            int mYear = c.get(java.util.Calendar.YEAR);
            int mMonth = c.get(java.util.Calendar.MONTH);
            int mDay = c.get(java.util.Calendar.DAY_OF_MONTH);

            android.app.DatePickerDialog datePickerDialog = new android.app.DatePickerDialog(this,
                    (view, year, monthOfYear, dayOfMonth) -> {
                        // Format: YYYY-MM-DD
                        String selectedDate = String.format(Locale.US, "%d-%02d-%02d", year, monthOfYear + 1,
                                dayOfMonth);
                        etLastDonation.setText(selectedDate);
                    }, mYear, mMonth, mDay);

            // Optional: Limit to past dates if logical (can donate in future? No, last
            // donation must be past)
            datePickerDialog.getDatePicker().setMaxDate(System.currentTimeMillis());

            datePickerDialog.show();
        });
    }

    private void initViews() {
        spinnerDonorBloodGroup = findViewById(R.id.spinnerDonorBloodGroup);
        spinnerSmoke = findViewById(R.id.spinnerSmoke);
        spinnerAlcohol = findViewById(R.id.spinnerAlcohol);
        etDonorName = findViewById(R.id.etDonorName);
        etDonorLocation = findViewById(R.id.etDonorLocation);
        etDonorContact = findViewById(R.id.etDonorContact);
        etLastDonation = findViewById(R.id.etLastDonation);
        btnRegister = findViewById(R.id.btnRegister);
        progressBar = findViewById(R.id.progressBar);
    }

    private void prefillUserData() {
        etDonorName.setText(sessionManager.getUserName());
    }

    private void setupSpinners() {
        String[] bloodGroups = { "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-" };
        ArrayAdapter<String> bloodAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, bloodGroups);
        bloodAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerDonorBloodGroup.setAdapter(bloodAdapter);

        spinnerDonorBloodGroup.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                selectedDonorBloodGroup = parent.getItemAtPosition(position).toString();
            }

            public void onNothingSelected(AdapterView<?> parent) {
            }
        });

        String[] yesNo = { "No", "Yes" };
        ArrayAdapter<String> yesNoAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, yesNo);
        yesNoAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerSmoke.setAdapter(yesNoAdapter);
        spinnerAlcohol.setAdapter(yesNoAdapter);

        spinnerSmoke.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                selectedSmoke = parent.getItemAtPosition(position).toString();
            }

            public void onNothingSelected(AdapterView<?> parent) {
            }
        });
        spinnerAlcohol.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                selectedAlcohol = parent.getItemAtPosition(position).toString();
            }

            public void onNothingSelected(AdapterView<?> parent) {
            }
        });
    }

    private void registerDonor() {
        if (!sessionManager.isLoggedIn()) {
            Toast.makeText(this, "Please login first", Toast.LENGTH_SHORT).show();
            return;
        }

        String name = etDonorName.getText().toString().trim();
        String location = etDonorLocation.getText().toString().trim();
        String contact = etDonorContact.getText().toString().trim();
        String lastDonation = etLastDonation.getText().toString().trim();

        if (TextUtils.isEmpty(name) || TextUtils.isEmpty(location) || TextUtils.isEmpty(contact)) {
            Toast.makeText(this, "All fields are required", Toast.LENGTH_SHORT).show();
            return;
        }

        if (selectedSmoke.equals("Yes") || selectedAlcohol.equals("Yes")) {
            Toast.makeText(this, "You are not eligible to donate due to lifestyle habits", Toast.LENGTH_LONG).show();
            return;
        }

        // Validate date and check 90-day gap using Date API (works on API 24)
        if (!TextUtils.isEmpty(lastDonation)) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                Date lastDate = sdf.parse(lastDonation);
                Date today = new Date();

                long diffMillis = today.getTime() - lastDate.getTime();
                long days = diffMillis / (1000 * 60 * 60 * 24);

                if (days < 90) {
                    Toast.makeText(this, "Wait 90 days before next donation", Toast.LENGTH_LONG).show();
                    return;
                }
            } catch (ParseException e) {
                Toast.makeText(this, "Invalid date format (use YYYY-MM-DD)", Toast.LENGTH_SHORT).show();
                return;
            }
        }

        String[] locParts = location.split(",");
        String city = locParts.length > 0 ? locParts[0].trim() : location;
        String state = locParts.length > 1 ? locParts[1].trim() : "";

        DonorRegistration donor = new DonorRegistration(sessionManager.getUserId(), selectedDonorBloodGroup, location,
                city, state, contact);
        donor.setSmoker(selectedSmoke);
        donor.setAlcohol_consumer(selectedAlcohol);
        donor.setLast_donation_date(lastDonation);

        showProgress(true);

        ApiService apiService = RetrofitClient.getApiService();
        Call<Map<String, Object>> call = apiService.registerDonor(donor);

        call.enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                showProgress(false);
                if (response.isSuccessful() && response.body() != null) {
                    Toast.makeText(DonorRegistrationActivity.this, "Registered successfully!", Toast.LENGTH_LONG)
                            .show();
                    finish();
                } else {
                    Toast.makeText(DonorRegistrationActivity.this, "Registration failed", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                showProgress(false);
                Toast.makeText(DonorRegistrationActivity.this, "Network Error: " + t.getMessage(), Toast.LENGTH_SHORT)
                        .show();
            }
        });
    }

    private void showProgress(boolean show) {
        progressBar.setVisibility(show ? View.VISIBLE : View.GONE);
        btnRegister.setEnabled(!show);
    }
}
