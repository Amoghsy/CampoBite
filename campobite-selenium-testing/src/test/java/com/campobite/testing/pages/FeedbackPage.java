package com.campobite.testing.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import java.time.Duration;
import java.util.List;

public class FeedbackPage {
    private WebDriver driver;
    private WebDriverWait wait;

    // Locators
    private By feedbackTitle = By.xpath("//h2[contains(text(), 'Rate Your Order')]");
    // Locating the 5 star buttons within the container following the label
    private By starButtons = By.xpath("//span[contains(text(), 'How was your food?')]/following-sibling::div/button");
    private By foodQualityGood = By.xpath("//div[text()='Good']");
    private By deliverySpeedFast = By.xpath("//div[text()='Fast']");
    private By recommendYes = By.xpath("//button[contains(., 'Yes')]");
    private By commentBox = By.xpath("//textarea[@placeholder='Tell us what you liked or how we can improve...']");
    private By submitButton = By.xpath("//button[contains(., 'Submit Feedback')]");

    public FeedbackPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(5));
    }

    public boolean isFeedbackDisplayed() {
        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(feedbackTitle));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public void submitFeedback() {
        // 1. Rate 5 stars
        List<WebElement> stars = driver.findElements(starButtons);
        if (stars.size() >= 5) {
            stars.get(4).click(); // Click the 5th star
        } else {
            throw new RuntimeException("Could not find 5 star rating buttons");
        }

        // 2. Select Food Quality: Good
        // Use explicit wait for interactivity if needed, but standard click usually
        // sufficient if visible
        driver.findElement(foodQualityGood).click();

        // 3. Select Delivery Speed: Fast
        driver.findElement(deliverySpeedFast).click();

        // 4. Recommend: Yes
        driver.findElement(recommendYes).click();

        // 5. Comment
        WebElement comment = driver.findElement(commentBox);
        comment.clear();
        comment.sendKeys("Great service! The food was delicious.");

        // 6. Submit
        driver.findElement(submitButton).click();

        // Optional: Wait for the modal to close or success message
        // For now, we assume the test continues or asserts unrelated state,
        // passing control back to the test immediately after click.
        try {
            // Short wait to ensure click registers before navigation happens (if any)
            Thread.sleep(500);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
