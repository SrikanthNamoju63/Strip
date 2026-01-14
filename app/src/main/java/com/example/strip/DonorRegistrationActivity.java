package com.example.strip;

import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DonorRegistrationActivity extends AppCompatActivity {

    private static final String[] BLOOD_GROUPS = { "Select", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-" };
    private Spinner spinnerDonorBloodGroup, spinnerSmoke, spinnerAlcohol;
    private EditText etDonorName, etDonorLocation, etDonorContact, etLastDonation, etAge;
    private CheckBox cbFirstTimeDonor;
    private Button btnRegister;
    private ProgressBar progressBar;
    private SessionManager sessionManager;
    private String selectedDonorBloodGroup = "Select";
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
        setupLastDonationPicker();
        setupFirstTimeCheckbox();

        btnRegister.setOnClickListener(v -> registerDonor());
    }

    private void initViews() {
        spinnerDonorBloodGroup = findViewById(R.id.spinnerDonorBloodGroup);
        spinnerSmoke = findViewById(R.id.spinnerSmoke);
        spinnerAlcohol = findViewById(R.id.spinnerAlcohol);

        etDonorName = findViewById(R.id.etDonorName);
        etDonorLocation = findViewById(R.id.etDonorLocation);
        etDonorContact = findViewById(R.id.etDonorContact);
        etAge = findViewById(R.id.etAge);
        etLastDonation = findViewById(R.id.etLastDonation);
        cbFirstTimeDonor = findViewById(R.id.cbFirstTimeDonor);

        btnRegister = findViewById(R.id.btnRegister);
        progressBar = findViewById(R.id.progressBar);
    }

    private void setupFirstTimeCheckbox() {
        cbFirstTimeDonor.setOnCheckedChangeListener((buttonView, isChecked) -> {
            if (isChecked) {
                etLastDonation.setText("");
                etLastDonation.setEnabled(false);
                etLastDonation.setAlpha(0.5f);
                etLastDonation.setHint("First Time Donor");
            } else {
                etLastDonation.setEnabled(true);
                etLastDonation.setAlpha(1.0f);
                etLastDonation.setHint("Select Date");
            }
        });
    }

    private void setupLastDonationPicker() {
        etLastDonation.setOnClickListener(v -> showDatePicker(etLastDonation));
    }

    private void showDatePicker(final EditText dateField) {
        final Calendar c = Calendar.getInstance();
        int mYear = c.get(Calendar.YEAR);
        int mMonth = c.get(Calendar.MONTH);
        int mDay = c.get(Calendar.DAY_OF_MONTH);

        android.app.DatePickerDialog datePickerDialog = new android.app.DatePickerDialog(this,
                (view, year, monthOfYear, dayOfMonth) -> {
                    String selectedDate = String.format(Locale.US, "%d-%02d-%02d", year, monthOfYear + 1, dayOfMonth);
                    dateField.setText(selectedDate);
                    dateField.setError(null);
                }, mYear, mMonth, mDay);

        datePickerDialog.getDatePicker().setMaxDate(System.currentTimeMillis());
        datePickerDialog.show();
    }

    private void prefillUserData() {
        etDonorName.setText(sessionManager.getUserName());
        fetchProfileData();
    }

    private void setupSpinners() {
        ArrayAdapter<String> bloodAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item,
                BLOOD_GROUPS);
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

        if (selectedDonorBloodGroup.equals("Select")) {
            Toast.makeText(this, "Please select a Blood Group", Toast.LENGTH_SHORT).show();
            return;
        }

        String name = etDonorName.getText().toString().trim();
        String location = etDonorLocation.getText().toString().trim();
        String contact = etDonorContact.getText().toString().trim();
        String ageStr = etAge.getText().toString().trim();
        String lastDonation = etLastDonation.getText().toString().trim();
        boolean isFirstTime = cbFirstTimeDonor.isChecked();

        // 1. Full Name Validation
        if (TextUtils.isEmpty(name) || name.length() < 3) {
            etDonorName.setError("Name must be at least 3 letters");
            etDonorName.requestFocus();
            return;
        }

        // 2. City Validation
        if (TextUtils.isEmpty(location)) {
            etDonorLocation.setError("City is required");
            etDonorLocation.requestFocus();
            return;
        }

        // 3. Phone Validation (10 digits)
        if (TextUtils.isEmpty(contact)) {
            etDonorContact.setError("Phone number required");
            etDonorContact.requestFocus();
            return;
        }
        if (!contact.matches("[6-9][0-9]{9}")) {
            etDonorContact.setError("Enter valid 10-digit mobile number");
            etDonorContact.requestFocus();
            return;
        }

        // 4. Age Validation (18-65)
        if (TextUtils.isEmpty(ageStr)) {
            etAge.setError("Age required");
            etAge.requestFocus();
            return;
        }
        int age = 0;
        try {
            age = Integer.parseInt(ageStr);
        } catch (NumberFormatException e) {
            etAge.setError("Invalid age");
            return;
        }

        if (age < 18) {
            etAge.setError("Must be 18+");
            return;
        }
        if (age > 65) {
            etAge.setError("Age limit is 65");
            return;
        }

        // 5. Last Donation & Gap Validation
        if (!isFirstTime) {
            if (TextUtils.isEmpty(lastDonation)) {
                etLastDonation.setError("Select last donation date");
                Toast.makeText(this, "If not first time, select last donation date", Toast.LENGTH_SHORT).show();
                return;
            }
            if (isFutureDate(lastDonation)) {
                etLastDonation.setError("Future date not allowed");
                return;
            }
            if (!isSixMonthsCompleted(lastDonation)) {
                etLastDonation.setError("Gap must be 6 months");
                Toast.makeText(this, "You can donate only after 6 months from last donation", Toast.LENGTH_LONG).show();
                return;
            }
        } else {
            lastDonation = null; // Clear if first time
        }

        // 6. Lifestyle (Smoke/Alcohol)
        if (selectedSmoke.equals("Yes") || selectedAlcohol.equals("Yes")) {
            Toast.makeText(this, "You are not eligible to donate due to lifestyle habits", Toast.LENGTH_LONG).show();
            return;
        }

        // Data Preparation
        String[] locParts = location.split(",");
        String city = locParts.length > 0 ? locParts[0].trim() : location;
        String state = locParts.length > 1 ? locParts[1].trim() : "";

        DonorRegistration donor = new DonorRegistration(sessionManager.getUserId(), selectedDonorBloodGroup, location,
                city, state, contact);
        donor.setAge(age);
        donor.setSmoker(selectedSmoke);
        donor.setAlcohol_consumer(selectedAlcohol);
        donor.setLast_donation_date(lastDonation);

        // API Call
        showProgress(true);
        ApiService apiService = RetrofitClient.getApiService();
        Call<Map<String, Object>> call = apiService.registerDonor(donor);

        call.enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                showProgress(false);
                if (response.isSuccessful() && response.body() != null) {
                    Toast.makeText(DonorRegistrationActivity.this, "Donor Registered Successfully ❤️",
                            Toast.LENGTH_LONG).show();
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

    // Helper: 6 Months Gap
    private boolean isSixMonthsCompleted(String lastDonationDate) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
            Date lastDate = sdf.parse(lastDonationDate);
            Date today = new Date();

            Calendar cal = Calendar.getInstance();
            cal.setTime(lastDate);
            cal.add(Calendar.MONTH, 6);

            Date eligibleDate = cal.getTime();

            // Eligible if today is AFTER or EQUAL to eligibleDate
            return !today.before(eligibleDate);

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // Helper: isFutureDate
    private boolean isFutureDate(String dateStr) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
            Date date = sdf.parse(dateStr);
            Date today = new Date();
            return date.after(today);
        } catch (Exception e) {
            return false;
        }
    }

    private void showProgress(boolean show) {
        progressBar.setVisibility(show ? View.VISIBLE : View.GONE);
        btnRegister.setEnabled(!show);
    }

    private void fetchProfileData() {
        showProgress(true);
        ApiService apiService = RetrofitClient.getApiService();
        apiService.getProfile(sessionManager.getUserId()).enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                showProgress(false);
                if (response.isSuccessful() && response.body() != null) {
                    Map<String, Object> body = response.body();
                    if (Boolean.TRUE.equals(body.get("success"))) {
                        Map<String, Object> data = (Map<String, Object>) body.get("data");
                        if (data != null) {
                            populateFields(data);
                        }
                    }
                }
            }

            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                showProgress(false);
                // Fail silently or log
            }
        });
    }

    private void populateFields(Map<String, Object> data) {
        // Name
        if (data.get("name") != null) {
            etDonorName.setText((String) data.get("name"));
        }

        // Phone
        if (data.get("phone") != null) {
            etDonorContact.setText((String) data.get("phone"));
        }

        // Age
        if (data.get("age") != null) {
            etAge.setText(String.valueOf(((Number) data.get("age")).intValue()));
        }

        // Location (City, State)
        String city = (String) data.get("city");
        String state = (String) data.get("state");
        String location = "";
        if (city != null)
            location = city;
        if (state != null && !state.isEmpty()) {
            if (!location.isEmpty())
                location += ", ";
            location += state;
        }
        if (!location.isEmpty()) {
            etDonorLocation.setText(location);
        }

        // Blood Group
        String bg = (String) data.get("blood_group");
        if (bg != null) {
            for (int i = 0; i < BLOOD_GROUPS.length; i++) {
                if (BLOOD_GROUPS[i].equalsIgnoreCase(bg)) {
                    spinnerDonorBloodGroup.setSelection(i);
                    break;
                }
            }
        }
    }
}
