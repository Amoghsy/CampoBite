/*package com.campobite.smartcanteen.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void init() {
        try {
            FileInputStream serviceAccount =
                    new FileInputStream("src/main/resources/serviceAccountKey.json");

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}*/
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

   /* @PostConstruct
    public void init() {
        try {
            InputStream serviceAccount;

            File renderSecret = new File("/etc/secrets/firebase-service-account.json");

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

    */
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
