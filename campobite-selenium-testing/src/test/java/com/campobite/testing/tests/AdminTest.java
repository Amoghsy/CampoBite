package com.campobite.testing.tests;

import com.campobite.testing.base.BaseTest;
import com.campobite.testing.pages.AdminPage;
import com.campobite.testing.pages.LoginPage;
import com.campobite.testing.utils.ConfigReader;
import org.testng.Assert;
import org.testng.annotations.Test;

public class AdminTest extends BaseTest {

    @Test
    public void testAdminLogin() {
        LoginPage loginPage = new LoginPage(driver);
        loginPage.login(ConfigReader.getProperty("admin.username"),
                ConfigReader.getProperty("admin.password"));

        AdminPage adminPage = new AdminPage(driver);
        Assert.assertTrue(adminPage.isAdminPageLoaded(), "Admin dashboard should load");
    }
}
