package com.example.strip;

import android.app.DatePickerDialog;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class BloodDonationActivity extends AppCompatActivity {

    private Spinner spinnerBloodGroup;
    private EditText etDonateDate, etPlace;
    private Button btnSaveDonation;
    private RecyclerView rvHistory;
    private SessionManager sessionManager;
    private String[] bloodGroups = { "Select", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-" };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_blood_donation);

        sessionManager = new SessionManager(this);
        initViews();
        setupSpinner();
        setupDatePicker();
        fetchHistory();

        btnSaveDonation.setOnClickListener(v -> saveDonation());
    }

    private void initViews() {
        spinnerBloodGroup = findViewById(R.id.spinnerBloodGroup);
        etDonateDate = findViewById(R.id.etDonateDate);
        etPlace = findViewById(R.id.etPlace);
        btnSaveDonation = findViewById(R.id.btnSaveDonation);
        rvHistory = findViewById(R.id.rvHistory);
        rvHistory.setLayoutManager(new LinearLayoutManager(this));
    }

    private void setupSpinner() {
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, bloodGroups);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerBloodGroup.setAdapter(adapter);
    }

    private void setupDatePicker() {
        etDonateDate.setOnClickListener(v -> {
            Calendar c = Calendar.getInstance();
            int mYear = c.get(Calendar.YEAR);
            int mMonth = c.get(Calendar.MONTH);
            int mDay = c.get(Calendar.DAY_OF_MONTH);

            DatePickerDialog datePickerDialog = new DatePickerDialog(this,
                    (view, year, monthOfYear, dayOfMonth) -> {
                        String selectedDate = String.format(Locale.US, "%d-%02d-%02d", year, monthOfYear + 1,
                                dayOfMonth);
                        etDonateDate.setText(selectedDate);
                    }, mYear, mMonth, mDay);
            datePickerDialog.getDatePicker().setMaxDate(System.currentTimeMillis());
            datePickerDialog.show();
        });
    }

    private void saveDonation() {
        String bg = spinnerBloodGroup.getSelectedItem().toString();
        String date = etDonateDate.getText().toString();
        String place = etPlace.getText().toString();
        int userId = sessionManager.getUserId();

        if (bg.equals("Select")) {
            Toast.makeText(this, "Select Blood Group", Toast.LENGTH_SHORT).show();
            return;
        }
        if (date.isEmpty()) {
            Toast.makeText(this, "Select Date", Toast.LENGTH_SHORT).show();
            return;
        }

        Map<String, Object> map = new HashMap<>();
        map.put("user_id", userId);
        map.put("blood_group", bg);
        map.put("donated_date", date);
        map.put("place", place);

        ApiService apiService = RetrofitClient.getApiService();
        apiService.addDonationHistory(map).enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    if (Boolean.TRUE.equals(response.body().get("success"))) {
                        Toast.makeText(BloodDonationActivity.this, "History Saved!", Toast.LENGTH_SHORT).show();
                        etDonateDate.setText("");
                        etPlace.setText("");
                        fetchHistory(); // Refresh list
                    } else {
                        String error = (String) response.body().get("error");
                        Toast.makeText(BloodDonationActivity.this, error, Toast.LENGTH_LONG).show();
                    }
                }
            }

            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                Toast.makeText(BloodDonationActivity.this, "Network Error", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void fetchHistory() {
        ApiService apiService = RetrofitClient.getApiService();
        apiService.getDonationHistory(sessionManager.getUserId()).enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<BloodHistory> historyList = new ArrayList<>();
                    // Parse response
                    Object data = response.body().get("history");
                    if (data instanceof List) {
                        List<?> list = (List<?>) data;
                        for (Object obj : list) {
                            if (obj instanceof Map) {
                                Map<String, Object> item = (Map<String, Object>) obj;
                                String date = (String) item.get("donated_date");
                                String bg = (String) item.get("blood_group");
                                String place = (String) item.get("place");
                                historyList.add(new BloodHistory(date, bg, place));
                            }
                        }
                    } else {
                        // Try parsing directly if Gson handled it differently (List<BloodHistory>)
                        // But since we use Map<String, Object> in call, manual parsing is safer
                    }

                    BloodHistoryAdapter adapter = new BloodHistoryAdapter(BloodDonationActivity.this, historyList);
                    rvHistory.setAdapter(adapter);
                }
            }

            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                // Log error
            }
        });
    }
}
