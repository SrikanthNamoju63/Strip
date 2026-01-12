package com.example.strip;

import java.util.List;
import java.util.Map;

import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.Call;
import retrofit2.http.*;

public interface ApiService {

        // =============================================================
        // AUTHENTICATION ENDPOINTS
        // =============================================================

        @POST("api/auth/signup")
        Call<Map<String, Object>> signup(@Body User user);

        @POST("api/auth/login")
        Call<Map<String, Object>> login(@Body LoginRequest loginRequest);

        @POST("api/auth/verify")
        Call<Map<String, Object>> verifyToken(@Header("Authorization") String authToken);

        @POST("api/auth/forgot-password")
        Call<Map<String, Object>> forgotPassword(@Body Map<String, String> body);

        @POST("api/auth/verify-otp")
        Call<Map<String, Object>> verifyOtp(@Body Map<String, String> body);

        @POST("api/auth/reset-password")
        Call<Map<String, Object>> resetPassword(@Body Map<String, String> body);

        // =============================================================
        // PROFILE ENDPOINTS - FIXED: Remove duplicate /api/
        // =============================================================

        @GET("api/profile/{userId}")
        Call<Map<String, Object>> getProfile(@Path("userId") int userId);

        @PUT("api/profile/{userId}")
        Call<Map<String, Object>> updateProfile(
                        @Path("userId") int userId,
                        @Body Map<String, Object> profileData);

        // Upload profile image
        @Multipart
        @POST("api/profile/{userId}/upload-image")
        Call<Map<String, Object>> uploadProfileImage(
                        @Path("userId") int userId,
                        @Part MultipartBody.Part profile_image);

        // =============================================================
        // APPOINTMENTS ENDPOINTS
        // =============================================================

        @GET("api/appointments/{userId}")
        Call<List<Appointment>> getAppointments(@Path("userId") int userId);

        @POST("api/appointments/book")
        Call<Map<String, Object>> bookAppointment(@Body AppointmentRequest appointment);

        @POST("api/appointments/{appointmentId}/contacted")
        Call<Map<String, Object>> markAppointmentContacted(@Path("appointmentId") int appointmentId);

        @POST("api/appointments/{appointmentId}/extend")
        Call<Map<String, Object>> extendAppointmentValidity(
                        @Path("appointmentId") int appointmentId,
                        @Body Map<String, Object> extensionData);

        @GET("api/appointments/{appointmentId}/status")
        Call<Map<String, Object>> getAppointmentStatus(@Path("appointmentId") int appointmentId);

        // =============================================================
        // DOCTORS ENDPOINTS
        // =============================================================

        @GET("api/doctors")
        Call<List<Doctor>> getDoctors();

        @POST("api/appointments/book-compat")
        Call<Map<String, Object>> bookAppointmentCompat(@Body AppointmentRequest appointmentRequest);

        @GET("api/doctors/specialization/{specialization}")
        Call<List<Doctor>> getDoctorsBySpecialization(@Path("specialization") String specialization);

        @GET("api/doctors/search")
        Call<List<Doctor>> searchDoctors(
                        @Query("location") String location,
                        @Query("keywords") String keywords,
                        @Query("specialization") String specialization);

        @GET("api/doctors/advanced-search")
        Call<List<Doctor>> advancedSearchDoctors(
                        @Query("location") String location,
                        @Query("keywords") String keywords,
                        @Query("specialization") String specialization,
                        @Query("minExperience") Integer minExperience,
                        @Query("maxExperience") Integer maxExperience,
                        @Query("minRating") Float minRating,
                        @Query("maxFee") Float maxFee,
                        @Query("languages") String languages);

        @GET("api/doctors/specializations/list")
        Call<List<Map<String, Object>>> getSpecializations();

        @GET("api/doctors/popular-locations")
        Call<List<PopularLocation>> getPopularLocations();

        @GET("api/doctors/{doctorId}/availability")
        Call<List<Availability>> getDoctorAvailability(@Path("doctorId") String doctorId);

        // =============================================================
        // BLOOD DONOR ENDPOINTS
        // =============================================================

        @GET("api/blood/donors")
        Call<List<Donor>> searchDonors(
                        @Query("blood_group") String bloodGroup,
                        @Query("location") String location);

        @POST("api/blood/register-donor")
        Call<Map<String, Object>> registerDonor(@Body DonorRegistration donorRegistration);

        @POST("api/blood/update-availability")
        Call<Map<String, Object>> updateDonorAvailability(@Body Map<String, Object> body);

