package com.example.strip;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AppointmentBookingActivity extends AppCompatActivity {

    private EditText etLocation, etSymptoms;
    private RadioGroup rgAppointmentType;
    private Button btnFindDoctor;

    private static final String TAG = "AppointmentBooking";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_appointment_booking);

        etLocation = findViewById(R.id.etLocation);
        etSymptoms = findViewById(R.id.etSymptoms);
        rgAppointmentType = findViewById(R.id.rgAppointmentType);
        btnFindDoctor = findViewById(R.id.btnFindDoctor);

        btnFindDoctor.setOnClickListener(v -> {
            String location = etLocation.getText().toString().trim();
            String symptoms = etSymptoms.getText().toString().trim();

            int selectedId = rgAppointmentType.getCheckedRadioButtonId();
            if (selectedId == -1) {
                Toast.makeText(AppointmentBookingActivity.this, "Please select appointment type", Toast.LENGTH_SHORT)
                        .show();
                return;
            }

            RadioButton radioButton = findViewById(selectedId);
            String appointmentType = radioButton.getText().toString();

            if (symptoms.isEmpty()) {
                Toast.makeText(AppointmentBookingActivity.this, "Please describe your symptoms", Toast.LENGTH_SHORT)
                        .show();
                return;
            }

            // Use the new search API with location and keywords
            searchDoctors(location, symptoms, appointmentType);
        });
    }

    private void searchDoctors(String location, String symptoms, String appointmentType) {
        Log.d(TAG, "Searching doctors for location: " + location + ", symptoms: " + symptoms);

        ApiService apiService = RetrofitClient.getApiService();
        Call<List<Doctor>> call = apiService.searchDoctors(location, symptoms, null);

        call.enqueue(new Callback<List<Doctor>>() {
            @Override
            public void onResponse(Call<List<Doctor>> call, Response<List<Doctor>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<Doctor> doctors = response.body();
                    Log.d(TAG, "API returned " + doctors.size() + " doctors");

                    if (doctors.isEmpty()) {
                        Toast.makeText(AppointmentBookingActivity.this,
                                "No doctors found for your criteria. Please try different symptoms or location.",
                                Toast.LENGTH_LONG).show();
                        return;
                    }

                    Log.d(TAG, "Starting DoctorListActivity with " + doctors.size() + " doctors");

                    Intent intent = new Intent(AppointmentBookingActivity.this, DoctorListActivity.class);
                    intent.putExtra("location", location);
                    intent.putExtra("symptoms", symptoms);
                    intent.putExtra("appointmentType", appointmentType);
                    intent.putExtra("doctors", new ArrayList<>(doctors));

                    startActivity(intent);
                    Log.d(TAG, "DoctorListActivity started successfully");
                } else {
                    Log.e(TAG, "API error: " + response.code());
                    Toast.makeText(AppointmentBookingActivity.this,
                            "No doctors found for your criteria. Please try different symptoms.", Toast.LENGTH_SHORT)
                            .show();
                }
            }

            @Override
            public void onFailure(Call<List<Doctor>> call, Throwable t) {
                Log.e(TAG, "Network error: " + t.getMessage());
                Toast.makeText(AppointmentBookingActivity.this,
                        "Error searching doctors. Please check your internet connection.", Toast.LENGTH_SHORT).show();
            }
        });
    }
}