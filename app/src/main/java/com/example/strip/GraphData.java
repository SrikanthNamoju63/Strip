package com.example.strip;

import java.util.List;

public class GraphData {
    private List<Double> values;
    private List<String> labels;
    private Averages averages;
    private Comparisons comparisons;
    private List<Dataset> datasets;
    private CurrentValue current_value;

    public List<Double> getValues() {
        return values;
    }

    public void setValues(List<Double> values) {
        this.values = values;
    }

    public List<String> getLabels() {
        return labels;
    }

    public void setLabels(List<String> labels) {
        this.labels = labels;
    }

    public Averages getAverages() {
        return averages;
    }

    public void setAverages(Averages averages) {
        this.averages = averages;
    }

    public Comparisons getComparisons() {
        return comparisons;
    }

    public void setComparisons(Comparisons comparisons) {
        this.comparisons = comparisons;
    }

    public List<Dataset> getDatasets() {
        return datasets;
    }

    public void setDatasets(List<Dataset> datasets) {
        this.datasets = datasets;
    }

    public CurrentValue getCurrent_value() {
        return current_value;
    }

    public void setCurrent_value(CurrentValue current_value) {
        this.current_value = current_value;
    }
}
