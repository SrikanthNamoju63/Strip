import React, { useRef } from 'react';
import { Download, QrCode, Share2, Copy } from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

const STETHOSCOPE_SVG_B64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik00LjggMi4zQS4zLjMgMCAxIDAgNSAySDRhMiAyIDAgMCAwLTIgMnY1YTYgNiAwIDAgMCA2IDZ2MGE2IDYgMCAwIDAgNi02VjRhMiAyIDAgMCAwLTItMmgtMWEuMi4yIDAgMSAwIC4zLjMiLz48cGF0aCBkPSJNOCAxNXYxYTYgNiAwIDAgMCA2IDZ2MGE2IDYgMCAwIDAgNi02di00Ii8+PGNpcmNsZSBjeD0iMjAiIGN5PSIxMCIgcj0iMiIvPjwvc3ZnPg==";

const DoctorQRCode = ({ profile }) => {
    const qrRef = useRef(null);

    // Provide a deep link or web fallback
    const qrData = `healthpredict://doctor/${profile?._id}`;
    
    const downloadQR = () => {
        const canvas = qrRef.current.querySelector('canvas');
        if (canvas) {
            try {
                const qrDataUrl = canvas.toDataURL("image/png");
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                
                // 1. Draw outer background (Google Pay Blue style)
                pdf.setFillColor(30, 115, 232); // #1E73E8
                pdf.rect(0, 0, pageWidth, pageHeight, 'F');

                // 2. Draw inner white card with rounded corners
                const margin = 15;
                const cardWidth = pageWidth - (margin * 2);
                const cardHeight = pageHeight - (margin * 2);
                pdf.setFillColor(255, 255, 255);
                pdf.roundedRect(margin, margin, cardWidth, cardHeight, 8, 8, 'F');

                let yPos = margin + 25;
                
                // 3. Top Company Name: "Dr Strip" text logo
                pdf.setFontSize(36);
                pdf.setFont("helvetica", "bold");
                const w1 = pdf.getTextWidth("Dr ");
                const w2 = pdf.getTextWidth("Strip");
                const startX = pageWidth / 2 - (w1 + w2) / 2;
                
                pdf.setTextColor(0, 51, 102); // Navy Blue
                pdf.text("Dr ", startX, yPos);
                pdf.setTextColor(0, 153, 153); // Teal
                pdf.text("Strip", startX + w1, yPos);
                
                yPos += 8;
                
                // 4. "Book your appointment here"
                pdf.setFontSize(14);
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(110, 110, 110);
                pdf.text("Book your appointment here", pageWidth / 2, yPos, { align: 'center' });
                
                yPos += 15;

                // 5. Separator Line
                pdf.setDrawColor(220, 220, 220);
                pdf.line(margin + 20, yPos, pageWidth - margin - 20, yPos);

                yPos += 20;

                // 6. Doctor Name
                pdf.setFontSize(26);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(40, 40, 40);
                pdf.text(`Dr. ${profile?.name || ''}`, pageWidth / 2, yPos, { align: 'center' });
                
                yPos += 8;

                // 7. Specialization
                pdf.setFontSize(16);
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(120, 120, 120);
                pdf.text(profile?.specialization || 'Healthcare Professional', pageWidth / 2, yPos, { align: 'center' });

                yPos += 15;

                // 8. Draw QR Code in Center
                const qrSize = 120;
                const xOffset = (pageWidth - qrSize) / 2;
                pdf.addImage(qrDataUrl, 'PNG', xOffset, yPos, qrSize, qrSize);
                
                yPos += qrSize + 10;

                // 9. Doctor ID text
                pdf.setFontSize(10);
                pdf.setTextColor(160, 160, 160);
                pdf.text(`doctor_id: ${profile?._id}`, pageWidth / 2, yPos, { align: 'center' });

                yPos += 25;

                // 10. Bottom Footer Instruction
                pdf.setFontSize(14);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(70, 70, 70);
                pdf.text("Scan using the Dr Strip App", pageWidth / 2, yPos, { align: 'center' });

                // Download
                pdf.save(`DrStrip-${profile?.name?.replace(/\s+/g, '-') || 'QR'}.pdf`);
                toast.success('QR Code PDF downloaded successfully!');
            } catch(e) {
                console.error("PDF Export Error: ", e);
                toast.error('Failed to generate PDF.');
            }
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(qrData);
        toast.success("Doctor App Link copied!");
    };

    if (!profile) return null;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
            <h3 className="text-lg font-bold text-gray-900 w-full mb-4 flex items-center gap-2">
                <QrCode size={20} className="text-primary" />
                Clinic QR Code
            </h3>
            
            <p className="text-sm text-gray-500 mb-6 text-center">
                Patients can scan this to directly book appointments with you.
            </p>

            <div 
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group" 
                ref={qrRef}
            >
                <QRCodeCanvas 
                    value={qrData}
                    size={200}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"} 
                    level={"H"}
                    includeMargin={true}
                    imageSettings={{
                        src: STETHOSCOPE_SVG_B64,
                        x: undefined,
                        y: undefined,
                        height: 48,
                        width: 48,
                        excavate: true,
                    }}
                />
            </div>

            <h4 className="font-bold text-gray-900 mt-4">Dr. {profile?.name}</h4>
            <p className="text-sm text-gray-500 mb-6">{profile?.specialization || 'Healthcare Professional'}</p>

            <div className="flex gap-3 w-full max-w-xs">
                <button 
                    onClick={downloadQR}
                    className="flex-1 bg-primary text-white py-2.5 px-4 rounded-xl font-medium text-sm shadow-md shadow-primary/20 hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                >
                    <Download size={16} />
                    Download
                </button>
                <button 
                    onClick={copyLink}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                    <Copy size={16} />
                    Copy Link
                </button>
            </div>
        </div>
    );
};

export default DoctorQRCode;
