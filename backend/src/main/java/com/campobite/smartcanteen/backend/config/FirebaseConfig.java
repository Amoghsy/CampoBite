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
/*
package com.campobite.smartcanteen.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void init() {
        try {
            File renderSecret = new File("/etc/secrets/firebase-service-account.json");

            System.out.println("DEBUG → Secret exists: " + renderSecret.exists());
            System.out.println("DEBUG → Secret readable: " + renderSecret.canRead());
            System.out.println("DEBUG → Secret path: " + renderSecret.getAbsolutePath());

            InputStream serviceAccount;

            if (renderSecret.exists()) {
                serviceAccount = new FileInputStream(renderSecret);
                System.out.println("Using Render secret file");
            } else {
                serviceAccount =
                        new FileInputStream("src/main/resources/serviceAccountKey.json");
                System.out.println("Using local Firebase key");
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("🔥 Firebase initialized");
            }

        } catch (Exception e) {
            System.err.println("❌ Firebase initialization failed");
            e.printStackTrace();
        }
    }

}
*/