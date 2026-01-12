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

    private androidx.viewpager2.widget.ViewPager2 bannerViewPager;
    private android.os.Handler bannerHandler = new android.os.Handler();
    private Runnable bannerRunnable;

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
        bannerViewPager = findViewById(R.id.bannerViewPager);

        // Health Options
        optionBloodFinder = (LinearLayout) ((LinearLayout) findViewById(R.id.healthOptions)).getChildAt(0);
        optionHealthPredict = (LinearLayout) ((LinearLayout) findViewById(R.id.healthOptions)).getChildAt(1);
        optionDoctorAppointment = (LinearLayout) ((LinearLayout) findViewById(R.id.healthOptions)).getChildAt(2);

        // Bottom Navigation
        navHome = (LinearLayout) ((LinearLayout) findViewById(R.id.bottomNav)).getChildAt(0);
        navInsurance = (LinearLayout) ((LinearLayout) findViewById(R.id.bottomNav)).getChildAt(1);
        navSettings = (LinearLayout) ((LinearLayout) findViewById(R.id.bottomNav)).getChildAt(2);

        // Set Click Listeners with Navigation
        imgProfile.setOnClickListener(v -> startActivity(new Intent(HomeActivity.this, ProfileActivity.class)));

        btnSearch.setOnClickListener(v -> {
            String query = edtSearch.getText().toString().trim();
            Intent intent = new Intent(HomeActivity.this, SearchResultsActivity.class);
            intent.putExtra("QUERY", query); // Pass
                                             // query
                                             // if
                                             // needed
            startActivity(intent);
        });

        optionBloodFinder
                .setOnClickListener(v -> startActivity(new Intent(HomeActivity.this, BloodFinderActivity.class)));
        optionHealthPredict
                .setOnClickListener(v -> startActivity(new Intent(HomeActivity.this, HealthPredictActivity.class)));
        optionDoctorAppointment.setOnClickListener(
                v -> startActivity(new Intent(HomeActivity.this, AppointmentBookingActivity.class)));

        navInsurance.setOnClickListener(v -> startActivity(new Intent(HomeActivity.this, InsuranceActivity.class)));
        navSettings.setOnClickListener(v -> startActivity(new Intent(HomeActivity.this, SettingsActivity.class)));

        // Request Location
        getCurrentLocation();

        // Setup Banners
        setupBanners();
    }

    private void setupBanners() {
        ApiService apiService = RetrofitClient.getApiService();
        retrofit2.Call<java.util.Map<String, Object>> call = apiService.getBanners();
        call.enqueue(new retrofit2.Callback<java.util.Map<String, Object>>() {
            @Override
            public void onResponse(retrofit2.Call<java.util.Map<String, Object>> call,
                    retrofit2.Response<java.util.Map<String, Object>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    try {
                        Object dataObj = response.body().get("data");
                        String json = new com.google.gson.Gson().toJson(dataObj);
                        java.lang.reflect.Type listType = new com.google.gson.reflect.TypeToken<java.util.List<Banner>>() {
                        }.getType();
                        java.util.List<Banner> banners = new com.google.gson.Gson().fromJson(json, listType);

                        if (banners != null && !banners.isEmpty()) {
                            BannerAdapter adapter = new BannerAdapter(banners);
                            bannerViewPager.setAdapter(adapter);

                            // Auto Scroll Logic
                            bannerRunnable = new Runnable() {
                                @Override
                                public void run() {
                                    if (bannerViewPager.getAdapter() != null) {
                                        int currentItem = bannerViewPager.getCurrentItem();
                                        int totalItems = bannerViewPager.getAdapter().getItemCount();
                                        int nextItem = (currentItem + 1) % totalItems;
                                        bannerViewPager.setCurrentItem(nextItem, true);
                                        bannerHandler.postDelayed(this, 3000); // 3
                                                                               // seconds
                                                                               // delay
                                    }
                                }
                            };
                            bannerHandler.postDelayed(bannerRunnable, 3000);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }

            @Override
            public void onFailure(retrofit2.Call<java.util.Map<String, Object>> call, Throwable t) {
                // Fail silently or show fallback
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (bannerHandler != null && bannerRunnable != null) {
            bannerHandler.removeCallbacks(bannerRunnable);
        }
    }

    private void getCurrentLocation() {
        if (androidx.core.app.ActivityCompat.checkSelfPermission(this,
                android.Manifest.permission.ACCESS_FINE_LOCATION) != android.content.pm.PackageManager.PERMISSION_GRANTED
                && androidx.core.app.ActivityCompat.checkSelfPermission(this,
                        android.Manifest.permission.ACCESS_COARSE_LOCATION) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            androidx.core.app.ActivityCompat.requestPermissions(this,
                    new String[] { android.Manifest.permission.ACCESS_FINE_LOCATION,
                            android.Manifest.permission.ACCESS_COARSE_LOCATION },
                    100);
            return;
        }

        com.google.android.gms.location.FusedLocationProviderClient fusedLocationClient = com.google.android.gms.location.LocationServices
                .getFusedLocationProviderClient(this);
        fusedLocationClient.getLastLocation().addOnSuccessListener(this, location -> {
            if (location != null) {
                getAddress(location.getLatitude(), location.getLongitude());
            } else {
                txtLocation.setText("Location not found");
                // Ideally request new location update here if null
            }
        });
    }

    private void getAddress(double lat, double lon) {
        new Thread(() -> {
            // Priority 1: Native Android Geocoder
            try {
                android.location.Geocoder geocoder = new android.location.Geocoder(this, java.util.Locale.getDefault());
                java.util.List<android.location.Address> addresses = geocoder.getFromLocation(lat, lon, 1);

                if (addresses != null && !addresses.isEmpty()) {
                    android.location.Address address = addresses.get(0);

                    String feature = address.getSubLocality();
                    if (feature == null)
                        feature = address.getThoroughfare();
                    if (feature == null)
                        feature = address.getFeatureName();

                    String city = address.getLocality();
                    if (city == null)
                        city = address.getSubAdminArea();

                    String state = address.getAdminArea();
                    String pincode = address.getPostalCode();

                    StringBuilder locBuilder = new StringBuilder();
                    if (feature != null)
                        locBuilder.append(feature).append(", ");
                    if (city != null)
                        locBuilder.append(city).append(", ");
                    if (state != null)
                        locBuilder.append(state);
                    if (pincode != null)
                        locBuilder.append(" - ").append(pincode);

                    String locationText = locBuilder.toString();

                    if (locationText.length() > 5) {
                        runOnUiThread(() -> txtLocation.setText("Current Location:\n" + locationText));
                        return; // Success
                    }
                }
            } catch (Exception e) {
                // Native failed, proceeding to fallbacks
            }

            // Priority 2: BigDataCloud API (Very reliable, no key needed)
            if (fetchAddressFromAPI(lat, lon, "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" + lat
                    + "&longitude=" + lon + "&localityLanguage=en", true))
                return;

            // Priority 3: Nominatim (OSM)
            if (fetchAddressFromAPI(lat, lon,
                    "https://nominatim.openstreetmap.org/reverse?format=json&lat=" + lat + "&lon=" + lon, false))
                return;

            // Final Fallback: Raw Coordinates
            runOnUiThread(() -> txtLocation.setText("Current Location:\n" + lat + ", " + lon));
        }).start();
    }

    // Helper for API calls
    private boolean fetchAddressFromAPI(double lat, double lon, String url, boolean isBigData) {
        try {
            okhttp3.OkHttpClient client = new okhttp3.OkHttpClient();
            okhttp3.Request.Builder requestBuilder = new okhttp3.Request.Builder().url(url);

            if (!isBigData) {
                requestBuilder.header("User-Agent", "StripApp/1.0"); // Required for Nominatim
            }

            okhttp3.Request request = requestBuilder.build();

            try (okhttp3.Response response = client.newCall(request).execute()) {
                if (response.isSuccessful() && response.body() != null) {
                    String jsonData = response.body().string();
                    org.json.JSONObject json = new org.json.JSONObject(jsonData);

                    String locationText = "";

                    if (isBigData) {
                        String city = json.optString("locality", json.optString("city", ""));
                        String state = json.optString("principalSubdivision", "");
                        String postcode = json.optString("postcode", "");

                        // Fallback if locality is empty (common in rural areas)
                        if (city.isEmpty()) {
                            org.json.JSONArray localityInfo = json.optJSONArray("localityInfo");
                            if (localityInfo != null) {
                                // Try to find administrative/place names in info
                                // Simplified: just check if we have city/town keys in a real implementation
                            }
                        }

                        StringBuilder sb = new StringBuilder();
                        if (!city.isEmpty())
                            sb.append(city).append(", ");
                        if (!state.isEmpty())
                            sb.append(state);
                        if (!postcode.isEmpty())
                            sb.append(" - ").append(postcode);
                        locationText = sb.toString();

                    } else {
                        // Nominatim structure
                        org.json.JSONObject address = json.optJSONObject("address");
                        if (address != null) {
                            String village = address.optString("village",
                                    address.optString("suburb", address.optString("hamlet", "")));
                            String city = address.optString("city",
                                    address.optString("town", address.optString("county", "")));
                            String state = address.optString("state", "");
                            String postcode = address.optString("postcode", "");

                            StringBuilder sb = new StringBuilder();
                            if (!village.isEmpty())
                                sb.append(village).append(", ");
                            if (!city.isEmpty())
                                sb.append(city).append(", ");
                            if (!state.isEmpty())
                                sb.append(state);
                            if (!postcode.isEmpty())
                                sb.append(" - ").append(postcode);
                            locationText = sb.toString();
                        }
                    }

                    if (locationText.length() > 5) {
                        String finalLoc = locationText;
                        runOnUiThread(() -> txtLocation.setText("Current Location:\n" + finalLoc));
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @androidx.annotation.NonNull String[] permissions,
            @androidx.annotation.NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 100) {
            if (grantResults.length > 0 && grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                getCurrentLocation();
            } else {
                android.widget.Toast.makeText(this, "Permission denied", android.widget.Toast.LENGTH_SHORT).show();
            }
        }
    }
}