package com.campobite.testing.tests;

import com.campobite.testing.base.BaseTest;
import com.campobite.testing.pages.CartPage;
import com.campobite.testing.pages.DashboardPage;
import com.campobite.testing.pages.LoginPage;
import com.campobite.testing.pages.MenuPage;
import com.campobite.testing.utils.ConfigReader;
import org.testng.Assert;
import org.testng.annotations.Test;

public class CartTest extends BaseTest {

    @Test
    public void testAddToCart() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(ConfigReader.getProperty("student.username"),
                ConfigReader.getProperty("student.password"));

        DashboardPage dashboardPage = new DashboardPage(driver);
        dashboardPage.navigateToMenu();

        MenuPage menuPage = new MenuPage(driver);
        menuPage.addFirstItemToCart();

        // Verify toast or notification if possible

        dashboardPage.navigateToCart();
        CartPage cartPage = new CartPage(driver);
        Assert.assertTrue(cartPage.isItemInCart(), "Item should be in cart");
    }
}
