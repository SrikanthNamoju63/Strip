package com.example.strip;

import android.app.DatePickerDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.engine.DiskCacheStrategy;
import com.example.strip.UserProfile;
import com.example.strip.ApiService;
import com.example.strip.RetrofitClient;
import com.example.strip.SessionManager;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class EditProfileActivity extends AppCompatActivity {

    private EditText etName, etAge, etDob, etPhone, etBio, etBloodGroup, etCity, etState;
    private Spinner spGender;
    private Button btnSave;
    private ImageView imgBack, imgProfile;
    private CardView cardProfileImage;
    private UserProfile userProfile;
    private SessionManager sessionManager;
    private Uri selectedImageUri;

    private static final int PICK_IMAGE_REQUEST = 101;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_edit_profile);

        sessionManager = new SessionManager(this);
        initializeViews();
        loadUserData();
        setupDatePicker();

        btnSave.setOnClickListener(v -> updateProfile());
        imgBack.setOnClickListener(v -> finish());
        cardProfileImage.setOnClickListener(v -> openImagePicker());
    }

    private void initializeViews() {
        etName = findViewById(R.id.etName);
        etAge = findViewById(R.id.etAge);
        etDob = findViewById(R.id.etDob);
        etPhone = findViewById(R.id.etPhone);
        etBio = findViewById(R.id.etBio);
        etBloodGroup = findViewById(R.id.etBloodGroup);
        etCity = findViewById(R.id.etCity);
        etState = findViewById(R.id.etState);
        spGender = findViewById(R.id.spGender);
        btnSave = findViewById(R.id.btnSave);
        imgBack = findViewById(R.id.imgBack);
        imgProfile = findViewById(R.id.imgProfile);
        cardProfileImage = findViewById(R.id.cardProfileImage);

        // Setup gender spinner
        ArrayAdapter<CharSequence> adapter = ArrayAdapter.createFromResource(this,
                R.array.gender_array, android.R.layout.simple_spinner_item);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spGender.setAdapter(adapter);
    }

    private void setupDatePicker() {
        final Calendar calendar = Calendar.getInstance();

        DatePickerDialog.OnDateSetListener dateSetListener = (view, year, month, dayOfMonth) -> {
            calendar.set(Calendar.YEAR, year);
            calendar.set(Calendar.MONTH, month);
            calendar.set(Calendar.DAY_OF_MONTH, dayOfMonth);

            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
            etDob.setText(dateFormat.format(calendar.getTime()));
        };

        etDob.setOnClickListener(v -> {
            new DatePickerDialog(EditProfileActivity.this, dateSetListener,
                    calendar.get(Calendar.YEAR),
                    calendar.get(Calendar.MONTH),
                    calendar.get(Calendar.DAY_OF_MONTH)).show();
        });

        // Make the field non-editable to force using date picker
        etDob.setKeyListener(null);
    }

    private void loadUserData() {
        userProfile = (UserProfile) getIntent().getSerializableExtra("userProfile");
        if (userProfile != null) {
            etName.setText(userProfile.getName());
            if (userProfile.getAge() != null) {
                etAge.setText(String.valueOf(userProfile.getAge()));
            }

            String dob = userProfile.getDob();
            if (dob != null && dob.contains("T")) {
                dob = dob.split("T")[0];
            }
            etDob.setText(dob);

            etPhone.setText(userProfile.getPhone());
            etBio.setText(userProfile.getBio());
            etBloodGroup.setText(userProfile.getBlood_group());
            etCity.setText(userProfile.getDisplayCity());
            etState.setText(userProfile.getState());

            if (userProfile.getGender() != null) {
                int position = getGenderPosition(userProfile.getGender());
                spGender.setSelection(position);
            }

            // Load existing profile image
            if (userProfile.getProfile_image() != null && !userProfile.getProfile_image().isEmpty()) {
                String imageUrl = RetrofitClient.getImageUrl(userProfile.getProfile_image());
                Glide.with(this)
                        .load(imageUrl)
                        .diskCacheStrategy(DiskCacheStrategy.ALL)
                        .placeholder(R.drawable.ic_profile)
                        .error(R.drawable.ic_profile)
                        .into(imgProfile);
            }
        }
    }

    private int getGenderPosition(String gender) {
        String[] genders = getResources().getStringArray(R.array.gender_array);
        for (int i = 0; i < genders.length; i++) {
            if (genders[i].equalsIgnoreCase(gender)) {
                return i;
            }
        }
        return 0;
    }

    private boolean validateForm() {
        if (etName.getText().toString().trim().isEmpty()) {
            etName.setError("Name is required");
            return false;
        }

        String ageStr = etAge.getText().toString().trim();
        if (!ageStr.isEmpty()) {
            try {
                int age = Integer.parseInt(ageStr);
                if (age < 1 || age > 120) {
                    etAge.setError("Age must be between 1 and 120");
                    return false;
                }
            } catch (NumberFormatException e) {
                etAge.setError("Invalid age");
                return false;
            }
        }
        return true;
    }

    private void openImagePicker() {
        Intent intent = new Intent(Intent.ACTION_PICK);
        intent.setType("image/*");
        startActivityForResult(intent, PICK_IMAGE_REQUEST);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == PICK_IMAGE_REQUEST && resultCode == RESULT_OK && data != null && data.getData() != null) {
            selectedImageUri = data.getData();
            // Show preview
            Glide.with(this)
                    .load(selectedImageUri)
                    .circleCrop()
                    .into(imgProfile);
        }
    }

    private void updateProfile() {
        if (!validateForm())
            return;

        showLoading(true);

        String name = etName.getText().toString().trim();
        String ageStr = etAge.getText().toString().trim();
        String dob = etDob.getText().toString().trim();
        String gender = spGender.getSelectedItem().toString();
        String phone = etPhone.getText().toString().trim();
        String bio = etBio.getText().toString().trim();
        String bloodGroup = etBloodGroup.getText().toString().trim();
        String city = etCity.getText().toString().trim();
        String state = etState.getText().toString().trim();

        if (dob != null && dob.contains("T")) {
            dob = dob.split("T")[0];
        }

        ApiService apiService = RetrofitClient.getApiService();

        Callback<Map<String, Object>> callback = new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                showLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    if (Boolean.TRUE.equals(response.body().get("success"))) {
                        Toast.makeText(EditProfileActivity.this, "Profile updated successfully", Toast.LENGTH_SHORT)
                                .show();
                        setResult(RESULT_OK);
                        finish();
                    } else {
                        String error = (String) response.body().get("error");
                        Toast.makeText(EditProfileActivity.this, error != null ? error : "Failed to update",
                                Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(EditProfileActivity.this, "Update failed: " + response.code(), Toast.LENGTH_SHORT)
                            .show();
                }
            }

            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                showLoading(false);
                Toast.makeText(EditProfileActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                Log.e("EditProfile", "Error", t);
            }
        };

        if (selectedImageUri != null) {
            // Upload with image (Multipart)
            try {
                File file = getFileFromUri(selectedImageUri);
                if (file == null) {
                    showLoading(false);
                    Toast.makeText(this, "Error processing image", Toast.LENGTH_SHORT).show();
                    return;
                }

                // Prepare parts
                RequestBody requestFile = RequestBody.create(MediaType.parse("image/*"), file);
                MultipartBody.Part imagePart = MultipartBody.Part.createFormData("profile_image", file.getName(),
                        requestFile);

                Map<String, RequestBody> partMap = new HashMap<>();
                partMap.put("name", createPartFromString(name));
                partMap.put("age", createPartFromString(ageStr));
                partMap.put("dob", createPartFromString(dob));
                partMap.put("gender", createPartFromString(gender));
                partMap.put("phone", createPartFromString(phone));
                partMap.put("bio", createPartFromString(bio));
                partMap.put("blood_group", createPartFromString(bloodGroup));
                partMap.put("city", createPartFromString(city));
                partMap.put("state", createPartFromString(state));

                apiService.updateProfileMultipart(userProfile.getUser_id(), partMap, imagePart).enqueue(callback);

            } catch (Exception e) {
                showLoading(false);
                Toast.makeText(this, "Error preparing image: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }

        } else {
            // Standard text update (JSON)
            Map<String, Object> data = new HashMap<>();
            data.put("name", name);
            if (!ageStr.isEmpty())
                data.put("age", Integer.parseInt(ageStr));
            else
                data.put("age", null);
            data.put("dob", dob);
            data.put("gender", gender);
            data.put("phone", phone);
            data.put("bio", bio);
            data.put("blood_group", bloodGroup);
            data.put("city", city);
            data.put("state", state);

            apiService.updateProfile(userProfile.getUser_id(), data).enqueue(callback);
        }
    }

    private void showLoading(boolean isLoading) {
        btnSave.setEnabled(!isLoading);
        btnSave.setText(isLoading ? "Updating..." : "Save Changes");
    }

    private RequestBody createPartFromString(String value) {
        return RequestBody.create(MediaType.parse("text/plain"), value != null ? value : "");
    }

    private File getFileFromUri(Uri uri) {
        try {
            InputStream inputStream = getContentResolver().openInputStream(uri);
            if (inputStream == null)
                return null;

            File tempFile = File.createTempFile("upload", ".jpg", getCacheDir());
            tempFile.deleteOnExit();

            FileOutputStream out = new FileOutputStream(tempFile);
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                out.write(buffer, 0, bytesRead);
            }
            out.close();
            inputStream.close();
            return tempFile;
        } catch (Exception e) {
            Log.e("EditProfile", "File error", e);
            return null;
        }
    }
}