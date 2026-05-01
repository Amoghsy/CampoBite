package com.campobite.smartcanteen.backend.notification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.Map;

@Service
public class GoogleScriptEmailService {

    @Value("${google.script.url}")
    private String scriptUrl;

    @Value("${google.script.secret}")
    private String secretKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendSignupOtp(String toEmail, String name, String otp) {

        String subject = "✉️ Verify Your Email - CampoBite";

        String htmlContent = """
                <html>
                <body style="font-family: Arial; text-align:center;">
                    <h2>Hello %s,</h2>
                    <p>Your verification OTP is:</p>
                    <h1 style="color:#27b08b;">%s</h1>
                    <p>Valid for 5 minutes.</p>
                </body>
                </html>
                """.formatted(name, otp);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = Map.of(
                    "key", secretKey,
                    "to", toEmail,
                    "subject", subject,
                    "html", htmlContent
            );

            HttpEntity<Map<String, String>> request =
                    new HttpEntity<>(body, headers);

            restTemplate.postForEntity(scriptUrl, request, String.class);

        } catch (Exception e) {
            System.out.println("Google Script OTP Email Failed");
            e.printStackTrace();
        }
    }
}