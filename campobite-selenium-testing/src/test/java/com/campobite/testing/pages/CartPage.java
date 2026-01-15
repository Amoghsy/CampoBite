package com.campobite.testing.pages;

import com.campobite.testing.utils.WaitUtils;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

public class CartPage {
    private WebDriver driver;

    @FindBy(id = "checkout-btn")
    private WebElement checkoutButton;

    @FindBy(css = ".cart-item")
    private WebElement cartItem;

    public CartPage(WebDriver driver) {
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }

    public boolean isItemInCart() {
        try {
            WaitUtils.waitForVisibility(driver, cartItem, 5);
            return cartItem.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public void proceedToCheckout() {
        WaitUtils.waitForClickability(driver, checkoutButton, 10);
        checkoutButton.click();
    }
}
