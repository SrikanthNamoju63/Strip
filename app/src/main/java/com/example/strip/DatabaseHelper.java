package com.example.strip;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import android.util.Log;

public class DatabaseHelper extends SQLiteOpenHelper {
    private static final String DATABASE_NAME = "health_monitor.db";
    private static final int DATABASE_VERSION = 2; // Incremented version

    // Health Metrics Table - made public
    public static final String TABLE_HEALTH_METRICS = "health_metrics";
    public static final String COLUMN_METRICS_ID = "metrics_id";
    public static final String COLUMN_USER_ID = "user_id";
    public static final String COLUMN_HEART_RATE = "heart_rate";
    public static final String COLUMN_STEPS_COUNT = "steps_count";
    public static final String COLUMN_CALORIES_BURNED = "calories_burned";
    public static final String COLUMN_SLEEP_HOURS = "sleep_hours";
    public static final String COLUMN_SYSTOLIC_BP = "systolic_bp";
    public static final String COLUMN_DIASTOLIC_BP = "diastolic_bp";
    public static final String COLUMN_BODY_TEMPERATURE = "body_temperature";
    public static final String COLUMN_BLOOD_OXYGEN = "blood_oxygen";
    public static final String COLUMN_AI_ANALYSIS = "ai_analysis";
    public static final String COLUMN_RISK_PREDICTION = "risk_prediction";
    public static final String COLUMN_RECORDED_AT = "recorded_at";

    // Health Risk Predictions Table - made public
    public static final String TABLE_RISK_PREDICTIONS = "health_risk_predictions";
    public static final String COLUMN_PREDICTION_ID = "prediction_id";
    public static final String COLUMN_PREDICTED_RISKS = "predicted_risks";
    public static final String COLUMN_RISK_LEVEL = "risk_level";
    public static final String COLUMN_PREVENTION_PLAN = "prevention_plan";
    public static final String COLUMN_RECOMMENDATIONS = "recommendations";
    public static final String COLUMN_PREDICTED_AT = "predicted_at";
    public static final String COLUMN_VALID_UNTIL = "valid_until";

    public DatabaseHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        // Create health_metrics table
        String CREATE_METRICS_TABLE = "CREATE TABLE " + TABLE_HEALTH_METRICS + "("
                + COLUMN_METRICS_ID + " INTEGER PRIMARY KEY AUTOINCREMENT,"
                + COLUMN_USER_ID + " INTEGER,"
                + COLUMN_HEART_RATE + " INTEGER,"
                + COLUMN_STEPS_COUNT + " INTEGER,"
                + COLUMN_CALORIES_BURNED + " INTEGER,"
                + COLUMN_SLEEP_HOURS + " INTEGER,"
                + COLUMN_SYSTOLIC_BP + " INTEGER,"
                + COLUMN_DIASTOLIC_BP + " INTEGER,"
                + COLUMN_BODY_TEMPERATURE + " REAL,"
                + COLUMN_BLOOD_OXYGEN + " INTEGER,"
                + COLUMN_AI_ANALYSIS + " TEXT,"
                + COLUMN_RISK_PREDICTION + " TEXT,"
                + COLUMN_RECORDED_AT + " DATETIME DEFAULT CURRENT_TIMESTAMP"
                + ")";
        db.execSQL(CREATE_METRICS_TABLE);
        Log.d("DatabaseHelper", "Created table: " + TABLE_HEALTH_METRICS);

