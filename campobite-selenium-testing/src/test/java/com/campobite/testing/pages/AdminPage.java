package com.campobite.testing.pages;

import com.campobite.testing.utils.WaitUtils;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

public class AdminPage {
    private WebDriver driver;

    @FindBy(id = "admin-dashboard-header")
    private WebElement header;

    @FindBy(id = "manage-menu-btn")
    private WebElement manageMenuBtn;

    public AdminPage(WebDriver driver) {
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }

    public boolean isAdminPageLoaded() {
        try {
            WaitUtils.waitForVisibility(driver, header, 10);
            return header.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }
}
