package com.example.strip;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class BloodFinderActivity extends AppCompatActivity {

    private Spinner spinnerBloodGroup;
    private EditText etLocation;
    private Button btnSearch, btnRegisterDonor;
    private ListView lvDonors;
    private TextView tvNoDonors;
    private ProgressBar progressBar;

    private String selectedBloodGroup = "A+";
    private List<Donor> donorList; // This should reference your main Donor class
    private DonorAdapter donorAdapter;
    private static final int LOCATION_PERMISSION_REQUEST = 101;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_blood_finder);

        initViews();
        setupSpinners();
        setupListView();
        setupButtonListeners();

        requestLocationPermission();
    }

    private void initViews() {
        spinnerBloodGroup = findViewById(R.id.spinnerBloodGroup);
        etLocation = findViewById(R.id.etLocation);
        btnSearch = findViewById(R.id.btnSearch);
        btnRegisterDonor = findViewById(R.id.btnRegisterDonor);
        lvDonors = findViewById(R.id.lvDonors);
        tvNoDonors = findViewById(R.id.tvNoDonors);
        progressBar = findViewById(R.id.progressBar);
    }

    private void setupSpinners() {
        String[] bloodGroups = { "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-" };
        ArrayAdapter<String> adapter = new ArrayAdapter<>(
                this, android.R.layout.simple_spinner_item, bloodGroups);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinnerBloodGroup.setAdapter(adapter);

        spinnerBloodGroup.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                selectedBloodGroup = parent.getItemAtPosition(position).toString();
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
                selectedBloodGroup = "A+";
            }
        });
    }

    private void setupListView() {
        donorList = new ArrayList<>();
        donorAdapter = new DonorAdapter(this, donorList);
        lvDonors.setAdapter(donorAdapter);
        updateDonorsListVisibility();

        lvDonors.setOnItemClickListener((parent, view, position, id) -> {
            Donor donor = donorList.get(position);
            Toast.makeText(this, "Selected: " + donor.getName(), Toast.LENGTH_SHORT).show();
        });
    }

    private void setupButtonListeners() {
        btnSearch.setOnClickListener(v -> searchDonors());

        btnRegisterDonor.setOnClickListener(v -> {
            Intent intent = new Intent(BloodFinderActivity.this, DonorRegistrationActivity.class);
            startActivity(intent);
        });
    }

    private void searchDonors() {
        String location = etLocation.getText().toString().trim();
        String bloodGroup = selectedBloodGroup;

        if (location.isEmpty()) {
            Toast.makeText(this, "Please enter a location to search", Toast.LENGTH_SHORT).show();
            return;
        }

        showProgress(true);

        ApiService apiService = RetrofitClient.getApiService();
        Call<List<Donor>> call = apiService.searchDonors(bloodGroup, location);

        call.enqueue(new Callback<List<Donor>>() {
            @Override
            public void onResponse(Call<List<Donor>> call, Response<List<Donor>> response) {
                showProgress(false);
                if (response.isSuccessful() && response.body() != null) {
                    List<Donor> donors = response.body();
                    displayDonors(donors);

                    String message = donors.isEmpty() ? "No donors found for " + bloodGroup + " in " + location
                            : "Found " + donors.size() + " donor(s)";
                    Toast.makeText(BloodFinderActivity.this, message, Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(BloodFinderActivity.this, "Search failed", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<Donor>> call, Throwable t) {
                showProgress(false);
                Toast.makeText(BloodFinderActivity.this,
                        "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void displayDonors(List<Donor> donors) {
        donorList.clear();
        donorList.addAll(donors);
        donorAdapter.notifyDataSetChanged();
        updateDonorsListVisibility();
    }

    private void updateDonorsListVisibility() {
        if (donorList.isEmpty()) {
            lvDonors.setVisibility(View.GONE);
            tvNoDonors.setVisibility(View.VISIBLE);
        } else {
            lvDonors.setVisibility(View.VISIBLE);
            tvNoDonors.setVisibility(View.GONE);
        }
    }

    private void showProgress(boolean show) {
        progressBar.setVisibility(show ? View.VISIBLE : View.GONE);
    }

    private void requestLocationPermission() {
        if (ContextCompat.checkSelfPermission(this,
                Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[] { Manifest.permission.ACCESS_FINE_LOCATION },
                    LOCATION_PERMISSION_REQUEST);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
            @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == LOCATION_PERMISSION_REQUEST) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "Location permission granted", Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(this, "Location permission denied. Some features may not work properly.",
                        Toast.LENGTH_LONG).show();
            }
        }
    }

    // Custom Adapter for Donor List
    public class DonorAdapter extends ArrayAdapter<Donor> {
        public DonorAdapter(BloodFinderActivity context, List<Donor> donors) {
            super(context, R.layout.item_donor, donors);
        }

        @NonNull
        @Override
        public View getView(int position, View convertView, @NonNull android.view.ViewGroup parent) {
            if (convertView == null) {
                convertView = android.view.LayoutInflater.from(getContext())
                        .inflate(R.layout.item_donor, parent, false);
            }

            Donor donor = getItem(position);

            TextView tvBloodGroup = convertView.findViewById(R.id.tvBloodGroup);
            TextView tvDonorName = convertView.findViewById(R.id.tvDonorName);
            TextView tvLocation = convertView.findViewById(R.id.tvLocation);
            View ivCall = convertView.findViewById(R.id.ivCall);

            if (donor != null) {
                tvBloodGroup.setText(donor.getBlood_group());
                tvDonorName.setText(donor.getName());

                String location = donor.getCity();
                if (donor.getState() != null && !donor.getState().isEmpty()) {
                    location += ", " + donor.getState();
                }
                tvLocation.setText(location);

                // Call functionality
                ivCall.setOnClickListener(v -> {
                    if (donor.getPhone() != null && !donor.getPhone().isEmpty()) {
                        Intent intent = new Intent(Intent.ACTION_DIAL);
                        intent.setData(android.net.Uri.parse("tel:" + donor.getPhone()));
                        startActivity(intent);
                    } else {
                        Toast.makeText(getContext(), "Phone number not available", Toast.LENGTH_SHORT).show();
                    }
                });
            }

            return convertView;
        }
    }
}