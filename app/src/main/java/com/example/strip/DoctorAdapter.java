package com.example.strip;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

public class DoctorAdapter extends BaseAdapter {

    private Context context;
    private List<Doctor> doctors;
    private LayoutInflater inflater;

    public DoctorAdapter(Context context, List<Doctor> doctors) {
        this.context = context;
        this.doctors = doctors != null ? doctors : new ArrayList<>();
        this.inflater = LayoutInflater.from(context);
    }

    public void updateDoctors(List<Doctor> newDoctors) {
        this.doctors = newDoctors != null ? newDoctors : new ArrayList<>();
        notifyDataSetChanged();
    }

    @Override
    public int getCount() {
        return doctors.size();
    }

    @Override
    public Doctor getItem(int position) {
        return doctors.get(position);
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        ViewHolder holder;

        if (convertView == null) {
            convertView = inflater.inflate(R.layout.item_doctor, parent, false);
            holder = new ViewHolder(convertView);
            convertView.setTag(holder);
        } else {
            holder = (ViewHolder) convertView.getTag();
        }

        Doctor doctor = getItem(position);
        holder.bind(doctor);

        return convertView;
    }

    private static class ViewHolder {
        private TextView tvDoctorName, tvSpecialization, tvHospital, tvExperience;
        private TextView tvEducation, tvPrice, tvLanguages, tvRating;

        ViewHolder(View view) {
            tvDoctorName = view.findViewById(R.id.tvDoctorName);
            tvSpecialization = view.findViewById(R.id.tvSpecialization);
            tvHospital = view.findViewById(R.id.tvHospital);
            tvExperience = view.findViewById(R.id.tvExperience);
            tvEducation = view.findViewById(R.id.tvEducation);
            tvPrice = view.findViewById(R.id.tvPrice);
            tvLanguages = view.findViewById(R.id.tvLanguages);
            tvRating = view.findViewById(R.id.tvRating);
        }

        void bind(Doctor doctor) {
            tvDoctorName.setText(doctor.getDoctor_name() != null ? doctor.getDoctor_name() : "Unknown Doctor");
            tvSpecialization.setText(doctor.getSpecialization_name() != null ? doctor.getSpecialization_name() : "General");
            tvHospital.setText(doctor.getHospital_name() != null ? doctor.getHospital_name() : "Not specified");
            tvExperience.setText(doctor.getExperience() + " years experience");
            tvEducation.setText(doctor.getEducation() != null ? doctor.getEducation() : "Not specified");
            tvPrice.setText("₹" + doctor.getFees());
            tvLanguages.setText("Languages: " + (doctor.getLanguages() != null ? doctor.getLanguages() : "Not specified"));
            tvRating.setText("⭐ " + doctor.getRating() + " (" + doctor.getTotal_reviews() + " reviews)");
        }
    }
}