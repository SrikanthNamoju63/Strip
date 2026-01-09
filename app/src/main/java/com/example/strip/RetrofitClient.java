package com.example.strip;

import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import java.util.concurrent.TimeUnit;

public class RetrofitClient {
    // Base URL for your backend - Updated to port 3001 for MongoDB backend
    public static final String BASE_URL = "http://10.0.2.2:3001/";

    private static Retrofit retrofit = null;

    /**
     * Get ApiService
     */
    public static ApiService getApiService() {
        if (retrofit == null) {
            retrofit = createRetrofitInstance(BASE_URL);
        }
        return retrofit.create(ApiService.class);
    }

    /**
     * Create a Retrofit instance with standard configuration
     */
    private static Retrofit createRetrofitInstance(String baseUrl) {
        // Create logging interceptor
        HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
        logging.setLevel(HttpLoggingInterceptor.Level.BODY);

        // Create OkHttp client with timeouts
        OkHttpClient client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .addInterceptor(logging)
                .build();

        return new Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build();
    }

    // Helper method to get full image URL
    public static String getImageUrl(String imagePath) {
        if (imagePath == null || imagePath.isEmpty()) {
            return null;
        }

        // Handle cases where imagePath might already contain full path
        if (imagePath.startsWith("http")) {
            return imagePath;
        }

        // Remove leading slash if present in imagePath
        if (imagePath.startsWith("/")) {
            imagePath = imagePath.substring(1);
        }

        return BASE_URL + "uploads/profiles/" + imagePath;
    }

    // Helper method to get base URL without trailing slash
    public static String getBaseUrl() {
        String baseUrl = BASE_URL;
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl;
    }

    // Helper method to check if URL is valid
    public static boolean isValidImageUrl(String imagePath) {
        return imagePath != null && !imagePath.isEmpty();
    }
}
