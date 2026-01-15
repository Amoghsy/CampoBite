package com.campobite.testing.tests;

import com.campobite.testing.base.BaseTest;
import com.campobite.testing.pages.DashboardPage;
import com.campobite.testing.pages.LoginPage;
import com.campobite.testing.pages.MenuPage;
import com.campobite.testing.utils.ConfigReader;
import org.testng.Assert;
import org.testng.annotations.Test;

public class MenuTest extends BaseTest {

    @Test
    public void testMenuDisplay() {
        // Login first
        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(ConfigReader.getProperty("student.username"),
                ConfigReader.getProperty("student.password"));

        // Navigate to menu
        DashboardPage dashboardPage = new DashboardPage(driver);
        dashboardPage.navigateToMenu();

        MenuPage menuPage = new MenuPage(driver);
        Assert.assertTrue(menuPage.getMenuItemCount() > 0, "Menu should have items");
    }
}
