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

        ds.setDriverType(driver);
        logger.info("Using Driver " + driver);
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
}
