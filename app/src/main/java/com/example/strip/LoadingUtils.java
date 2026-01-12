package com.example.strip;

import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;

public class LoadingUtils {

    public static void showLoading(Button button, ProgressBar progressBar) {
        if (button != null && progressBar != null) {
            button.setEnabled(false);
            button.setTag(button.getText().toString()); // Save original text
            button.setText(""); // Hide text
            progressBar.setVisibility(View.VISIBLE);
        }
    }

    public static void hideLoading(Button button, ProgressBar progressBar) {
        if (button != null && progressBar != null) {
            button.setEnabled(true);
            Object originalText = button.getTag();
            if (originalText != null) {
                button.setText(originalText.toString());
            } else {
                // Fallback if tag wasn't set (shouldn't happen if used correctly)
                button.setText("Submit");
            }
            progressBar.setVisibility(View.GONE);
        }
    }
}
