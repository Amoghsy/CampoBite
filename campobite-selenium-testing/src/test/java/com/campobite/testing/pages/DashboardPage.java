package com.campobite.testing.pages;

import com.campobite.testing.utils.WaitUtils;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

public class DashboardPage {
    private WebDriver driver;

    @FindBy(id = "welcome-message")
    private WebElement welcomeMessage;

    @FindBy(linkText = "Menu")
    private WebElement menuLink;

    @FindBy(linkText = "Cart")
    private WebElement cartLink;

    public DashboardPage(WebDriver driver) {
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }

    public boolean isWelcomeMessageDisplayed() {
        try {
            WaitUtils.waitForVisibility(driver, welcomeMessage, 10);
            return welcomeMessage.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void navigateToMenu() {
        menuLink.click();
    }

    public void navigateToCart() {
        cartLink.click();
    }
}
