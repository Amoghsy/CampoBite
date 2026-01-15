package com.campobite.testing.tests;

import com.campobite.testing.base.BaseTest;
import com.campobite.testing.pages.DashboardPage;
import com.campobite.testing.pages.FeedbackPage;
import com.campobite.testing.pages.LoginPage;
import com.campobite.testing.utils.ConfigReader;
import org.testng.Assert;
import org.testng.annotations.Test;

public class LoginTest extends BaseTest {

    @Test
    public void testStudentLoginWithFeedbackFlow() {

        // Login
        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(
                ConfigReader.getProperty("student.username"),
                ConfigReader.getProperty("student.password")
        );

        // Handle feedback popup
        FeedbackPage feedbackPage = new FeedbackPage(driver);
        if (feedbackPage.isFeedbackDisplayed()) {
            feedbackPage.submitFeedback();
        }

        // Dashboard validation
        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(
                dashboardPage.isWelcomeMessageDisplayed(),
                "Welcome"
        );
    }

    @Test
    public void testInvalidLogin() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.login("invalid", "invalid");

        String validationMessage = loginPage.getEmailValidationMessage();

        Assert.assertTrue(
                validationMessage.contains("@"),
                "Expected browser validation message for invalid email"
        );
    }

}
