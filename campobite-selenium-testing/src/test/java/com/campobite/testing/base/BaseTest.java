package com.campobite.testing.base;

import com.campobite.testing.utils.ConfigReader;
import com.campobite.testing.utils.ScreenshotUtil;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.testng.ITestResult;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;

import java.time.Duration;

public class BaseTest {
    protected WebDriver driver;

    @BeforeMethod
    public void setUp() {
        String browser = ConfigReader.getProperty("browser");
        String baseUrl = ConfigReader.getProperty("baseUrl");
        String headless = ConfigReader.getProperty("headless");

        if (browser.equalsIgnoreCase("chrome")) {
            WebDriverManager.chromedriver().setup();
            ChromeOptions options = new ChromeOptions();
            if (Boolean.parseBoolean(headless)) {
                options.addArguments("--headless");
            }
            driver = new ChromeDriver(options);
        } else if (browser.equalsIgnoreCase("firefox")) {
            WebDriverManager.firefoxdriver().setup();
            driver = new FirefoxDriver();
        }

        driver.manage().window().maximize();
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(
                Long.parseLong(ConfigReader.getProperty("implicitWait"))));

        driver.get(baseUrl);
    }

    @AfterMethod
    public void tearDown(ITestResult result) {
        if (ITestResult.FAILURE == result.getStatus()) {
            ScreenshotUtil.takeScreenshot(driver, result.getName());
        }
        if (driver != null) {
            driver.quit();
        }
    }
}
