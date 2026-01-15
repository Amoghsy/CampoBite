# CampoBite Selenium Testing

This module contains the automated UI tests for the CampoBite application using Selenium WebDriver, Java, and TestNG.

## Prerequisites

- Java JDK 17+
- Maven 3.8+
- Chrome Browser (or other supported browsers)

## Project Structure

The project follows the Page Object Model (POM) design pattern:

- `src/test/java/com/campobite/testing/base`: Base test class handling driver initialization.
- `src/test/java/com/campobite/testing/pages`: Page classes representing web pages.
- `src/test/java/com/campobite/testing/tests`: Test classes containing TestNG tests.
- `src/test/java/com/campobite/testing/utils`: Utility classes.
- `src/test/resources`: Configuration files.

## Running Tests

To run all tests defined in `testng.xml`:

```bash
mvn test
```

To run a specific test class:

```bash
mvn -Dtest=LoginTest test
```

## Configuration

Update `src/test/resources/config.properties` to change the browser, base URL, or timeouts.
