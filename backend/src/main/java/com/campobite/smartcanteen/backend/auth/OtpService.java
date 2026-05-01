package com.campobite.smartcanteen.backend.auth;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final int OTP_LENGTH = 6;
    private static final long OTP_EXPIRY_SECONDS = 300; // 5 minutes

    private final SecureRandom random = new SecureRandom();

    private record OtpEntry(String otp, Instant expiresAt) {
    }

    private final ConcurrentHashMap<String, OtpEntry> store = new ConcurrentHashMap<>();

    /**
     * Generate a 6-digit OTP for the given email and store it.
     */
    public String generateOtp(String email) {
        String otp = String.format("%06d", random.nextInt(1_000_000));
        store.put(email.toLowerCase(),
                new OtpEntry(otp, Instant.now().plusSeconds(OTP_EXPIRY_SECONDS)));
        return otp;
    }

    /**
     * Verify the OTP for the given email. Returns true if valid and not expired.
     * Removes the OTP on successful verification.
     */
    public boolean verifyOtp(String email, String otp) {
        OtpEntry entry = store.get(email.toLowerCase());
        if (entry == null) {
            return false;
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            store.remove(email.toLowerCase());
            return false;
        }
        if (entry.otp().equals(otp)) {
            store.remove(email.toLowerCase());
            return true;
        }
        return false;
    }
}
