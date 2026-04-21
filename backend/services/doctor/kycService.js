/**
 * Doctor KYC & Verification Service
 * Integrates with Veriff for identity verification and Medical Council for license validation
 * Ensures only qualified doctors can offer consultations
 */

const axios = require('axios');
const Doctor = require('../../models/Doctor');
const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');

class DoctorKYCService {
  constructor() {
    this.verifUrl = process.env.VERIFF_API_URL || 'https://api.veriff.me';
    this.verifToken = process.env.VERIFF_API_TOKEN;
    this.medicalCouncilBase = process.env.MEDICAL_COUNCIL_API_URL;
  }

  /**
   * Initiate KYC verification for doctor
   * Returns Veriff verification session link
   */
  async initiateKYC(doctorId) {
    try {
      const doctor = await Doctor.findById(doctorId).populate('userId');

      if (!doctor) throw new Error('Doctor not found');
      if (doctor.verificationStatus !== 'PENDING') {
        throw new Error(`Cannot initiate KYC for doctor with status: ${doctor.verificationStatus}`);
      }

      // Create Veriff session
      const veriffSession = await axios.post(
        `${this.verifUrl}/v1/sessions`,
        {
          verification: {
            document: {
              type: 'PASSPORT' // or 'NATIONAL_ID', 'DRIVERS_LICENSE'
            },
            person: {
              firstName: doctor.userId.firstName || doctor.userId.name.split(' ')[0],
              lastName: doctor.userId.lastName || doctor.userId.name.split(' ')[1] || '',
              dateOfBirth: doctor.dateOfBirth // Must be YYYY-MM-DD
            }
          },
          features: {
            // Advanced verification features
            selfie: true,
            livenessCheck: true,
            livenessFaceMatch: true
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.verifToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Save session reference
      doctor.kyc = {
        verifSessionId: veriffSession.data.verification.id,
        verifStatus: 'STARTED',
        initiatedAt: new Date()
      };

      await doctor.save();

      // Audit log
      await AuditLog.create({
        module: 'DOCTOR_KYC',
        action: 'KYC_INITIATED',
        targetId: doctorId,
        metadata: {
          verifSessionId: veriffSession.data.verification.id
        }
      });

      return {
        sessionId: veriffSession.data.verification.id,
        verificationUrl: veriffSession.data.verification.url, // Send to frontend
        expiresAt: new Date(veriffSession.data.verification.created + 3600000) // 1 hour
      };
    } catch (err) {
      console.error('KYC initiation error:', err);
      throw err;
    }
  }

  /**
   * Handle Veriff webhook callback
   * Called when user completes verification
   */
  async handleVeriffCallback(sessionId, verdict) {
    try {
      const doctor = await Doctor.findOne({ 'kyc.verifSessionId': sessionId });

      if (!doctor) throw new Error('Doctor not found for session');

      // Update KYC status
      doctor.kyc.verifStatus = verdict.verification.status; // approved, declined, abandoned
      doctor.kyc.completedAt = new Date();
      doctor.kyc.verdict = {
        status: verdict.verification.status,
        code: verdict.verification.decisionCode,
        reason: verdict.verification.reason
      };

      if (verdict.verification.status === 'approved') {
        // Extract verified identity information
        doctor.kyc.verifiedIdentity = {
          firstName: verdict.verification.person?.firstName,
          lastName: verdict.verification.person?.lastName,
          dateOfBirth: verdict.verification.person?.dateOfBirth,
          country: verdict.verification.person?.country,
          documentType: verdict.verification.document?.type
        };

        doctor.kycStatus = 'IDENTITY_VERIFIED';

        // Now proceed to medical license verification
        // This happens in parallel or next step
        const licenseVerified = await this.verifyMedicalLicense(doctor);

        if (licenseVerified) {
          doctor.verificationStatus = 'APPROVED';
          doctor.approvedAt = new Date();
        } else {
          doctor.verificationStatus = 'LICENSE_PENDING';
        }
      } else if (verdict.verification.status === 'declined') {
        doctor.kycStatus = 'IDENTITY_FAILED';
        doctor.verificationStatus = 'REJECTED';
        doctor.rejectionReason = verdict.verification.reason || 'KYC verification failed';
      } else if (verdict.verification.status === 'abandoned') {
        doctor.kycStatus = 'KYC_ABANDONED';
        // Keep as PENDING for retry
      }

      await doctor.save();

      // Audit log
      await AuditLog.create({
        module: 'DOCTOR_KYC',
        action: 'KYC_COMPLETED',
        targetId: doctor._id,
        metadata: {
          verdict: verdict.verification.status,
          kycStatus: doctor.kycStatus,
          verificationStatus: doctor.verificationStatus
        }
      });

      return {
        doctorId: doctor._id,
        kycStatus: doctor.kycStatus,
        verificationStatus: doctor.verificationStatus
      };
    } catch (err) {
      console.error('Veriff webhook error:', err);
      throw err;
    }
  }

  /**
   * Verify medical license against medical council database
   * Supports multiple councils (NMC India, GMC UK, etc.)
   */
  async verifyMedicalLicense(doctor) {
    try {
      if (!doctor.registrationNumber) {
        console.log('No registration number provided');
        return false;
      }

      // Determine which medical council API to use based on country
      let licenseVerified = false;

      if (doctor.country === 'IN') {
        // India - National Medical Commission (NMC)
        licenseVerified = await this.verifyNMCLicense(doctor.registrationNumber);
      } else if (doctor.country === 'UK') {
        // UK - General Medical Council (GMC)
        licenseVerified = await this.verifyGMCLicense(doctor.registrationNumber);
      } else if (doctor.country === 'US') {
        // US - State medical board verification
        licenseVerified = await this.verifyUSLicense(doctor.registrationNumber, doctor.state);
      }

      if (licenseVerified) {
        doctor.licenseVerification = {
          status: 'VERIFIED',
          verifiedAt: new Date(),
          verificationBody: this.getVerificationBody(doctor.country)
        };
      } else {
        doctor.licenseVerification = {
          status: 'INVALID',
          verifiedAt: new Date(),
          verificationBody: this.getVerificationBody(doctor.country)
        };
      }

      await doctor.save();

      // Audit
      await AuditLog.create({
        module: 'DOCTOR_LICENSE',
        action: 'LICENSE_VERIFICATION',
        targetId: doctor._id,
        metadata: {
          registrationNumber: doctor.registrationNumber,
          country: doctor.country,
          verified: licenseVerified
        }
      });

      return licenseVerified;
    } catch (err) {
      console.error('Medical license verification error:', err);
      return false;
    }
  }

  /**
   * Verify against Indian Medical Council (NMC)
   */
  async verifyNMCLicense(registrationNumber) {
    try {
      // In production: call actual NMC API
      // For now: mock implementation
      const councilApiUrl = process.env.NMC_API_URL;

      if (!councilApiUrl) {
        console.log('NMC API not configured - skipping verification');
        return null; // Return null to indicate manual verification needed
      }

      const response = await axios.get(`${councilApiUrl}/doctors/${registrationNumber}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NMC_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      // Check various response fields
      const isValid = response.data && response.data.status === 'VALID' && response.data.active === true;

      if (isValid) {
        return {
          valid: true,
          name: response.data.name,
          specialization: response.data.specialization,
          registrationDate: response.data.registrationDate,
          expiryDate: response.data.expiryDate,
          status: response.data.status
        };
      }

      return false;
    } catch (err) {
      console.error('NMC verification error:', err);
      return null; // Return null to indicate need for manual verification
    }
  }

  /**
   * Verify against GMC (UK)
   */
  async verifyGMCLicense(registrationNumber) {
    try {
      // GMC has a public search API
      const response = await axios.get('https://www.gmc-uk.org/search', {
        params: {
          query: registrationNumber,
          pageNo: 1
        },
        timeout: 10000
      });

      // Parse response to determine if registered and in good standing
      const isValid = response.status === 200 && response.data.results?.length > 0;

      return isValid;
    } catch (err) {
      console.error('GMC verification error:', err);
      return null;
    }
  }

  /**
   * Verify US medical licenses
   */
  async verifyUSLicense(registrationNumber, state) {
    try {
      // Each US state has different license board
      // This is a placeholder for state-specific verification

      const stateBoards = {
        'CA': 'https://www.mbc.ca.gov/applicants/',
        'NY': 'https://www.op.nysed.gov/prof/med/',
        'TX': 'https://www.tmc.state.tx.us/'
      };

      const boardUrl = stateBoards[state];

      if (!boardUrl) {
        console.log(`No API configured for state: ${state}`);
        return null;
      }

      // In production: Integrate with state board API
      // For now: return null for manual verification

      return null;
    } catch (err) {
      console.error('US license verification error:', err);
      return null;
    }
  }

  /**
   * Get verification body based on country
   */
  getVerificationBody(country) {
    const bodies = {
      'IN': 'National Medical Commission (NMC)',
      'UK': 'General Medical Council (GMC)',
      'US': 'State Medical Board',
      'CA': 'College of Physicians of Canada'
    };

    return bodies[country] || 'Medical Council';
  }

  /**
   * Manual verification by admin
   * For doctors where automated verification is unavailable
   */
  async manualVerification(doctorId, adminComments, credentials = []) {
    try {
      const doctor = await Doctor.findById(doctorId);

      if (!doctor) throw new Error('Doctor not found');

      doctor.manualVerification = {
        verifiedBy: adminComments.verifiedByAdminId,
        verifiedAt: new Date(),
        credentials: credentials, // Array of document URLs
        comments: adminComments.comments,
        status: 'APPROVED'
      };

      doctor.verificationStatus = 'APPROVED';
      driver.approvedAt = new Date();

      await doctor.save();

      // Audit log
      await AuditLog.create({
        module: 'DOCTOR_VERIFICATION',
        action: 'MANUAL_VERIFICATION_APPROVED',
        targetId: doctorId,
        userId: adminComments.verifiedByAdminId,
        metadata: {
          comments: adminComments.comments,
          credentialCount: credentials.length
        }
      });

      return { success: true, message: 'Doctor manually verified' };
    } catch (err) {
      console.error('Manual verification error:', err);
      throw err;
    }
  }

  /**
   * Reject doctor verification
   */
  async rejectVerification(doctorId, reason) {
    try {
      const doctor = await Doctor.findById(doctorId);

      if (!doctor) throw new Error('Doctor not found');

      doctor.verificationStatus = 'REJECTED';
      doctor.rejectionReason = reason;
      doctor.rejectedAt = new Date();

      await doctor.save();

      // Audit
      await AuditLog.create({
        module: 'DOCTOR_VERIFICATION',
        action: 'VERIFICATION_REJECTED',
        targetId: doctorId,
        metadata: {
          reason
        }
      });

      // Send email to doctor
      console.log(`Doctor ${doctorId} verification rejected: ${reason}`);

      return { success: true, message: 'Verification rejected' };
    } catch (err) {
      console.error('Verification rejection error:', err);
      throw err;
    }
  }

  /**
   * Get verification status for doctor
   */
  async getVerificationStatus(doctorId) {
    try {
      const doctor = await Doctor.findById(doctorId).select(
        'verificationStatus kycStatus licenseVerification kyc manualVerification'
      );

      if (!doctor) throw new Error('Doctor not found');

      return {
        doctorId,
        overallStatus: doctor.verificationStatus,
        kycStatus: doctor.kycStatus,
        licenseVerification: doctor.licenseVerification,
        kyc: {
          sessionId: doctor.kyc?.verifSessionId,
          status: doctor.kyc?.verifStatus,
          initiatedAt: doctor.kyc?.initiatedAt,
          completedAt: doctor.kyc?.completedAt
        },
        manualVerification: doctor.manualVerification,
        timeline: {
          initiatedAt: doctor.createdAt,
          approvedAt: doctor.approvedAt,
          rejectedAt: doctor.rejectedAt
        }
      };
    } catch (err) {
      console.error('Get verification status error:', err);
      throw err;
    }
  }
}

module.exports = new DoctorKYCService();
