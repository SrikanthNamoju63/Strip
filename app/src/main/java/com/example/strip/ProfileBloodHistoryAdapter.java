package com.example.strip;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class ProfileBloodHistoryAdapter extends RecyclerView.Adapter<ProfileBloodHistoryAdapter.ViewHolder> {

    private List<BloodHistory> list;
    private Context context;

    public ProfileBloodHistoryAdapter(Context context, List<BloodHistory> list) {
        this.context = context;
        this.list = list;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        // Use the new card layout
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_blood_donation_card, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        BloodHistory h = list.get(position);

        holder.tvPlaceName.setText(h.getPlace() != null ? h.getPlace() : "Unknown Place");
        holder.tvBloodGroupTag.setText((h.getBlood_group() != null ? h.getBlood_group() : "-") + " Blood");
        holder.tvLocationName.setText(h.getPlace() != null ? h.getPlace() : "Unknown"); // Reuse place if no separate
                                                                                        // city

        String dateStr = h.getDonated_date();
        try {
            if (dateStr != null && dateStr.contains("T")) {
                SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
                Date date = isoFormat.parse(dateStr);
                SimpleDateFormat displayFormat = new SimpleDateFormat("dd MMM, yyyy 'at' hh:mm a", Locale.US);
                holder.tvDonationDate.setText(displayFormat.format(date));
            } else {
                holder.tvDonationDate.setText(dateStr);
            }
        } catch (Exception e) {
            holder.tvDonationDate.setText(dateStr);
        }
    }

    @Override
    public int getItemCount() {
        return list.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvPlaceName, tvBloodGroupTag, tvLocationName, tvDonationDate;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvPlaceName = itemView.findViewById(R.id.tvPlaceName);
            tvBloodGroupTag = itemView.findViewById(R.id.tvBloodGroupTag);
            tvLocationName = itemView.findViewById(R.id.tvLocationName);
            tvDonationDate = itemView.findViewById(R.id.tvDonationDate);
        }
    }
}
