package com.campobite.smartcanteen.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void init() {

        try {

            String firebaseJson = System.getenv("FIREBASE_SERVICE_ACCOUNT_JSON");

            if (firebaseJson == null || firebaseJson.isBlank()) {
                throw new RuntimeException(
                        "Environment variable FIREBASE_SERVICE_ACCOUNT_JSON is missing.");
            }

            // Handle escaped newlines in the private key
            firebaseJson = firebaseJson.replace("\\n", "\n");

            InputStream serviceAccount = new ByteArrayInputStream(
                    firebaseJson.getBytes(StandardCharsets.UTF_8));

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("🔥 Firebase initialized successfully.");
            } else {
                System.out.println("Firebase already initialized.");
            }

            serviceAccount.close();

        } catch (Exception e) {
            System.err.println("❌ Firebase initialization failed.");
            e.printStackTrace();
        }
    }
}
