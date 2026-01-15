package com.campobite.testing.utils;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

public class ConfigReader {
    private static Properties properties;
    private static final String PROPERTY_FILE_PATH = "src/test/resources/config.properties";

    static {
        try {
            FileInputStream fis = new FileInputStream(PROPERTY_FILE_PATH);
            properties = new Properties();
            properties.load(fis);
        } catch (IOException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to load config.properties file.");
        }
    }

    public static String getProperty(String key) {
        return properties.getProperty(key);
    }
}