        // Create health_risk_predictions table
        String CREATE_RISK_PREDICTIONS_TABLE = "CREATE TABLE " + TABLE_RISK_PREDICTIONS + "("
                + COLUMN_PREDICTION_ID + " INTEGER PRIMARY KEY AUTOINCREMENT,"
                + COLUMN_USER_ID + " INTEGER,"
                + COLUMN_PREDICTED_RISKS + " TEXT,"
                + COLUMN_RISK_LEVEL + " TEXT,"
                + COLUMN_PREVENTION_PLAN + " TEXT,"
                + COLUMN_RECOMMENDATIONS + " TEXT,"
                + COLUMN_PREDICTED_AT + " DATETIME DEFAULT CURRENT_TIMESTAMP,"
                + COLUMN_VALID_UNTIL + " DATETIME"
                + ")";
        db.execSQL(CREATE_RISK_PREDICTIONS_TABLE);
        Log.d("DatabaseHelper", "Created table: " + TABLE_RISK_PREDICTIONS);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_HEALTH_METRICS);
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_RISK_PREDICTIONS);
        onCreate(db);
        Log.d("DatabaseHelper", "Database upgraded from version " + oldVersion + " to " + newVersion);
    }

    // Health Metrics Methods
    public long insertHealthMetrics(HealthMetrics metrics) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(COLUMN_USER_ID, metrics.getUser_id());

        if (metrics.getHeart_rate() != null) values.put(COLUMN_HEART_RATE, metrics.getHeart_rate());
        if (metrics.getSteps_count() != null) values.put(COLUMN_STEPS_COUNT, metrics.getSteps_count());
        if (metrics.getCalories_burned() != null) values.put(COLUMN_CALORIES_BURNED, metrics.getCalories_burned());
        if (metrics.getSleep_hours() != null) values.put(COLUMN_SLEEP_HOURS, metrics.getSleep_hours());
        if (metrics.getSystolic_bp() != null) values.put(COLUMN_SYSTOLIC_BP, metrics.getSystolic_bp());
        if (metrics.getDiastolic_bp() != null) values.put(COLUMN_DIASTOLIC_BP, metrics.getDiastolic_bp());
        if (metrics.getBody_temperature() != null) values.put(COLUMN_BODY_TEMPERATURE, metrics.getBody_temperature());
        if (metrics.getBlood_oxygen() != null) values.put(COLUMN_BLOOD_OXYGEN, metrics.getBlood_oxygen());
        if (metrics.getAi_analysis() != null) values.put(COLUMN_AI_ANALYSIS, metrics.getAi_analysis());
        if (metrics.getRisk_prediction() != null) values.put(COLUMN_RISK_PREDICTION, metrics.getRisk_prediction());

        long result = db.insert(TABLE_HEALTH_METRICS, null, values);
        Log.d("DatabaseHelper", "Inserted health metrics with ID: " + result);
        return result;
    }

    public List<HealthMetrics> getRecentHealthMetrics(int userId, int limit) {
        List<HealthMetrics> metricsList = new ArrayList<>();
        SQLiteDatabase db = this.getReadableDatabase();

        String query = "SELECT * FROM " + TABLE_HEALTH_METRICS
                + " WHERE " + COLUMN_USER_ID + " = ?"
                + " ORDER BY " + COLUMN_RECORDED_AT + " DESC LIMIT ?";

        Cursor cursor = db.rawQuery(query, new String[]{String.valueOf(userId), String.valueOf(limit)});

        try {
            if (cursor.moveToFirst()) {
                do {
                    HealthMetrics metrics = new HealthMetrics();
                    // Use getColumnIndexOrThrow which will throw exception if column doesn't exist
                    metrics.setMetrics_id(cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_METRICS_ID)));
                    metrics.setUser_id(cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_USER_ID)));

                    // Handle nullable columns
                    int heartRateIndex = cursor.getColumnIndex(COLUMN_HEART_RATE);
                    metrics.setHeart_rate(cursor.isNull(heartRateIndex) ? null : cursor.getInt(heartRateIndex));

                    int stepsIndex = cursor.getColumnIndex(COLUMN_STEPS_COUNT);
                    metrics.setSteps_count(cursor.isNull(stepsIndex) ? null : cursor.getInt(stepsIndex));

                    int caloriesIndex = cursor.getColumnIndex(COLUMN_CALORIES_BURNED);
                    metrics.setCalories_burned(cursor.isNull(caloriesIndex) ? null : cursor.getInt(caloriesIndex));

                    int sleepIndex = cursor.getColumnIndex(COLUMN_SLEEP_HOURS);
                    metrics.setSleep_hours(cursor.isNull(sleepIndex) ? null : cursor.getInt(sleepIndex));

                    int systolicIndex = cursor.getColumnIndex(COLUMN_SYSTOLIC_BP);
                    metrics.setSystolic_bp(cursor.isNull(systolicIndex) ? null : cursor.getInt(systolicIndex));

                    int diastolicIndex = cursor.getColumnIndex(COLUMN_DIASTOLIC_BP);
                    metrics.setDiastolic_bp(cursor.isNull(diastolicIndex) ? null : cursor.getInt(diastolicIndex));

                    int tempIndex = cursor.getColumnIndex(COLUMN_BODY_TEMPERATURE);
                    metrics.setBody_temperature(cursor.isNull(tempIndex) ? null : cursor.getFloat(tempIndex));

                    int oxygenIndex = cursor.getColumnIndex(COLUMN_BLOOD_OXYGEN);
                    metrics.setBlood_oxygen(cursor.isNull(oxygenIndex) ? null : cursor.getInt(oxygenIndex));

                    int analysisIndex = cursor.getColumnIndex(COLUMN_AI_ANALYSIS);
                    metrics.setAi_analysis(cursor.isNull(analysisIndex) ? null : cursor.getString(analysisIndex));

                    int riskIndex = cursor.getColumnIndex(COLUMN_RISK_PREDICTION);
                    metrics.setRisk_prediction(cursor.isNull(riskIndex) ? null : cursor.getString(riskIndex));

                    metricsList.add(metrics);
                } while (cursor.moveToNext());
            }
        } catch (Exception e) {
            Log.e("DatabaseHelper", "Error reading health metrics: " + e.getMessage());
        } finally {
            cursor.close();
        }

        Log.d("DatabaseHelper", "Retrieved " + metricsList.size() + " health metrics for user " + userId);
        return metricsList;
    }

    // Risk Prediction Methods
    public long insertRiskPrediction(HealthRiskPrediction prediction) {
        SQLiteDatabase db = this.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put(COLUMN_USER_ID, prediction.getUser_id());
        values.put(COLUMN_PREDICTED_RISKS, prediction.getPredicted_risks());
        values.put(COLUMN_RISK_LEVEL, prediction.getRisk_level());
        values.put(COLUMN_PREVENTION_PLAN, prediction.getPrevention_plan());
        values.put(COLUMN_RECOMMENDATIONS, prediction.getRecommendations());

        if (prediction.getValid_until() != null) {
            values.put(COLUMN_VALID_UNTIL, prediction.getValid_until().getTime());
        }

        long result = db.insert(TABLE_RISK_PREDICTIONS, null, values);
        Log.d("DatabaseHelper", "Inserted risk prediction with ID: " + result);
        return result;
    }

    public HealthRiskPrediction getLatestRiskPrediction(int userId) {
        SQLiteDatabase db = this.getReadableDatabase();
        HealthRiskPrediction prediction = null;

        String query = "SELECT * FROM " + TABLE_RISK_PREDICTIONS
                + " WHERE " + COLUMN_USER_ID + " = ?"
                + " ORDER BY " + COLUMN_PREDICTED_AT + " DESC LIMIT 1";

        Cursor cursor = db.rawQuery(query, new String[]{String.valueOf(userId)});

        try {
            if (cursor.moveToFirst()) {
                prediction = new HealthRiskPrediction();

                // Use getColumnIndexOrThrow for required columns
                prediction.setPrediction_id(cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_PREDICTION_ID)));
                prediction.setUser_id(cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_USER_ID)));
                prediction.setPredicted_risks(cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_PREDICTED_RISKS)));
                prediction.setRisk_level(cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_RISK_LEVEL)));
                prediction.setPrevention_plan(cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_PREVENTION_PLAN)));
                prediction.setRecommendations(cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_RECOMMENDATIONS)));

                // Handle date columns
                int predictedAtIndex = cursor.getColumnIndex(COLUMN_PREDICTED_AT);
                if (!cursor.isNull(predictedAtIndex)) {
                    prediction.setPredicted_at(new Date(cursor.getLong(predictedAtIndex)));
                }

                int validUntilIndex = cursor.getColumnIndex(COLUMN_VALID_UNTIL);
                if (!cursor.isNull(validUntilIndex)) {
                    prediction.setValid_until(new Date(cursor.getLong(validUntilIndex)));
                }
            }
        } catch (Exception e) {
            Log.e("DatabaseHelper", "Error reading risk prediction: " + e.getMessage());
        } finally {
            cursor.close();
        }

        Log.d("DatabaseHelper", "Retrieved latest risk prediction for user " + userId + ": " + (prediction != null ? "found" : "not found"));
        return prediction;
    }

    public boolean hasRecentPrediction(int userId, int hours) {
        SQLiteDatabase db = this.getReadableDatabase();
        String query = "SELECT COUNT(*) FROM " + TABLE_RISK_PREDICTIONS
                + " WHERE " + COLUMN_USER_ID + " = ? AND "
                + COLUMN_PREDICTED_AT + " > datetime('now', '-" + hours + " hours')";

        Cursor cursor = db.rawQuery(query, new String[]{String.valueOf(userId)});
        boolean hasRecent = false;
        try {
            if (cursor.moveToFirst()) {
                hasRecent = cursor.getInt(0) > 0;
            }
        } catch (Exception e) {
            Log.e("DatabaseHelper", "Error checking recent predictions: " + e.getMessage());
        } finally {
            cursor.close();
        }

        Log.d("DatabaseHelper", "Recent prediction exists for user " + userId + " within " + hours + " hours: " + hasRecent);
        return hasRecent;
    }

    // Method to check if tables exist (for debugging)
    public boolean tableExists(String tableName) {
        SQLiteDatabase db = this.getReadableDatabase();
        Cursor cursor = db.rawQuery(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                new String[]{tableName}
        );
        boolean exists = cursor.getCount() > 0;
        cursor.close();
        Log.d("DatabaseHelper", "Table " + tableName + " exists: " + exists);
        return exists;
    }

    // Method to get table info (for debugging)
    public void logTableInfo() {
        SQLiteDatabase db = this.getReadableDatabase();

        // Check health_metrics table
        Cursor cursor = db.rawQuery("PRAGMA table_info(" + TABLE_HEALTH_METRICS + ")", null);
        Log.d("DatabaseHelper", "=== " + TABLE_HEALTH_METRICS + " Table Structure ===");
        try {
            if (cursor.moveToFirst()) {
                do {
                    String columnName = cursor.getString(cursor.getColumnIndexOrThrow("name"));
                    String columnType = cursor.getString(cursor.getColumnIndexOrThrow("type"));
                    Log.d("DatabaseHelper", "Column: " + columnName + " | Type: " + columnType);
                } while (cursor.moveToNext());
            }
        } catch (Exception e) {
            Log.e("DatabaseHelper", "Error reading table info: " + e.getMessage());
        } finally {
            cursor.close();
        }

        // Check health_risk_predictions table
        cursor = db.rawQuery("PRAGMA table_info(" + TABLE_RISK_PREDICTIONS + ")", null);
        Log.d("DatabaseHelper", "=== " + TABLE_RISK_PREDICTIONS + " Table Structure ===");
        try {
            if (cursor.moveToFirst()) {
                do {
                    String columnName = cursor.getString(cursor.getColumnIndexOrThrow("name"));
                    String columnType = cursor.getString(cursor.getColumnIndexOrThrow("type"));
                    Log.d("DatabaseHelper", "Column: " + columnName + " | Type: " + columnType);
                } while (cursor.moveToNext());
            }
        } catch (Exception e) {
            Log.e("DatabaseHelper", "Error reading table info: " + e.getMessage());
        } finally {
            cursor.close();
        }
    }

    // Method to get row count for debugging
    public int getRowCount(String tableName) {
        SQLiteDatabase db = this.getReadableDatabase();
        Cursor cursor = db.rawQuery("SELECT COUNT(*) FROM " + tableName, null);
        int count = 0;
        if (cursor.moveToFirst()) {
            count = cursor.getInt(0);
        }
        cursor.close();
        Log.d("DatabaseHelper", "Row count for " + tableName + ": " + count);
        return count;
    }
}