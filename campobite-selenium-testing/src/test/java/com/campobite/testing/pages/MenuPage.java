package com.campobite.testing.pages;

import com.campobite.testing.utils.WaitUtils;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

import java.util.List;

public class MenuPage {
    private WebDriver driver;

    @FindBy(css = ".menu-item")
    private List<WebElement> menuItems;

    @FindBy(css = ".add-to-cart-btn")
    private WebElement firstAddToCartBtn;

    public MenuPage(WebDriver driver) {
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }

    public int getMenuItemCount() {
        WaitUtils.waitForVisibility(driver, firstAddToCartBtn, 10);
        return menuItems.size();
    }

    public void addFirstItemToCart() {
        WaitUtils.waitForClickability(driver, firstAddToCartBtn, 10);
        firstAddToCartBtn.click();
    }
}
