const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendBookingConfirmation = async (appointment, doctor, user) => {
    try {
        if (!user.email) {
            console.log('User has no email, skipping confirmation.');
            return;
        }

        const clinicAddress = doctor.clinicAddress;
        let addressString = "Doctor's Clinic";
        if (clinicAddress) {
            addressString = `${clinicAddress.street || ''}, ${clinicAddress.city || ''}, ${clinicAddress.state || ''}`;
        }

        // Generate Google Maps Link
        const encodedAddress = encodeURIComponent(addressString);
        const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Appointment Confirmation - Dr. Strip',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                        <h2 style="color: #2c3e50;">Appointment Confirmed!</h2>
                        <p style="color: #27ae60; font-weight: bold; font-size: 18px;">Payment Successful</p>
                    </div>

                    <div style="padding: 20px 0;">
                        <p>Dear <strong>${user.name}</strong>,</p>
                        <p>Your appointment with <strong>Dr. ${doctor.name}</strong> has been successfully booked.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(appointment.appointmentDate).toDateString()}</p>
                            <p style="margin: 5px 0;"><strong>Time:</strong> ${appointment.appointmentTime}</p>
                            <p style="margin: 5px 0;"><strong>Token Number:</strong> <span style="font-size: 1.2em; color: #e74c3c;">${appointment.tokenNumber}</span></p>
                        </div>

                        <h3>Clinic Details</h3>
                        <p><strong>${doctor.hospitalName || 'Medical Clinic'}</strong></p>
                        <p>${addressString}</p>
                        <p>
                            <a href="${mapsLink}" target="_blank" style="background-color: #3498db; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                Get Directions 📍
                            </a>
                        </p>

                        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 5px solid #f1c40f; margin-top: 20px;">
                            <h4 style="margin-top: 0; color: #856404;">Important Guidelines</h4>
                            <ul style="margin-bottom: 0; padding-left: 20px; color: #856404;">
                                <li>Please arrive 15 minutes before your scheduled time.</li>
                                <li><strong>Bring your previous medical reports and prescriptions if available.</strong></li>
                                <li>Wear a mask if you have flu-like symptoms.</li>
                                <li>Show this email or the Token Number at the reception.</li>
                            </ul>
                        </div>
                    </div>

                    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #7f8c8d; font-size: 12px;">
                        <p>Dr. Strip Platform</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
};

module.exports = {
    sendBookingConfirmation
};
