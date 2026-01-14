package com.example.strip;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class BloodHistoryAdapter extends RecyclerView.Adapter<BloodHistoryAdapter.ViewHolder> {

    private List<BloodHistory> list;
    private Context context;

    public BloodHistoryAdapter(Context context, List<BloodHistory> list) {
        this.context = context;
        this.list = list;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_blood_history, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        BloodHistory h = list.get(position);

        holder.tvBloodGroup.setText(h.getBlood_group());
        holder.tvPlace.setText(h.getPlace() != null ? h.getPlace() : "Unknown");

        String dateStr = h.getDonated_date();
        try {
            // Convert ISO date (if needed) or just display
            if (dateStr.contains("T")) {
                SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
                Date date = isoFormat.parse(dateStr);
                SimpleDateFormat displayFormat = new SimpleDateFormat("dd MMM yyyy", Locale.US);
                holder.tvDate.setText(displayFormat.format(date));
            } else {
                holder.tvDate.setText(dateStr);
            }
        } catch (Exception e) {
            holder.tvDate.setText(dateStr);
        }
    }

    @Override
    public int getItemCount() {
        return list.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvBloodGroup, tvPlace, tvDate;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvBloodGroup = itemView.findViewById(R.id.tvBloodGroup);
            tvPlace = itemView.findViewById(R.id.tvPlace);
            tvDate = itemView.findViewById(R.id.tvDate);
        }
    }
}
