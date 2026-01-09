package com.example.strip;

import android.Manifest;
import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import retrofit2.Retrofit;

public class HealthPredictActivity extends AppCompatActivity {

    private static final String TAG = "HealthPredict";

    // BLE Service UUIDs for common health devices
    private static final UUID UUID_HEART_RATE_SERVICE = uuid16("180D");
    private static final UUID UUID_HEART_RATE_MEASUREMENT = uuid16("2A37");
    private static final UUID UUID_BATTERY_SERVICE = uuid16("180F");
    private static final UUID UUID_BATTERY_LEVEL = uuid16("2A19");
    private static final UUID UUID_DEVICE_INFO_SERVICE = uuid16("180A");
    private static final UUID UUID_FIRMWARE_REVISION = uuid16("2A26");
    private static final UUID UUID_SERIAL_NUMBER = uuid16("2A25");
    private static final UUID UUID_MANUFACTURER_NAME = uuid16("2A29");

    // Fitness tracker specific services
    private static final UUID UUID_STEP_COUNTER_SERVICE = uuid16("183A");
    private static final UUID UUID_STEP_COUNT = uuid16("2A53");

    // Health thermometer
    private static final UUID UUID_HEALTH_THERMOMETER_SERVICE = uuid16("1809");
    private static final UUID UUID_TEMPERATURE_MEASUREMENT = uuid16("2A1C");

    // Blood pressure
    private static final UUID UUID_BLOOD_PRESSURE_SERVICE = uuid16("1810");
    private static final UUID UUID_BLOOD_PRESSURE_MEASUREMENT = uuid16("2A35");

    // CCCD for enabling notifications
    private static final UUID UUID_CCCD = uuid16("2902");

    // Runtime permission request
    private static final int REQ_BT_PERMS = 42;

    // OpenRouter API
    private static final String OPENROUTER_API_KEY = "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";
    private static final String OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    // Database and API
    private DatabaseHelper databaseHelper;
    private ApiService apiService;
    // MongoDB removed - all data now stored in MySQL
    // private MongoApiService mongoApiService; // DEPRECATED
    private static final int CURRENT_USER_ID = 1;

    // UI
    private TextView tvConnectionPrefix, tvWatchName, tvHeartRate, tvSteps, tvCalories, tvSleep, tvAIInsights,
            tvActivityTrends;
    private Button btnConnectDisconnect, btnRefreshInsights, btnViewGraphs, btnScanDevices;
    private ImageView ivConnectionStatus;
    private ProgressBar pbInsightsLoading, pbScanning;

    // BLE
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothGatt bluetoothGatt;
    private BluetoothDevice connectedDevice;
    private boolean isConnected = false;
    private boolean isScanning = false;

    // Real-time metrics from actual devices
    private Integer heartRateBpm = null;
    private Integer stepsCount = null;
    private Integer caloriesKcal = null;
    private Integer sleepHours = null;
    private Integer systolic = null;
    private Integer diastolic = null;
    private Float bodyTempC = null;
    private Integer spo2Percent = null;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Map<UUID, String> serviceNames = new HashMap<>();

    // HTTP client
    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build();

    // API rate limiting
    private long lastApiCallTime = 0;
    private static final long MIN_API_INTERVAL = 60000;
    private boolean isApiCallInProgress = false;
    private boolean pendingPredictionRequest = false;
    private boolean isRateLimited = false;
    private long rateLimitUntil = 0;
    private int consecutiveApiFailures = 0;
    private static final int MAX_CONSECUTIVE_FAILURES = 3;

    // BLE Scan callback
    private BluetoothAdapter.LeScanCallback leScanCallback = new BluetoothAdapter.LeScanCallback() {
        @Override
        public void onLeScan(final BluetoothDevice device, int rssi, byte[] scanRecord) {
            runOnUiThread(() -> {
                String deviceName = device.getName();
                if (deviceName != null && isHealthDevice(deviceName)) {
                    Log.d(TAG, "Found health device: " + deviceName + " - " + device.getAddress());
                    toast("Found: " + deviceName);
                    connectToDevice(device);
                    stopScanning();
                }
            });
        }
    };

    // BLE GATT Callback
    private final BluetoothGattCallback gattCallback = new BluetoothGattCallback() {
        @Override
        public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
            super.onConnectionStateChange(gatt, status, newState);

            if (newState == BluetoothProfile.STATE_CONNECTED) {
                Log.d(TAG, "Connected to GATT server");
                runOnUiThread(() -> {
                    setConnectedUi();
                    if (connectedDevice != null) {
                        toast("Connected to " + connectedDevice.getName());
                    }
                });

                // Discover services
                if (bluetoothGatt != null) {
                    if (hasBtConnectPermission()) {
                        bluetoothGatt.discoverServices();
                    } else {
                        Log.w(TAG, "No BLUETOOTH_CONNECT permission, cannot discover services");
                    }
                }

            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                Log.d(TAG, "Disconnected from GATT server");
                runOnUiThread(() -> {
                    setDisconnectedUi();
                    toast("Device disconnected");
                });
                closeBluetoothGatt();
            }
        }

        @Override
        public void onServicesDiscovered(BluetoothGatt gatt, int status) {
            super.onServicesDiscovered(gatt, status);

            if (status == BluetoothGatt.GATT_SUCCESS) {
                Log.d(TAG, "Services discovered");
                if (gatt.getServices() != null) {
                    for (BluetoothGattService service : gatt.getServices()) {
                        Log.d(TAG, "Service: " + service.getUuid());
                        enableNotificationsForService(service);
                    }
                }
            }
        }