        @POST("api/blood/delete-donor")
        Call<Map<String, Object>> deleteDonor(@Body Map<String, Object> body);

        // =============================================================
        // HEALTH METRICS ENDPOINTS - FIXED: Remove duplicate /api/
        // =============================================================

        @POST("api/health/save-metrics")
        Call<Map<String, Object>> saveHealthMetrics(@Header("Authorization") String authToken,
                        @Body Map<String, Object> metrics);

        @POST("api/health/save-prediction")
        Call<Map<String, Object>> saveRiskPrediction(@Header("Authorization") String authToken,
                        @Body Map<String, Object> predictionData);

        @GET("api/health/recent-metrics")
        Call<Map<String, Object>> getRecentMetrics(@Header("Authorization") String authToken,
                        @Query("limit") int limit);

        @GET("api/health/latest-prediction")
        Call<Map<String, Object>> getLatestPrediction(@Header("Authorization") String authToken);

        @GET("api/health/steps-data")
        Call<Map<String, Object>> getStepsData(@Header("Authorization") String authToken);

        @GET("api/health/heart-rate-data")
        Call<Map<String, Object>> getHeartRateData(@Header("Authorization") String authToken);

        @GET("api/health/sleep-data")
        Call<Map<String, Object>> getSleepData(@Header("Authorization") String authToken);

        @GET("api/health/calorie-data")
        Call<Map<String, Object>> getCalorieData(@Header("Authorization") String authToken, @Query("days") int days);

        @GET("api/health/chart-data")
        Call<Map<String, Object>> getChartData(
                        @Header("Authorization") String authToken,
                        @Query("type") String type,
                        @Query("days") int days);

        // =============================================================
        // HEALTH HISTORY & MEDICAL RECORDS
        // =============================================================

        @GET("api/profile/{userId}/health-history")
        Call<List<HealthHistory>> getHealthHistory(@Path("userId") int userId);

        @POST("api/profile/{userId}/health-history")
        Call<Map<String, Object>> addHealthHistory(
                        @Path("userId") int userId,
                        @Body Map<String, String> healthData);

        @DELETE("api/profile/{userId}/health-history/{historyId}")
        Call<Map<String, Object>> deleteHealthHistory(
                        @Path("userId") int userId,
                        @Path("historyId") int historyId);

        @GET("api/profile/{userId}/allergies")
        Call<List<Allergy>> getAllergies(@Path("userId") int userId);

        @POST("api/profile/{userId}/allergies")
        Call<Map<String, Object>> addAllergy(
                        @Path("userId") int userId,
                        @Body Map<String, String> allergyData);

        @DELETE("api/profile/{userId}/allergies/{allergyId}")
        Call<Map<String, Object>> deleteAllergy(
                        @Path("userId") int userId,
                        @Path("allergyId") int allergyId);

        @GET("api/profile/{userId}/medications")
        Call<List<Medication>> getMedications(@Path("userId") int userId);

        @POST("api/profile/{userId}/medications")
        Call<Map<String, Object>> addMedication(
                        @Path("userId") int userId,
                        @Body Map<String, String> medicationData);

        @DELETE("api/profile/{userId}/medications/{medicationId}")
        Call<Map<String, Object>> deleteMedication(
                        @Path("userId") int userId,
                        @Path("medicationId") int medicationId);

        @GET("api/profile/{userId}/documents")
        Call<List<HealthDocument>> getHealthDocuments(@Path("userId") int userId);

        @Multipart
        @POST("api/profile/{userId}/documents")
        Call<Map<String, Object>> uploadHealthDocument(
                        @Path("userId") int userId,
                        @Part("document_type") RequestBody documentType,
                        @Part("document_name") RequestBody documentName,
                        @Part("uploaded_date") RequestBody uploadedDate,
                        @Part("description") RequestBody description,
                        @Part MultipartBody.Part document);

        @DELETE("api/profile/{userId}/documents/{documentId}")
        Call<Map<String, Object>> deleteHealthDocument(
                        @Path("userId") int userId,
                        @Path("documentId") int documentId);

        @POST("api/profile/{userId}/change-password")
        Call<Map<String, Object>> changePassword(
                        @Path("userId") int userId,
                        @Body Map<String, String> passwordData);

        // =============================================================
        // BANNER ENDPOINTS
        // =============================================================

        @GET("api/banners")
        Call<Map<String, Object>> getBanners();
}