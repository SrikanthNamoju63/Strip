package com.example.strip;

import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.jjoe64.graphview.GraphView;
import com.jjoe64.graphview.series.BarGraphSeries;
import com.jjoe64.graphview.series.DataPoint;
import com.jjoe64.graphview.series.LineGraphSeries;
import com.jjoe64.graphview.helper.StaticLabelsFormatter;
import com.jjoe64.graphview.GridLabelRenderer;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class GraphActivity extends AppCompatActivity {

    private static final String TAG = "EnhancedGraphActivity";
    // MongoDB removed - TODO: Update to use MySQL health metrics endpoints
    // private MongoApiService mongoApiService; // DEPRECATED
    private ApiService apiService; // Use MySQL API instead
    private LinearLayout chartsContainer;
    private DatabaseHelper databaseHelper;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_graphs);

        chartsContainer = findViewById(R.id.chartsContainer);
        // MongoDB removed - use MySQL API instead
        apiService = RetrofitClient.getApiService();
        databaseHelper = new DatabaseHelper(this);

        // TODO: Update to use MySQL health metrics endpoints
        // For now, show message that charts need to be updated
        addSectionTitle("Health Analytics Dashboard");
        addNoDataMessage("Charts feature is being updated to use MySQL. Please check back soon.");
        
        // Old MongoDB charts - commented out until migration complete
        // loadMongoDBCharts();
    }

    @Deprecated
    private void loadMongoDBCharts() {
        // MongoDB removed - this method is deprecated
        // TODO: Implement using MySQL health metrics endpoints:
        // - api/health/steps-data
        // - api/health/heart-rate-data
        // - api/health/calorie-data
        // - api/health/chart-data
        addSectionTitle("Health Analytics Dashboard");
        addNoDataMessage("MongoDB charts removed. Migration to MySQL in progress.");
    }

    @Deprecated
    private void loadWeeklyCaloriesChart() {
        // MongoDB removed - use api/health/calorie-data instead
        addChartTitle("Average Calories Burned (Last 7 Days)");
        addNoDataMessage("Chart data migration in progress. Use MySQL endpoints.");
        return;
        /*
        Call<Map<String, Object>> call = mongoApiService.getGraphData(
                "Bearer " + getAuthToken(),
                "weekly_calories",
                7,
                false
        );

        call.enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                if (response.isSuccessful()) {
                    Map<String, Object> responseBody = response.body();
                    if (responseBody != null && (Boolean) responseBody.get("success")) {
                        try {
                            String jsonData = new Gson().toJson(responseBody.get("data"));
                            GraphData graphData = new Gson().fromJson(jsonData, GraphData.class);
                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    createWeeklyCaloriesBarChart(graphData);
                                }
                            });
                        } catch (Exception e) {
                            Log.e(TAG, "Error parsing graph data: " + e.getMessage());
                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    addNoDataMessage("Error loading calories chart");
                                }
                            });
                        }
                    }
                } else {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            addNoDataMessage("Failed to load calories data");
                        }
                    });
                }
            }

            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                Log.e(TAG, "Error loading calories chart: " + t.getMessage());
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        addNoDataMessage("Error loading calories data");
                    }
                });
            }
        });
    }

    private void createWeeklyCaloriesBarChart(GraphData data) {
        if (data == null || data.getValues() == null || data.getValues().isEmpty()) {
            addNoDataMessage("No calories data available");
            return;
        }

        GraphView graph = new GraphView(this);
        setupGraphLayout(graph);

        List<DataPoint> dataPoints = new ArrayList<>();
        for (int i = 0; i < data.getValues().size(); i++) {
            dataPoints.add(new DataPoint(i, data.getValues().get(i)));
        }

        BarGraphSeries<DataPoint> series = new BarGraphSeries<>(dataPoints.toArray(new DataPoint[0]));
        series.setColor(Color.GREEN);
        series.setSpacing(20);
        series.setAnimated(true);
        series.setDrawValuesOnTop(true);
        series.setValuesOnTopColor(Color.BLACK);

        graph.addSeries(series);

        // Configure graph
        graph.getViewport().setXAxisBoundsManual(true);
        graph.getViewport().setMinX(-0.5);
        graph.getViewport().setMaxX(data.getValues().size() - 0.5);
        graph.getViewport().setYAxisBoundsManual(true);
        graph.getViewport().setMinY(0);

        GridLabelRenderer renderer = graph.getGridLabelRenderer();
        renderer.setHorizontalAxisTitle("Day");
        renderer.setVerticalAxisTitle("Calories (kcal)");
        renderer.setPadding(32);
        renderer.setTextSize(14f);
        renderer.setGridColor(Color.LTGRAY);
        renderer.setHorizontalLabelsColor(Color.BLACK);
        renderer.setVerticalLabelsColor(Color.BLACK);

        // Set day labels
        if (data.getLabels() != null && !data.getLabels().isEmpty()) {
            StaticLabelsFormatter formatter = new StaticLabelsFormatter(graph);
            String[] labels = data.getLabels().toArray(new String[0]);
            formatter.setHorizontalLabels(labels);
            graph.getGridLabelRenderer().setLabelFormatter(formatter);
        }

        // Add reference line for weekly average
        if (data.getAverages() != null) {
            double avg = data.getAverages().getWeekly();
            LineGraphSeries<DataPoint> avgSeries = new LineGraphSeries<>(new DataPoint[]{
                    new DataPoint(-0.5, avg),
                    new DataPoint(data.getValues().size() - 0.5, avg)
            });
            avgSeries.setColor(Color.RED);
            avgSeries.setThickness(2);
            avgSeries.setDrawBackground(false);
            avgSeries.setTitle("Weekly Average: " + String.format("%.1f kcal", avg));
            graph.addSeries(avgSeries);

            // Add legend
            graph.getLegendRenderer().setVisible(true);
            graph.getLegendRenderer().setFixedPosition(0, 0);
        }

        graph.setTitle("Average Calories Burned per Day");
        graph.getGridLabelRenderer().setHumanRounding(false);

        chartsContainer.addView(graph);

        // Add summary text
        if (data.getAverages() != null) {
            TextView summary = new TextView(this);
            summary.setText("📈 Weekly Average: " + String.format("%.1f kcal", data.getAverages().getWeekly()));
            summary.setTextSize(14);
            summary.setTextColor(Color.DKGRAY);
            summary.setPadding(16, 8, 16, 16);
            chartsContainer.addView(summary);
        }
    }

    @Deprecated
    private void loadYearlyDistanceChart() {
        // MongoDB removed - use MySQL health metrics endpoints instead
        addChartTitle("Walking/Running Distance: This Year vs Last Year");
        addNoDataMessage("Chart data migration in progress.");
        return;
        /*
        Call<Map<String, Object>> call = mongoApiService.getGraphData(
                "Bearer " + getAuthToken(),
                "yearly_distance",
                365,
                false
        );

        call.enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                if (response.isSuccessful()) {
                    Map<String, Object> responseBody = response.body();
                    if (responseBody != null && (Boolean) responseBody.get("success")) {
                        try {
                            String jsonData = new Gson().toJson(responseBody.get("data"));
                            GraphData graphData = new Gson().fromJson(jsonData, GraphData.class);
                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    createYearlyDistanceChart(graphData);
                                }
                            });
                        } catch (Exception e) {
                            Log.e(TAG, "Error parsing yearly distance data: " + e.getMessage());
                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    addNoDataMessage("Error loading distance chart");
                                }
                            });
                        }
                    }
                } else {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            addNoDataMessage("No yearly distance data available");
                        }
                    });
                }
            }

            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                Log.e(TAG, "Error loading yearly distance chart: " + t.getMessage());
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        addNoDataMessage("Error loading distance data");
                    }
                });
            }
        });
        */
    }

    private void createYearlyDistanceChart(GraphData data) {
        if (data == null || data.getValues() == null || data.getValues().size() < 2) {
            addNoDataMessage("No yearly distance data available");
            return;
        }

        GraphView graph = new GraphView(this);
        setupGraphLayout(graph);

        // Create horizontal bar effect
        List<DataPoint> dataPoints = new ArrayList<>();
        String[] labels = {"2025", "2024"};

        for (int i = 0; i < Math.min(2, data.getValues().size()); i++) {
            dataPoints.add(new DataPoint(i, data.getValues().get(i)));
        }

        BarGraphSeries<DataPoint> series = new BarGraphSeries<>(dataPoints.toArray(new DataPoint[0]));
        series.setColor(Color.parseColor("#2196F3"));
        series.setSpacing(20);
        series.setAnimated(true);

        graph.addSeries(series);

        // Configure graph
        graph.getViewport().setXAxisBoundsManual(true);
        graph.getViewport().setMinX(-0.5);
        graph.getViewport().setMaxX(1.5);
        graph.getViewport().setYAxisBoundsManual(true);
        graph.getViewport().setMinY(0);

        GridLabelRenderer renderer = graph.getGridLabelRenderer();
        renderer.setHorizontalAxisTitle("Year");
        renderer.setVerticalAxisTitle("Distance (km/day)");
        renderer.setPadding(32);
        renderer.setTextSize(14f);
        renderer.setGridColor(Color.LTGRAY);
        renderer.setHorizontalLabelsColor(Color.BLACK);
        renderer.setVerticalLabelsColor(Color.BLACK);

        // Set year labels
        StaticLabelsFormatter formatter = new StaticLabelsFormatter(graph);
        formatter.setHorizontalLabels(labels);
        graph.getGridLabelRenderer().setLabelFormatter(formatter);

        graph.setTitle("Average Daily Distance: This Year vs Last Year");
        graph.getGridLabelRenderer().setHumanRounding(false);

        chartsContainer.addView(graph);

        // Add comparison text
        if (data.getComparisons() != null) {
            TextView comparison = new TextView(this);
            double currentYear = data.getValues().get(0);
            double lastYear = data.getValues().get(1);
            double change = data.getComparisons().getPercentage_change();

            String changeText;
            int color;
            if (change > 0) {
                changeText = String.format("▲ %.1f%% increase from last year", change);
                color = Color.GREEN;
            } else if (change < 0) {
                changeText = String.format("▼ %.1f%% decrease from last year", Math.abs(change));
                color = Color.RED;
            } else {
                changeText = "No change from last year";
                color = Color.GRAY;
            }

            comparison.setText(changeText);
            comparison.setTextColor(color);
            comparison.setTextSize(14);
            comparison.setPadding(16, 8, 16, 16);
            chartsContainer.addView(comparison);
        }
    }

    @Deprecated
    private void loadHourlyStepsChart() {
        // MongoDB removed - use MySQL health metrics endpoints instead
        addChartTitle("Hourly Steps: Today vs Typical Day");
        addNoDataMessage("Chart data migration in progress.");
        return;
        /*
        Call<Map<String, Object>> call = mongoApiService.getGraphData(
                "Bearer " + getAuthToken(),
                "hourly_steps",
                7,
                false
        );

        call.enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                if (response.isSuccessful()) {
                    Map<String, Object> responseBody = response.body();
                    if (responseBody != null && (Boolean) responseBody.get("success")) {
                        try {
                            String jsonData = new Gson().toJson(responseBody.get("data"));
                            GraphData graphData = new Gson().fromJson(jsonData, GraphData.class);
                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    createHourlyStepsChart(graphData);
                                }
                            });
                        } catch (Exception e) {
                            Log.e(TAG, "Error parsing hourly steps data: " + e.getMessage());
                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    addNoDataMessage("Error loading steps chart");
                                }
                            });
                        }
                    }
                } else {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            addNoDataMessage("No hourly steps data available");
                        }
                    });
                }
            }

            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                Log.e(TAG, "Error loading hourly steps chart: " + t.getMessage());
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        addNoDataMessage("Error loading steps data");
                    }
                });
            }
        });
        */
    }

    private void createHourlyStepsChart(GraphData data) {
        if (data == null || data.getDatasets() == null || data.getDatasets().isEmpty()) {
            addNoDataMessage("No hourly steps data available");
            return;
        }

        GraphView graph = new GraphView(this);
        setupGraphLayout(graph);

        // Create hourly labels (0-23)
        String[] hourlyLabels = new String[24];
        for (int i = 0; i < 24; i++) {
            String ampm = i < 12 ? "AM" : "PM";
            int hour = i % 12;
            if (hour == 0) hour = 12;
            hourlyLabels[i] = hour + ampm;
        }

        // Find today's dataset
        Dataset todayDataset = null;
        Dataset averageDataset = null;

        for (Dataset dataset : data.getDatasets()) {
            if ("Today".equals(dataset.getLabel())) {
                todayDataset = dataset;
            } else if ("Typical Day".equals(dataset.getLabel()) || "Average".equals(dataset.getLabel())) {
                averageDataset = dataset;
            }
        }

        // Add today's steps
        if (todayDataset != null) {
            List<DataPoint> todayPoints = new ArrayList<>();
            for (int i = 0; i < Math.min(24, todayDataset.getValues().size()); i++) {
                todayPoints.add(new DataPoint(i, todayDataset.getValues().get(i)));
            }

            if (!todayPoints.isEmpty()) {
                LineGraphSeries<DataPoint> todaySeries = new LineGraphSeries<>(todayPoints.toArray(new DataPoint[0]));
                todaySeries.setColor(Color.parseColor("#2196F3"));
                todaySeries.setTitle("Today");
                todaySeries.setThickness(4);
                todaySeries.setDrawBackground(true);
                todaySeries.setBackgroundColor(Color.argb(50, 33, 150, 243));
                todaySeries.setDrawDataPoints(true);
                todaySeries.setDataPointsRadius(6f);

                graph.addSeries(todaySeries);
            }
        }

        // Add average steps
        if (averageDataset != null) {
            List<DataPoint> avgPoints = new ArrayList<>();
            for (int i = 0; i < Math.min(24, averageDataset.getValues().size()); i++) {
                avgPoints.add(new DataPoint(i, averageDataset.getValues().get(i)));
            }

            if (!avgPoints.isEmpty()) {
                LineGraphSeries<DataPoint> avgSeries = new LineGraphSeries<>(avgPoints.toArray(new DataPoint[0]));
                avgSeries.setColor(Color.parseColor("#FF9800"));
                avgSeries.setTitle("Typical Day");
                avgSeries.setThickness(3);
                avgSeries.setDrawBackground(false);
                avgSeries.setDrawDataPoints(true);
                avgSeries.setDataPointsRadius(4f);

                graph.addSeries(avgSeries);
            }
        }

        // Configure graph
        graph.getViewport().setXAxisBoundsManual(true);
        graph.getViewport().setMinX(0);
        graph.getViewport().setMaxX(23);
        graph.getViewport().setYAxisBoundsManual(true);
        graph.getViewport().setMinY(0);
        graph.getViewport().setScalable(true);
        graph.getViewport().setScrollable(true);

        GridLabelRenderer renderer = graph.getGridLabelRenderer();
        renderer.setHorizontalAxisTitle("Time of Day");
        renderer.setVerticalAxisTitle("Steps");
        renderer.setPadding(32);
        renderer.setTextSize(14f);
        renderer.setGridColor(Color.LTGRAY);
        renderer.setHorizontalLabelsColor(Color.BLACK);
        renderer.setVerticalLabelsColor(Color.BLACK);
        renderer.setNumHorizontalLabels(6); // Show fewer labels for readability

        // Set time labels
        StaticLabelsFormatter formatter = new StaticLabelsFormatter(graph);
        String[] displayLabels = {"12AM", "4AM", "8AM", "12PM", "4PM", "8PM"};
        formatter.setHorizontalLabels(displayLabels);
        graph.getGridLabelRenderer().setLabelFormatter(formatter);

        // Add legend
        graph.getLegendRenderer().setVisible(true);
        graph.getLegendRenderer().setAlign(com.jjoe64.graphview.LegendRenderer.LegendAlign.TOP);

        graph.setTitle("Hourly Step Count Comparison");
        graph.getGridLabelRenderer().setHumanRounding(false);

        chartsContainer.addView(graph);

        // Add current steps if available
        if (data.getCurrent_value() != null) {
            CurrentValue current = data.getCurrent_value();
            if (current != null) {
                TextView currentSteps = new TextView(this);
                int hour = current.getHour();
                int steps = current.getSteps();

                currentSteps.setText("📍 Current: " + steps + " steps at " + hourlyLabels[Math.min(hour, 23)]);
                currentSteps.setTextColor(Color.BLUE);
                currentSteps.setTextSize(14);
                currentSteps.setPadding(16, 8, 16, 16);
                chartsContainer.addView(currentSteps);
            }
        }
    }

    private void addSectionTitle(String title) {
        TextView titleView = new TextView(this);
        titleView.setText(title);
        titleView.setTextSize(20);
        titleView.setTextColor(Color.BLACK);
        titleView.setPadding(16, 24, 16, 16);
        titleView.setTextAlignment(TextView.TEXT_ALIGNMENT_CENTER);
        chartsContainer.addView(titleView);
    }

    private void addChartTitle(String title) {
        TextView chartTitle = new TextView(this);
        chartTitle.setText(title);
        chartTitle.setTextSize(16);
        chartTitle.setTextColor(Color.DKGRAY);
        chartTitle.setPadding(16, 24, 16, 8);
        chartTitle.setTextAlignment(TextView.TEXT_ALIGNMENT_CENTER);
        chartsContainer.addView(chartTitle);
    }

    private void setupGraphLayout(GraphView graph) {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 400);
        params.setMargins(16, 8, 16, 32);
        graph.setLayoutParams(params);
        graph.setBackgroundColor(Color.WHITE);
    }

    private void addNoDataMessage(String message) {
        TextView noData = new TextView(this);
        noData.setText(message);
        noData.setTextSize(14);
        noData.setTextColor(Color.GRAY);
        noData.setPadding(16, 16, 16, 32);
        noData.setTextAlignment(TextView.TEXT_ALIGNMENT_CENTER);
        chartsContainer.addView(noData);
    }

    private String getAuthToken() {
        SharedPreferences prefs = getSharedPreferences("health_app", MODE_PRIVATE);
        String token = prefs.getString("auth_token", "demo_token");
        return token != null ? token : "demo_token";
    }
}