        @Override
        public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic) {
            super.onCharacteristicChanged(gatt, characteristic);
            processCharacteristicData(characteristic);
        }

        @Override
        public void onCharacteristicRead(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, int status) {
            super.onCharacteristicRead(gatt, characteristic, status);
            if (status == BluetoothGatt.GATT_SUCCESS) {
                processCharacteristicData(characteristic);
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_health_predict);

        // Initialize database and API services
        databaseHelper = new DatabaseHelper(this);
        apiService = RetrofitClient.getApiService();
        // MongoDB removed - all data now stored in MySQL via apiService

        // Debug database setup
        debugDatabaseSetup();

        initViews();
        initBluetooth();
        initializeServiceNames();

        btnConnectDisconnect.setOnClickListener(v -> {
            if (isConnected) {
                disconnectWatch();
            } else {
                startDeviceDiscovery();
            }
        });

        btnScanDevices.setOnClickListener(v -> startDeviceDiscovery());

        btnRefreshInsights.setOnClickListener(v -> {
            if (isRateLimited && System.currentTimeMillis() < rateLimitUntil) {
                long remainingTime = (rateLimitUntil - System.currentTimeMillis()) / 1000;
                toast("Rate limited. Please wait " + remainingTime + " seconds.");
                return;
            }
            updateInsightsUi();
        });

        btnViewGraphs.setOnClickListener(v -> {
            android.content.Intent intent = new android.content.Intent(HealthPredictActivity.this, GraphActivity.class);
            startActivity(intent);
        });

        // Load latest prediction if available
        loadLatestPrediction();

        // Start in disconnected visual state
        setDisconnectedUi();
    }

    private void initViews() {
        tvConnectionPrefix = findViewById(R.id.tvConnectionPrefix);
        tvWatchName = findViewById(R.id.tvWatchName);
        tvHeartRate = findViewById(R.id.tvHeartRate);
        tvSteps = findViewById(R.id.tvSteps);
        tvCalories = findViewById(R.id.tvCalories);
        tvSleep = findViewById(R.id.tvSleep);
        tvAIInsights = findViewById(R.id.tvAIInsights);
        tvActivityTrends = findViewById(R.id.tvActivityTrends);
        btnConnectDisconnect = findViewById(R.id.btnConnectDisconnect);
        btnRefreshInsights = findViewById(R.id.btnRefreshInsights);
        btnViewGraphs = findViewById(R.id.btnViewGraphs);
        btnScanDevices = findViewById(R.id.btnScanDevices);
        ivConnectionStatus = findViewById(R.id.ivConnectionStatus);
        pbInsightsLoading = findViewById(R.id.pbInsightsLoading);
        pbScanning = findViewById(R.id.pbScanning);
    }

    private void initializeServiceNames() {
        serviceNames.put(UUID_HEART_RATE_SERVICE, "Heart Rate");
        serviceNames.put(UUID_BATTERY_SERVICE, "Battery");
        serviceNames.put(UUID_DEVICE_INFO_SERVICE, "Device Info");
        serviceNames.put(UUID_STEP_COUNTER_SERVICE, "Step Counter");
        serviceNames.put(UUID_HEALTH_THERMOMETER_SERVICE, "Health Thermometer");
        serviceNames.put(UUID_BLOOD_PRESSURE_SERVICE, "Blood Pressure");
    }

    private void initBluetooth() {
        BluetoothManager mgr = (BluetoothManager) getSystemService(BLUETOOTH_SERVICE);
        bluetoothAdapter = mgr != null ? mgr.getAdapter() : BluetoothAdapter.getDefaultAdapter();
        if (bluetoothAdapter == null) {
            toast("Bluetooth not supported on this device");
            if (btnConnectDisconnect != null)
                btnConnectDisconnect.setEnabled(false);
            if (btnScanDevices != null)
                btnScanDevices.setEnabled(false);
        }
    }

    private static UUID uuid16(String short16) {
        return UUID.fromString("0000" + short16 + "-0000-1000-8000-00805f9b34fb");
    }

    private boolean hasBtPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return ContextCompat.checkSelfPermission(this,
                    Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
                    && ContextCompat.checkSelfPermission(this,
                            Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED
                    && ContextCompat.checkSelfPermission(this,
                            Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        } else {
            return ContextCompat.checkSelfPermission(this,
                    Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                    && ContextCompat.checkSelfPermission(this,
                            Manifest.permission.BLUETOOTH) == PackageManager.PERMISSION_GRANTED
                    && ContextCompat.checkSelfPermission(this,
                            Manifest.permission.BLUETOOTH_ADMIN) == PackageManager.PERMISSION_GRANTED;
        }
    }

    private boolean hasBtConnectPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return ContextCompat.checkSelfPermission(this,
                    Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
        }
        return true; // No separate connect permission needed before Android 12
    }

    private boolean hasBtScanPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return ContextCompat.checkSelfPermission(this,
                    Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED;
        }
        return ContextCompat.checkSelfPermission(this,
                Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private void requestBtPermissionsIfNeeded() {
        if (hasBtPermissions())
            return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ActivityCompat.requestPermissions(this,
                    new String[] {
                            Manifest.permission.BLUETOOTH_CONNECT,
                            Manifest.permission.BLUETOOTH_SCAN,
                            Manifest.permission.ACCESS_FINE_LOCATION
                    },
                    REQ_BT_PERMS);
        } else {
            ActivityCompat.requestPermissions(this,
                    new String[] {
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.BLUETOOTH,
                            Manifest.permission.BLUETOOTH_ADMIN
                    },
                    REQ_BT_PERMS);
        }
    }

    private void startDeviceDiscovery() {
        requestBtPermissionsIfNeeded();

        if (!hasBtPermissions()) {
            toast("Bluetooth permissions are required");
            return;
        }

        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            toast("Please enable Bluetooth");
            return;
        }

        startScanning();
    }

    private void startScanning() {
        if (isScanning)
            return;

        if (!hasBtScanPermission()) {
            toast("Bluetooth scan permission required");
            return;
        }

        if (pbScanning != null) {
            pbScanning.setVisibility(View.VISIBLE);
        }
        if (btnScanDevices != null) {
            btnScanDevices.setEnabled(false);
        }
        isScanning = true;

        toast("Scanning for health devices...");

        try {
            boolean started = bluetoothAdapter.startLeScan(leScanCallback);
            if (started) {
                Log.d(TAG, "BLE scan started");
                handler.postDelayed(this::stopScanning, 10000);
            } else {
                toast("Failed to start scanning");
                stopScanning();
            }
        } catch (SecurityException e) {
            Log.e(TAG, "SecurityException starting BLE scan: " + e.getMessage());
            toast("Bluetooth permission denied");
            stopScanning();
        }
    }

    private void stopScanning() {
        if (isScanning) {
            try {
                if (hasBtScanPermission()) {
                    bluetoothAdapter.stopLeScan(leScanCallback);
                }
            } catch (SecurityException e) {
                Log.e(TAG, "SecurityException stopping BLE scan: " + e.getMessage());
            }
            isScanning = false;
        }
        if (pbScanning != null) {
            pbScanning.setVisibility(View.GONE);
        }
        if (btnScanDevices != null) {
            btnScanDevices.setEnabled(true);
        }
    }

    private boolean isHealthDevice(String deviceName) {
        if (deviceName == null)
            return false;

        String name = deviceName.toLowerCase();
        return name.contains("watch") || name.contains("band") || name.contains("fit") ||
                name.contains("tracker") || name.contains("health") || name.contains("monitor") ||
                name.contains("heart") || name.contains("blood") || name.contains("pressure") ||
                name.contains("thermometer") || name.contains("scale") || name.contains("glucose");
    }

    private void connectToDevice(BluetoothDevice device) {
        if (isConnected) {
            disconnectWatch();
        }

        connectedDevice = device;
        if (pbScanning != null) {
            pbScanning.setVisibility(View.VISIBLE);
        }

        // Check permission before connecting
        if (!hasBtConnectPermission()) {
            toast("Bluetooth connect permission required");
            return;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                bluetoothGatt = device.connectGatt(this, false, gattCallback, BluetoothDevice.TRANSPORT_LE);
            } else {
                bluetoothGatt = device.connectGatt(this, false, gattCallback);
            }
        } catch (SecurityException e) {
            Log.e(TAG, "SecurityException connecting to device: " + e.getMessage());
            toast("Bluetooth connect permission denied");
        }
    }

    private void enableNotificationsForService(BluetoothGattService service) {
        if (service == null || bluetoothGatt == null)
            return;

        if (!hasBtConnectPermission()) {
            Log.w(TAG, "No BLUETOOTH_CONNECT permission, cannot enable notifications");
            return;
        }

        UUID serviceUuid = service.getUuid();

        for (BluetoothGattCharacteristic characteristic : service.getCharacteristics()) {
            UUID charUuid = characteristic.getUuid();

            // Enable notifications for important characteristics
            if (charUuid.equals(UUID_HEART_RATE_MEASUREMENT) ||
                    charUuid.equals(UUID_BLOOD_PRESSURE_MEASUREMENT) ||
                    charUuid.equals(UUID_TEMPERATURE_MEASUREMENT) ||
                    charUuid.equals(UUID_STEP_COUNT)) {

                try {
                    bluetoothGatt.setCharacteristicNotification(characteristic, true);

                    BluetoothGattDescriptor descriptor = characteristic.getDescriptor(UUID_CCCD);
                    if (descriptor != null) {
                        descriptor.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
                        bluetoothGatt.writeDescriptor(descriptor);
                    }
                } catch (SecurityException e) {
                    Log.e(TAG, "SecurityException enabling notifications: " + e.getMessage());
                }
            }

            // Read static characteristics
            if (charUuid.equals(UUID_BATTERY_LEVEL) ||
                    charUuid.equals(UUID_FIRMWARE_REVISION) ||
                    charUuid.equals(UUID_SERIAL_NUMBER) ||
                    charUuid.equals(UUID_MANUFACTURER_NAME)) {

                try {
                    bluetoothGatt.readCharacteristic(characteristic);
                } catch (SecurityException e) {
                    Log.e(TAG, "SecurityException reading characteristic: " + e.getMessage());
                }
            }
        }
    }

    @SuppressLint("DefaultLocale")
    private void processCharacteristicData(BluetoothGattCharacteristic characteristic) {
        UUID charUuid = characteristic.getUuid();
        byte[] data = characteristic.getValue();

        if (data == null || data.length == 0)
            return;

        if (charUuid.equals(UUID_HEART_RATE_MEASUREMENT)) {
            // Parse heart rate data
            int flag = data[0] & 0xFF;
            int offset = 1;

            if ((flag & 0x01) != 0) {
                // HR is 16-bit
                heartRateBpm = (data[offset + 1] & 0xFF) << 8 | (data[offset] & 0xFF);
                offset += 2;
            } else {
                // HR is 8-bit
                heartRateBpm = data[offset] & 0xFF;
                offset += 1;
            }

            updateHeartRateUI();
            Log.d(TAG, "Heart Rate: " + heartRateBpm + " BPM");

        } else if (charUuid.equals(UUID_BLOOD_PRESSURE_MEASUREMENT)) {
            // Parse blood pressure data
            if (data.length >= 7) {
                int flag = data[0] & 0xFF;

                // Systolic and Diastolic are always present
                systolic = (data[2] & 0xFF) << 8 | (data[1] & 0xFF);
                diastolic = (data[4] & 0xFF) << 8 | (data[3] & 0xFF);

                updateBloodPressureUI();
                Log.d(TAG, String.format("Blood Pressure: %d/%d mmHg", systolic, diastolic));
            }

        } else if (charUuid.equals(UUID_TEMPERATURE_MEASUREMENT)) {
            // Parse temperature data
            if (data.length >= 5) {
                int flag = data[0] & 0xFF;
                bodyTempC = (float) ((data[2] & 0xFF) << 8 | (data[1] & 0xFF)) / 100.0f;

                updateTemperatureUI();
                Log.d(TAG, String.format("Body Temperature: %.1f°C", bodyTempC));
            }

        } else if (charUuid.equals(UUID_STEP_COUNT)) {
            // Parse step count
            if (data.length >= 4) {
                stepsCount = (data[3] & 0xFF) << 24 | (data[2] & 0xFF) << 16 |
                        (data[1] & 0xFF) << 8 | (data[0] & 0xFF);

                updateStepsUI();
                Log.d(TAG, "Steps: " + stepsCount);
            }

        } else if (charUuid.equals(UUID_BATTERY_LEVEL)) {
            // Parse battery level
            int batteryLevel = data[0] & 0xFF;
            Log.d(TAG, "Battery Level: " + batteryLevel + "%");
        }

        // Store and send data when we have meaningful updates
        if (heartRateBpm != null || stepsCount != null || systolic != null || bodyTempC != null) {
            storeAndSendHealthData();
        }
    }

    private void updateHeartRateUI() {
        runOnUiThread(() -> {
            if (heartRateBpm != null && tvHeartRate != null) {
                tvHeartRate.setText(heartRateBpm + " Bpm");
                updateActivityTrends();
            }
        });
    }

    private void updateStepsUI() {
        runOnUiThread(() -> {
            if (stepsCount != null && tvSteps != null) {
                tvSteps.setText(String.valueOf(stepsCount));
                updateActivityTrends();
            }
        });
    }

    private void updateBloodPressureUI() {
        runOnUiThread(() -> {
            if (systolic != null && diastolic != null) {
                updateActivityTrends();
            }
        });
    }

    private void updateTemperatureUI() {
        runOnUiThread(() -> {
            if (bodyTempC != null) {
                updateActivityTrends();
            }
        });
    }

    private void updateActivityTrends() {
        runOnUiThread(() -> {
            if (tvActivityTrends == null)
                return;

            StringBuilder trends = new StringBuilder();
            trends.append("Real-time Health Data:\n");

            if (heartRateBpm != null)
                trends.append("❤️ Heart Rate: ").append(heartRateBpm).append(" BPM\n");
            if (stepsCount != null)
                trends.append("👣 Steps: ").append(stepsCount).append("\n");
            if (systolic != null && diastolic != null)
                trends.append("🩸 BP: ").append(systolic).append("/").append(diastolic).append(" mmHg\n");
            if (bodyTempC != null)
                trends.append("🌡️ Temp: ").append(String.format("%.1f°C", bodyTempC)).append("\n");
            if (spo2Percent != null)
                trends.append("💨 SpO2: ").append(spo2Percent).append("%\n");

            tvActivityTrends.setText(trends.toString());
        });
    }

    private void storeAndSendHealthData() {
        // Store in local SQLite database
        storeHealthMetrics();

        // Send to MySQL backend (structured data)
        saveMetricsToBackend();

        // MongoDB removed - all data now stored in MySQL
        // saveMetricsToMongoDB(); // DEPRECATED

        // Check for prediction generation
        checkAndGeneratePrediction();
    }

    private void storeHealthMetrics() {
        try {
            HealthMetrics metrics = new HealthMetrics();
            metrics.setUser_id(CURRENT_USER_ID);
            metrics.setHeart_rate(heartRateBpm);
            metrics.setSteps_count(stepsCount);
            metrics.setSystolic_bp(systolic);
            metrics.setDiastolic_bp(diastolic);
            metrics.setBody_temperature(bodyTempC);
            metrics.setBlood_oxygen(spo2Percent);

            long result = databaseHelper.insertHealthMetrics(metrics);
            Log.d(TAG, "Health metrics stored in database with ID: " + result);
        } catch (Exception e) {
            Log.e(TAG, "Error storing health metrics: " + e.getMessage());
        }
    }

    private void saveMetricsToBackend() {
        Map<String, Object> metrics = new HashMap<>();
        if (heartRateBpm != null)
            metrics.put("heart_rate", heartRateBpm);
        if (stepsCount != null)
            metrics.put("steps_count", stepsCount);
        if (systolic != null)
            metrics.put("systolic_bp", systolic);
        if (diastolic != null)
            metrics.put("diastolic_bp", diastolic);
        if (bodyTempC != null)
            metrics.put("body_temperature", bodyTempC);
        if (spo2Percent != null)
            metrics.put("blood_oxygen", spo2Percent);

        if (!metrics.isEmpty()) {
            retrofit2.Call<Map<String, Object>> call = apiService.saveHealthMetrics("Bearer " + getAuthToken(),
                    metrics);
            call.enqueue(new retrofit2.Callback<Map<String, Object>>() {
                @Override
                public void onResponse(retrofit2.Call<Map<String, Object>> call,
                        retrofit2.Response<Map<String, Object>> response) {
                    if (response.isSuccessful()) {
                        Log.d(TAG, "Metrics saved to MySQL backend successfully");
                    } else {
                        Log.e(TAG, "Failed to save metrics to MySQL backend: " + response.code());
                    }
                }

                @Override
                public void onFailure(retrofit2.Call<Map<String, Object>> call, Throwable t) {
                    Log.e(TAG, "Error saving metrics to MySQL backend: " + t.getMessage());
                }
            });
        }
    }

    // MongoDB removed - all data now stored in MySQL via saveMetricsToBackend()
    @Deprecated
    private void saveMetricsToMongoDB() {
        // MongoDB has been removed - this method is deprecated
        Log.d(TAG, "MongoDB removed - metrics are saved to MySQL via saveMetricsToBackend()");
        return;
        /*
         * if (mongoApiService == null) {
         * Log.w(TAG, "MongoDB service not initialized, skipping MongoDB save");
         * return;
         * }
         * 
         * List<MongoMetric> metrics = new ArrayList<>();
         * String timestamp = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
         * Locale.getDefault())
         * .format(new Date());
         * 
         * // Convert BLE data to MongoDB format
         * if (heartRateBpm != null) {
         * MongoMetric hrMetric = new MongoMetric();
         * hrMetric.setData_type("heart_rate");
         * hrMetric.setValue(heartRateBpm.doubleValue());
         * hrMetric.setTimestamp(timestamp);
         * hrMetric.setUnit("bpm");
         * if (connectedDevice != null) {
         * hrMetric.setDevice_id(connectedDevice.getAddress());
         * }
         * hrMetric.setSource("ble_device");
         * metrics.add(hrMetric);
         * }
         * 
         * if (stepsCount != null) {
         * // Steps metric
         * MongoMetric stepsMetric = new MongoMetric();
         * stepsMetric.setData_type("steps");
         * stepsMetric.setValue(stepsCount.doubleValue());
         * stepsMetric.setTimestamp(timestamp);
         * stepsMetric.setUnit("count");
         * if (connectedDevice != null) {
         * stepsMetric.setDevice_id(connectedDevice.getAddress());
         * }
         * stepsMetric.setSource("ble_device");
         * metrics.add(stepsMetric);
         * 
         * // Calculate calories from steps (approximate: 0.04 calories per step)
         * double calories = stepsCount * 0.04;
         * MongoMetric caloriesMetric = new MongoMetric();
         * caloriesMetric.setData_type("calories");
         * caloriesMetric.setValue(calories);
         * caloriesMetric.setTimestamp(timestamp);
         * caloriesMetric.setUnit("kcal");
         * if (connectedDevice != null) {
         * caloriesMetric.setDevice_id(connectedDevice.getAddress());
         * }
         * caloriesMetric.setSource("ble_device");
         * metrics.add(caloriesMetric);
         * }
         * 
         * if (systolic != null && diastolic != null) {
         * // Blood pressure - average of systolic and diastolic for graph purposes
         * double bpAvg = (systolic + diastolic) / 2.0;
         * MongoMetric bpMetric = new MongoMetric();
         * bpMetric.setData_type("blood_pressure");
         * bpMetric.setValue(bpAvg);
         * bpMetric.setTimestamp(timestamp);
         * bpMetric.setUnit("mmHg");
         * if (connectedDevice != null) {
         * bpMetric.setDevice_id(connectedDevice.getAddress());
         * }
         * bpMetric.setSource("ble_device");
         * metrics.add(bpMetric);
         * }
         * 
         * if (bodyTempC != null) {
         * MongoMetric tempMetric = new MongoMetric();
         * tempMetric.setData_type("temperature");
         * tempMetric.setValue(bodyTempC.doubleValue());
         * tempMetric.setTimestamp(timestamp);
         * tempMetric.setUnit("°C");
         * if (connectedDevice != null) {
         * tempMetric.setDevice_id(connectedDevice.getAddress());
         * }
         * tempMetric.setSource("ble_device");
         * metrics.add(tempMetric);
         * }
         * 
         * if (!metrics.isEmpty()) {
         * MongoMetricsRequest request = new MongoMetricsRequest(metrics);
         * retrofit2.Call<Map<String, Object>> call =
         * mongoApiService.saveMetricsToMongoDB(
         * "Bearer " + getAuthToken(), request
         * );
         * 
         * call.enqueue(new retrofit2.Callback<Map<String, Object>>() {
         * 
         * @Override
         * public void onResponse(retrofit2.Call<Map<String, Object>> call,
         * retrofit2.Response<Map<String, Object>> response) {
         * if (response.isSuccessful()) {
         * Log.d(TAG, "Metrics saved to MongoDB successfully");
         * Map<String, Object> body = response.body();
         * if (body != null && body.containsKey("count")) {
         * Log.d(TAG, "Saved " + body.get("count") + " metrics to MongoDB");
         * }
         * } else {
         * Log.e(TAG, "Failed to save metrics to MongoDB: " + response.code());
         * try {
         * if (response.errorBody() != null) {
         * Log.e(TAG, "Error body: " + response.errorBody().string());
         * }
         * } catch (IOException e) {
         * Log.e(TAG, "Error reading error body: " + e.getMessage());
         * }
         * }
         * }
         * 
         * @Override
         * public void onFailure(retrofit2.Call<Map<String, Object>> call, Throwable t)
         * {
         * Log.e(TAG, "Error saving metrics to MongoDB: " + t.getMessage());
         * // You could retry or save to local storage for later sync
         * }
         * });
         * }
         * }
         */
    }

    private void setConnectedUi() {
        isConnected = true;
        if (pbScanning != null) {
            pbScanning.setVisibility(View.GONE);
        }
        if (tvConnectionPrefix != null) {
            tvConnectionPrefix.setText("Connected to");
        }
        if (tvWatchName != null) {
            tvWatchName.setVisibility(View.VISIBLE);
            if (connectedDevice != null) {
                tvWatchName.setText(connectedDevice.getName());
            }
        }
        if (btnConnectDisconnect != null) {
            btnConnectDisconnect.setText("DISCONNECT");
            btnConnectDisconnect.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.RED));
        }
        if (ivConnectionStatus != null) {
            ivConnectionStatus.setColorFilter(Color.GREEN);
        }
    }

    private void setDisconnectedUi() {
        isConnected = false;
        if (tvConnectionPrefix != null) {
            tvConnectionPrefix.setText("Connect to Health Device");
        }
        if (tvWatchName != null) {
            tvWatchName.setVisibility(View.GONE);
        }
        if (btnConnectDisconnect != null) {
            btnConnectDisconnect.setText("SCAN DEVICES");
            btnConnectDisconnect
                    .setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.parseColor("#388E3C")));
        }
        if (ivConnectionStatus != null) {
            ivConnectionStatus.setColorFilter(Color.RED);
        }

        // Reset all values
        if (tvHeartRate != null)
            tvHeartRate.setText("--");
        if (tvSteps != null)
            tvSteps.setText("--");
        if (tvCalories != null)
            tvCalories.setText("--");
        if (tvSleep != null)
            tvSleep.setText("--");
        if (tvActivityTrends != null)
            tvActivityTrends.setText("Connect to a health device to see real-time data");
        if (tvAIInsights != null)
            tvAIInsights.setText("Connect to a health device to get AI insights");
    }

    private void disconnectWatch() {
        stopScanning();
        closeBluetoothGatt();
        setDisconnectedUi();
        toast("Device disconnected");
    }

    private void closeBluetoothGatt() {
        if (bluetoothGatt != null) {
            try {
                if (hasBtConnectPermission()) {
                    bluetoothGatt.disconnect();
                }
            } catch (SecurityException e) {
                Log.e(TAG, "SecurityException disconnecting GATT: " + e.getMessage());
            }
            bluetoothGatt.close();
            bluetoothGatt = null;
        }
        connectedDevice = null;
    }

    private void toast(String s) {
        Toast.makeText(this, s, Toast.LENGTH_SHORT).show();
    }

    private void checkAndGeneratePrediction() {
        if (!databaseHelper.hasRecentPrediction(CURRENT_USER_ID, 12)) {
            Log.d(TAG, "No recent prediction found, scheduling prediction generation");
            schedulePredictionGeneration();
        }
    }

    private void schedulePredictionGeneration() {
        if (pendingPredictionRequest || isApiCallInProgress)
            return;

        if (consecutiveApiFailures >= MAX_CONSECUTIVE_FAILURES) {
            generateLocalPrediction();
            return;
        }

        long currentTime = System.currentTimeMillis();
        if (isRateLimited && currentTime < rateLimitUntil) {
            long delay = rateLimitUntil - currentTime;
            pendingPredictionRequest = true;
            handler.postDelayed(() -> {
                pendingPredictionRequest = false;
                schedulePredictionGeneration();
            }, delay);
            return;
        }

        long timeSinceLastCall = currentTime - lastApiCallTime;
        if (timeSinceLastCall < MIN_API_INTERVAL) {
            long delay = MIN_API_INTERVAL - timeSinceLastCall;
            pendingPredictionRequest = true;
            handler.postDelayed(() -> {
                pendingPredictionRequest = false;
                generateRiskPrediction();
            }, delay);
        } else {
            generateRiskPrediction();
        }
    }

    private void generateRiskPrediction() {
        if (isApiCallInProgress)
            return;

        List<HealthMetrics> recentMetrics = databaseHelper.getRecentHealthMetrics(CURRENT_USER_ID, 10);
        if (recentMetrics.isEmpty())
            return;

        Log.d(TAG, "Generating risk prediction with " + recentMetrics.size() + " recent metrics");
        generateAIInsights(true, recentMetrics);
    }

    private void generateLocalPrediction() {
        List<HealthMetrics> recentMetrics = databaseHelper.getRecentHealthMetrics(CURRENT_USER_ID, 10);
        String localAnalysis = generateLocalHealthAnalysis(recentMetrics, true);

        storeRiskPrediction(localAnalysis);
        savePredictionToBackend(localAnalysis);

        runOnUiThread(() -> {
            if (tvAIInsights != null) {
                tvAIInsights.setText("LOCAL HEALTH PREDICTION (Offline Analysis)\n\n" + localAnalysis);
            }
        });
    }

    private void storeRiskPrediction(String prediction) {
        try {
            HealthRiskPrediction riskPrediction = new HealthRiskPrediction();
            riskPrediction.setUser_id(CURRENT_USER_ID);
            riskPrediction.setPredicted_risks(extractRisks(prediction));
            riskPrediction.setRisk_level(extractRiskLevel(prediction));
            riskPrediction.setPrevention_plan(extractPreventionPlan(prediction));
            riskPrediction.setRecommendations(extractRecommendations(prediction));

            Calendar calendar = Calendar.getInstance();
            riskPrediction.setPredicted_at(calendar.getTime());
            calendar.add(Calendar.HOUR, 12); // Valid for 12 hours
            riskPrediction.setValid_until(calendar.getTime());

            databaseHelper.insertRiskPrediction(riskPrediction);
            Log.d(TAG, "Risk prediction stored in database");
        } catch (Exception e) {
            Log.e(TAG, "Error storing risk prediction: " + e.getMessage());
        }
    }

    private void updateInsightsUi() {
        if (isApiCallInProgress) {
            toast("AI analysis in progress, please wait...");
            return;
        }

        if (isRateLimited && System.currentTimeMillis() < rateLimitUntil) {
            long remainingTime = (rateLimitUntil - System.currentTimeMillis()) / 1000;
            toast("Rate limited. Please wait " + remainingTime + " seconds.");
            return;
        }

        if (consecutiveApiFailures >= MAX_CONSECUTIVE_FAILURES) {
            generateLocalInsights();
            return;
        }

        if (pbInsightsLoading != null) {
            pbInsightsLoading.setVisibility(View.VISIBLE);
        }
        if (tvAIInsights != null) {
            tvAIInsights.setText("Analyzing your health data with AI...");
        }

        List<HealthMetrics> recentMetrics = databaseHelper.getRecentHealthMetrics(CURRENT_USER_ID, 5);
        generateAIInsights(false, recentMetrics);
    }

    private void generateLocalInsights() {
        List<HealthMetrics> recentMetrics = databaseHelper.getRecentHealthMetrics(CURRENT_USER_ID, 5);
        String localAnalysis = generateLocalHealthAnalysis(recentMetrics, false);

        runOnUiThread(() -> {
            if (pbInsightsLoading != null) {
                pbInsightsLoading.setVisibility(View.GONE);
            }
            if (tvAIInsights != null) {
                tvAIInsights.setText("LOCAL HEALTH INSIGHTS (Offline)\n\n" + localAnalysis);
            }
        });
    }

    private String generateLocalHealthAnalysis(List<HealthMetrics> recentMetrics, boolean isPrediction) {
        StringBuilder analysis = new StringBuilder();

        if (isPrediction) {
            analysis.append("Based on your health data, here's a risk assessment:\n\n");

            // Simple risk calculation
            int riskScore = calculateRiskScore();
            String riskLevel = getRiskLevel(riskScore);

            analysis.append("RISK LEVEL: ").append(riskLevel).append("\n\n");
            analysis.append("PREDICTED RISKS:\n");

            if (riskScore >= 7) {
                analysis.append("• Potential cardiovascular strain\n");
                analysis.append("• Metabolic syndrome risk\n");
                analysis.append("• Sleep-related health issues\n");
            } else if (riskScore >= 4) {
                analysis.append("• Moderate stress indicators\n");
                analysis.append("• Lifestyle-related health concerns\n");
            } else {
                analysis.append("• Low immediate health risks\n");
                analysis.append("• Maintain current healthy habits\n");
            }

            analysis.append("\nPREVENTION PLAN:\n");
            analysis.append("• Regular cardiovascular exercise\n");
            analysis.append("• Balanced nutrition with whole foods\n");
            analysis.append("• Consistent sleep schedule (7-8 hours)\n");
            analysis.append("• Stress management techniques\n");
            analysis.append("• Regular health monitoring\n");

            analysis.append("\nRECOMMENDATIONS:\n");
            analysis.append("• Aim for 8,000+ daily steps\n");
            analysis.append("• Include strength training 2-3x/week\n");
            analysis.append("• Monitor blood pressure regularly\n");
            analysis.append("• Stay hydrated (2-3L water daily)\n");
            analysis.append("• Limit processed foods and sugars\n");

        } else {
            analysis.append("CURRENT HEALTH ASSESSMENT:\n\n");

            // Current status analysis
            analysis.append("VITAL SIGNS ANALYSIS:\n");
            if (heartRateBpm != null) {
                if (heartRateBpm > 100)
                    analysis.append("• Elevated heart rate - consider stress reduction\n");
                else if (heartRateBpm < 60)
                    analysis.append("• Low heart rate - normal for athletes\n");
                else
                    analysis.append("• Normal heart rate range\n");
            }

            if (stepsCount != null) {
                if (stepsCount < 4000)
                    analysis.append("• Low activity level - aim for more movement\n");
                else if (stepsCount < 8000)
                    analysis.append("• Moderate activity - good baseline\n");
                else
                    analysis.append("• Excellent activity level\n");
            }

            if (sleepHours != null) {
                if (sleepHours < 6)
                    analysis.append("• Insufficient sleep - aim for 7-9 hours\n");
                else if (sleepHours > 9)
                    analysis.append("• Excessive sleep - monitor energy levels\n");
                else
                    analysis.append("• Adequate sleep duration\n");
            }

            analysis.append("\nIMMEDIATE ACTIONS:\n");
            analysis.append("• Stay hydrated throughout the day\n");
            analysis.append("• Take active breaks every hour\n");
            analysis.append("• Practice deep breathing exercises\n");
            analysis.append("• Maintain consistent meal times\n");

            analysis.append("\nLONG-TERM STRATEGIES:\n");
            analysis.append("• Regular exercise routine\n");
            analysis.append("• Balanced nutrition plan\n");
            analysis.append("• Quality sleep hygiene\n");
            analysis.append("• Stress management\n");
            analysis.append("• Regular health check-ups\n");
        }

        analysis.append("\n\nNote: This is a basic analysis. For medical concerns, consult healthcare professionals.");

        return analysis.toString();
    }

    private int calculateRiskScore() {
        int score = 0;

        if (heartRateBpm != null && heartRateBpm > 90)
            score += 2;
        if (stepsCount != null && stepsCount < 5000)
            score += 2;
        if (sleepHours != null && sleepHours < 6)
            score += 2;
        if (systolic != null && systolic > 130)
            score += 2;
        if (bodyTempC != null && bodyTempC > 37.2)
            score += 1;

        return Math.min(score, 10);
    }

    private String getRiskLevel(int score) {
        if (score >= 7)
            return "HIGH";
        if (score >= 4)
            return "MEDIUM";
        return "LOW";
    }

    private void generateAIInsights(boolean isPrediction, List<HealthMetrics> recentMetrics) {
        long currentTime = System.currentTimeMillis();

        // Check rate limiting
        if (isRateLimited && currentTime < rateLimitUntil) {
            long remainingTime = (rateLimitUntil - currentTime) / 1000;
            Log.d(TAG, "Currently rate limited, " + remainingTime + " seconds remaining");
            runOnUiThread(() -> {
                if (pbInsightsLoading != null) {
                    pbInsightsLoading.setVisibility(View.GONE);
                }
                if (tvAIInsights != null) {
                    tvAIInsights
                            .setText("Rate limited. Please wait " + remainingTime + " seconds before trying again.");
                }
            });
            return;
        }

        if (isApiCallInProgress) {
            Log.d(TAG, "API call already in progress, skipping");
            runOnUiThread(() -> {
                if (pbInsightsLoading != null) {
                    pbInsightsLoading.setVisibility(View.GONE);
                }
                if (tvAIInsights != null) {
                    tvAIInsights.setText("Analysis already in progress...");
                }
            });
            return;
        }

        long timeSinceLastCall = currentTime - lastApiCallTime;

        if (timeSinceLastCall < MIN_API_INTERVAL) {
            Log.d(TAG, "Rate limiting API call. Time since last call: " + timeSinceLastCall + "ms");
            long delay = MIN_API_INTERVAL - timeSinceLastCall;
            runOnUiThread(() -> {
                if (pbInsightsLoading != null) {
                    pbInsightsLoading.setVisibility(View.GONE);
                }
                if (tvAIInsights != null) {
                    if (isPrediction) {
                        tvAIInsights.setText("Prediction generation delayed due to rate limiting. Please wait "
                                + (delay / 1000) + " seconds...");
                    } else {
                        tvAIInsights.setText(
                                "Please wait " + (delay / 1000) + " seconds before requesting another analysis...");
                    }
                }
            });

            // Schedule retry
            handler.postDelayed(() -> generateAIInsights(isPrediction, recentMetrics), delay);
            return;
        }

        isApiCallInProgress = true;
        lastApiCallTime = currentTime;

        try {
            JSONObject requestBody = new JSONObject();
            requestBody.put("model", "google/gemini-2.0-flash-exp:free");
            requestBody.put("temperature", 0.7);
            requestBody.put("max_tokens", 1000);

            JSONArray messages = new JSONArray();
            JSONObject systemMessage = new JSONObject();

            if (isPrediction) {
                systemMessage.put("role", "system");
                systemMessage.put("content", buildPredictionSystemPrompt());
            } else {
                systemMessage.put("role", "system");
                systemMessage.put("content", buildAnalysisSystemPrompt());
            }
            messages.put(systemMessage);

            JSONObject userMessage = new JSONObject();
            userMessage.put("role", "user");
            userMessage.put("content", buildUserDataPrompt(recentMetrics, isPrediction));
            messages.put(userMessage);

            requestBody.put("messages", messages);

            RequestBody body = RequestBody.create(requestBody.toString(), JSON);
            Request request = new Request.Builder()
                    .url(OPENROUTER_URL)
                    .post(body)
                    .addHeader("Authorization", "Bearer " + OPENROUTER_API_KEY)
                    .addHeader("Content-Type", "application/json")
                    .addHeader("HTTP-Referer", "https://your-app-domain.com")
                    .addHeader("X-Title", "Health Monitor App")
                    .build();

            Log.d(TAG, "Making API call for " + (isPrediction ? "prediction" : "analysis"));

            httpClient.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(@NonNull Call call, @NonNull IOException e) {
                    Log.e(TAG, "API call failed: " + e.getMessage());
                    consecutiveApiFailures++;
                    runOnUiThread(() -> {
                        if (pbInsightsLoading != null) {
                            pbInsightsLoading.setVisibility(View.GONE);
                        }
                        // Use local analysis on failure
                        if (isPrediction) {
                            generateLocalPrediction();
                        } else {
                            generateLocalInsights();
                        }
                    });
                    isApiCallInProgress = false;
                }

                @Override
                public void onResponse(@NonNull Call call, @NonNull Response response) throws IOException {
                    isApiCallInProgress = false;

                    if (!response.isSuccessful()) {
                        Log.e(TAG, "API call not successful: " + response.code() + " - " + response.message());
                        consecutiveApiFailures++;

                        if (response.code() == 429) {
                            // Handle rate limiting
                            isRateLimited = true;
                            rateLimitUntil = System.currentTimeMillis() + 300000; // Wait 5 minutes
                            Log.d(TAG, "Rate limited until: " + new Date(rateLimitUntil));

                            runOnUiThread(() -> {
                                if (pbInsightsLoading != null) {
                                    pbInsightsLoading.setVisibility(View.GONE);
                                }
                                // Use local analysis when rate limited
                                if (isPrediction) {
                                    generateLocalPrediction();
                                } else {
                                    generateLocalInsights();
                                }
                            });
                        } else {
                            runOnUiThread(() -> {
                                if (pbInsightsLoading != null) {
                                    pbInsightsLoading.setVisibility(View.GONE);
                                }
                                // Use local analysis on other errors
                                if (isPrediction) {
                                    generateLocalPrediction();
                                } else {
                                    generateLocalInsights();
                                }
                            });
                        }
                        return;
                    }

                    // Reset failure counter on success
                    consecutiveApiFailures = 0;
                    isRateLimited = false;

                    try {
                        String responseBody = response.body().string();
                        JSONObject jsonResponse = new JSONObject(responseBody);
                        JSONArray choices = jsonResponse.getJSONArray("choices");
                        if (choices.length() > 0) {
                            JSONObject choice = choices.getJSONObject(0);
                            JSONObject message = choice.getJSONObject("message");
                            String aiResponse = message.getString("content");

                            runOnUiThread(() -> {
                                if (pbInsightsLoading != null) {
                                    pbInsightsLoading.setVisibility(View.GONE);
                                }
                                if (tvAIInsights != null) {
                                    tvAIInsights.setText(aiResponse);
                                }

                                // Store the analysis in metrics
                                if (!isPrediction) {
                                    storeAIAnalysis(aiResponse);
                                }
                            });

                            // If this is a prediction, store it in risk predictions table
                            if (isPrediction) {
                                storeRiskPrediction(aiResponse);
                                savePredictionToBackend(aiResponse);
                            }

                            Log.d(TAG, "Successfully processed AI " + (isPrediction ? "prediction" : "analysis"));
                        }
                    } catch (JSONException e) {
                        Log.e(TAG, "JSON parsing error: " + e.getMessage());
                        consecutiveApiFailures++;
                        runOnUiThread(() -> {
                            if (pbInsightsLoading != null) {
                                pbInsightsLoading.setVisibility(View.GONE);
                            }
                            // Use local analysis on JSON error
                            if (isPrediction) {
                                generateLocalPrediction();
                            } else {
                                generateLocalInsights();
                            }
                        });
                    }
                }
            });

        } catch (JSONException e) {
            isApiCallInProgress = false;
            consecutiveApiFailures++;
            Log.e(TAG, "JSON creation error: " + e.getMessage());
            runOnUiThread(() -> {
                if (pbInsightsLoading != null) {
                    pbInsightsLoading.setVisibility(View.GONE);
                }
                // Use local analysis on JSON creation error
                if (isPrediction) {
                    generateLocalPrediction();
                } else {
                    generateLocalInsights();
                }
            });
        }
    }

    private void storeAIAnalysis(String analysis) {
        try {
            // Update the latest health metrics with AI analysis
            HealthMetrics metrics = new HealthMetrics();
            metrics.setUser_id(CURRENT_USER_ID);
            metrics.setHeart_rate(heartRateBpm);
            metrics.setSteps_count(stepsCount);
            metrics.setSystolic_bp(systolic);
            metrics.setDiastolic_bp(diastolic);
            metrics.setBody_temperature(bodyTempC);
            metrics.setBlood_oxygen(spo2Percent);
            metrics.setAi_analysis(analysis);

            databaseHelper.insertHealthMetrics(metrics);
            Log.d(TAG, "AI analysis stored in database");
        } catch (Exception e) {
            Log.e(TAG, "Error storing AI analysis: " + e.getMessage());
        }
    }

    private void savePredictionToBackend(String prediction) {
        Map<String, Object> predictionData = new HashMap<>();
        predictionData.put("predicted_risks", extractRisks(prediction));
        predictionData.put("risk_level", extractRiskLevel(prediction));
        predictionData.put("prevention_plan", extractPreventionPlan(prediction));
        predictionData.put("recommendations", extractRecommendations(prediction));

        retrofit2.Call<Map<String, Object>> call = apiService.saveRiskPrediction("Bearer " + getAuthToken(),
                predictionData);
        call.enqueue(new retrofit2.Callback<Map<String, Object>>() {
            @Override
            public void onResponse(retrofit2.Call<Map<String, Object>> call,
                    retrofit2.Response<Map<String, Object>> response) {
                if (response.isSuccessful()) {
                    Log.d(TAG, "Prediction saved to backend successfully");
                }
            }

            @Override
            public void onFailure(retrofit2.Call<Map<String, Object>> call, Throwable t) {
                Log.e(TAG, "Error saving prediction to backend: " + t.getMessage());
            }
        });
    }

    private String getAuthToken() {
        SharedPreferences prefs = getSharedPreferences("health_app", MODE_PRIVATE);
        return prefs.getString("auth_token", "demo_token");
    }

    private void debugDatabaseSetup() {
        Log.d(TAG, "=== Database Debug Information ===");
        databaseHelper.logTableInfo();
    }

    private void loadLatestPrediction() {
        try {
            HealthRiskPrediction prediction = databaseHelper.getLatestRiskPrediction(CURRENT_USER_ID);
            if (prediction != null) {
                runOnUiThread(() -> {
                    if (tvAIInsights != null) {
                        String predictionText = "🔮 LATEST HEALTH PREDICTION\n\n" +
                                "Risk Level: " + prediction.getRisk_level() + "\n\n" +
                                "Predicted Risks:\n" + prediction.getPredicted_risks() + "\n\n" +
                                "Prevention Plan:\n" + prediction.getPrevention_plan() + "\n\n" +
                                "Recommendations:\n" + prediction.getRecommendations() + "\n\n" +
                                "Predicted on: " + new SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
                                        .format(prediction.getPredicted_at());

                        tvAIInsights.setText(predictionText);
                    }
                });
            } else {
                runOnUiThread(() -> {
                    if (tvAIInsights != null) {
                        tvAIInsights.setText("No predictions yet. Connect a health device to collect data...\n\n" +
                                "A prediction will be generated automatically every 12 hours.\n\n" +
                                "Click 'Refresh Insights' for immediate analysis.");
                    }
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error loading latest prediction: " + e.getMessage());
        }
    }

    // Helper methods for prediction parsing
    private String extractRisks(String prediction) {
        if (prediction.contains("Predicted Risks:") || prediction.contains("PREDICTED RISKS:")) {
            return prediction;
        }
        return prediction.length() > 500 ? prediction.substring(0, 500) + "..." : prediction;
    }

    private String extractRiskLevel(String prediction) {
        if (prediction.toLowerCase().contains("high risk"))
            return "High";
        if (prediction.toLowerCase().contains("medium risk") || prediction.toLowerCase().contains("moderate risk"))
            return "Medium";
        if (prediction.toLowerCase().contains("low risk"))
            return "Low";
        return "Unknown";
    }

    private String extractPreventionPlan(String prediction) {
        if (prediction.contains("Prevention Plan:") || prediction.contains("PREVENTION PLAN:")) {
            return prediction;
        }
        return prediction;
    }

    private String extractRecommendations(String prediction) {
        if (prediction.contains("Recommendations:") || prediction.contains("RECOMMENDATIONS:")) {
            return prediction;
        }
        return prediction;
    }

    private String val(Object v, String def) {
        if (v == null)
            return def;
        if (v instanceof Integer && (Integer) v < 0)
            return def;
        if (v instanceof Float && ((Float) v).isNaN())
            return def;
        String s = String.valueOf(v);
        return TextUtils.isEmpty(s) ? def : s;
    }

    private String buildPredictionSystemPrompt() {
        return "You are a professional health prediction AI. Analyze the user's health history and predict potential future health risks. "
                +
                "Provide a comprehensive risk assessment including:\n\n" +
                "1. RISK LEVEL: Low/Medium/High based on the data\n" +
                "2. PREDICTED RISKS: Specific health conditions that might develop\n" +
                "3. TIMEFRAME: When these risks might manifest (short-term/long-term)\n" +
                "4. PREVENTION PLAN: Detailed steps to prevent these risks\n" +
                "5. RECOMMENDATIONS: Specific lifestyle changes, exercises, and dietary advice\n" +
                "6. MONITORING: What to watch for and when to seek medical help\n\n" +
                "Be evidence-based, practical, and empathetic. Focus on actionable advice. Keep response under 500 words.";
    }

    private String buildAnalysisSystemPrompt() {
        return "You are a professional health and wellness AI assistant. " +
                "Analyze the user's current health metrics and provide comprehensive insights including:\n" +
                "1. Current health status assessment\n" +
                "2. Immediate health risks based on current metrics\n" +
                "3. Specific, actionable recommendations for:\n" +
                "   - Exercise and physical activity\n" +
                "   - Nutrition and diet\n" +
                "   - Sleep optimization\n" +
                "   - Stress management\n" +
                "   - Lifestyle adjustments\n" +
                "4. Immediate actions to take\n" +
                "5. When to consult a healthcare professional\n\n" +
                "Be empathetic, evidence-based, and practical. Focus on both men and women's health considerations. " +
                "Provide clear, structured advice that's easy to follow. Keep response under 400 words.";
    }

    private String buildUserDataPrompt(List<HealthMetrics> recentMetrics, boolean isPrediction) {
        StringBuilder sb = new StringBuilder();

        if (isPrediction) {
            sb.append(
                    "Based on the following health history data, predict future health risks and provide a prevention plan:\n\n");
        } else {
            sb.append("Analyze these current health metrics and provide personalized health insights:\n\n");
        }

        sb.append("CURRENT VITAL SIGNS:\n");
        sb.append("- Heart Rate: ").append(val(heartRateBpm, "unknown")).append(" BPM\n");
        sb.append("- Blood Pressure: ").append(val(systolic, "unknown")).append("/").append(val(diastolic, "unknown"))
                .append(" mmHg\n");
        sb.append("- Body Temperature: ").append(val(bodyTempC, "unknown")).append("°C\n");
        sb.append("- Blood Oxygen: ").append(val(spo2Percent, "unknown")).append("%\n\n");

        sb.append("CURRENT ACTIVITY & LIFESTYLE:\n");
        sb.append("- Daily Steps: ").append(val(stepsCount, "unknown")).append("\n");
        sb.append("- Calories Burned: ").append(val(caloriesKcal, "unknown")).append(" kcal\n");
        sb.append("- Sleep Duration: ").append(val(sleepHours, "unknown")).append(" hours\n\n");

        if (!recentMetrics.isEmpty() && isPrediction) {
            sb.append("RECENT HEALTH HISTORY (Last ").append(Math.min(recentMetrics.size(), 2)).append(" records):\n");
            for (int i = 0; i < Math.min(recentMetrics.size(), 2); i++) {
                HealthMetrics metric = recentMetrics.get(i);
                sb.append("Record ").append(i + 1).append(": HR=").append(val(metric.getHeart_rate(), "--"))
                        .append(" BP=").append(val(metric.getSystolic_bp(), "--")).append("/")
                        .append(val(metric.getDiastolic_bp(), "--"))
                        .append(" Steps=").append(val(metric.getSteps_count(), "--"))
                        .append(" Sleep=").append(val(metric.getSleep_hours(), "--")).append("h\n");
            }
            sb.append("\n");
        }

        if (isPrediction) {
            sb.append("Please provide a comprehensive future health risk prediction including:\n");
            sb.append("1. Overall risk level\n");
            sb.append("2. Specific predicted health risks\n");
            sb.append("3. Timeline for these risks\n");
            sb.append("4. Detailed prevention plan\n");
            sb.append("5. Specific recommendations\n");
            sb.append("6. Warning signs to monitor");
        } else {
            sb.append("Please provide:\n");
            sb.append("1. Current health assessment\n");
            sb.append("2. Immediate risk analysis\n");
            sb.append("3. Personalized recommendations\n");
            sb.append("4. Specific food suggestions\n");
            sb.append("5. Exercise routines\n");
            sb.append("6. Sleep improvement tips\n");
            sb.append("7. When to seek medical attention");
        }

        return sb.toString();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
            @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_BT_PERMS) {
            boolean granted = true;
            for (int r : grantResults)
                granted &= (r == PackageManager.PERMISSION_GRANTED);
            if (!granted) {
                toast("Bluetooth permissions denied");
            } else {
                toast("Permissions granted - you can now scan for devices");
            }
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopScanning();
        closeBluetoothGatt();
        handler.removeCallbacksAndMessages(null);
        if (databaseHelper != null) {
            databaseHelper.close();
        }
    }
}