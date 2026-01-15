package com.campobite.testing.tests;

import com.campobite.testing.base.BaseTest;
import com.campobite.testing.pages.CartPage;
import com.campobite.testing.pages.DashboardPage;
import com.campobite.testing.pages.LoginPage;
import com.campobite.testing.pages.MenuPage;
import com.campobite.testing.utils.ConfigReader;
import org.testng.Assert;
import org.testng.annotations.Test;

public class OrderTest extends BaseTest {

    @Test
    public void testPlaceOrder() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(ConfigReader.getProperty("student.username"),
                ConfigReader.getProperty("student.password"));

        DashboardPage dashboardPage = new DashboardPage(driver);
        dashboardPage.navigateToMenu();

        MenuPage menuPage = new MenuPage(driver);
        menuPage.addFirstItemToCart();

        dashboardPage.navigateToCart();
        CartPage cartPage = new CartPage(driver);
        cartPage.proceedToCheckout();

        // Assert order placed (url change or success message)
        // Assert.assertTrue(driver.getCurrentUrl().contains("order-success"));
    }
}
