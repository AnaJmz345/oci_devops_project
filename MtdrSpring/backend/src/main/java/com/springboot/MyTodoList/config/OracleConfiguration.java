package com.springboot.MyTodoList.config;


import oracle.jdbc.pool.OracleDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;


import javax.sql.DataSource;
import java.sql.SQLException;
///*
//    This class grabs the appropriate values for OracleDataSource,
//    The method that uses env, grabs it from the environment variables set
//    in the docker container. The method that uses dbSettings is for local testing
//    @author: peter.song@oracle.com
// */
//
//
@Configuration
public class OracleConfiguration {
    Logger logger = LoggerFactory.getLogger(DbSettings.class);
    @Autowired
    private DbSettings dbSettings;
    @Autowired
    private Environment env;
    @Bean
    public DataSource dataSource() throws SQLException{
        OracleDataSource ds = new OracleDataSource();
        String driver = firstConfiguredValue(
                env.getProperty("spring.datasource.driver-class-name"),
                env.getProperty("driver_class_name"),
                dbSettings.getDriver_class_name());
        String url = firstConfiguredValue(
                env.getProperty("spring.datasource.url"),
                env.getProperty("db_url"),
                dbSettings.getUrl());
        String username = firstConfiguredValue(
                env.getProperty("spring.datasource.username"),
                env.getProperty("db_user"),
                dbSettings.getUsername());
        String password = firstConfiguredValue(
                env.getProperty("spring.datasource.password"),
                env.getProperty("dbpassword"),
                dbSettings.getPassword());

        validateOracleConfiguration(url, username, password);

        if (isOracleDriverType(driver)) {
            ds.setDriverType(driver);
            logger.info("Using Oracle driver type " + driver);
        } else {
            logger.info("Using Oracle JDBC driver class " + driver);
        }
        ds.setURL(url);
        logger.info("Using URL: " + url);
        ds.setUser(username);
        logger.info("Using Username " + username);
        ds.setPassword(password);

        return ds;
    }

    private String firstConfiguredValue(String... values) {
        for (String value : values) {
            if (value != null && !value.trim().isEmpty()) {
                return value;
            }
        }
        return null;
    }

    private void validateOracleConfiguration(String url, String username, String password) {
        if (url == null || url.trim().isEmpty()) {
            throw new IllegalStateException("Missing Oracle database URL. Set SPRING_DATASOURCE_URL or run locally with: mvn spring-boot:run \"-Dspring-boot.run.profiles=local\"");
        }
        if (!url.trim().startsWith("jdbc:oracle:")) {
            throw new IllegalStateException("Invalid Oracle database URL. Expected it to start with jdbc:oracle:, but got: " + url);
        }
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalStateException("Missing Oracle database username. Set SPRING_DATASOURCE_USERNAME or spring.datasource.username.");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalStateException("Missing Oracle database password. Set SPRING_DATASOURCE_PASSWORD or spring.datasource.password.");
        }
    }

    private boolean isOracleDriverType(String driver) {
        if (driver == null) {
            return false;
        }
        String value = driver.trim().toLowerCase();
        return value.equals("thin") || value.equals("oci") || value.equals("kprb");
    }
}
