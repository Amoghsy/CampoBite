package com.campobite.testing.utils;

import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.apache.commons.io.FileUtils;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

public class ScreenshotUtil {

    public static void takeScreenshot(WebDriver driver, String testName) {
        File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
        String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
        String destPath = "target/screenshots/" + testName + "_" + timestamp + ".png";

        try {
            FileUtils.copyFile(srcFile, new File(destPath));
            System.out.println("Screenshot saved: " + destPath);
        } catch (IOException e) {
            System.out.println("Failed to save screenshot: " + e.getMessage());
        }
    }
}
