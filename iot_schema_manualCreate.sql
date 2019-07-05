-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema iot
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `iot` ;

-- -----------------------------------------------------
-- Schema iot
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `iot` DEFAULT CHARACTER SET utf8 ;
USE `iot` ;

-- -----------------------------------------------------
-- Table `iot`.`customers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `iot`.`customers` (
  `customerID` INT NOT NULL,
  `firstName` VARCHAR(45) NULL,
  `lastName` VARCHAR(45) NULL,
  `gender` CHAR(1) NULL,
  `dob` DATE NULL,
  `householdIncome` MEDIUMINT NULL,
  `householdCount` TINYINT NULL,
  `maritalStatus` VARCHAR(10) NULL,
  `city` VARCHAR(45) NULL,
  `state` VARCHAR(45) NULL,
  `zipcode` MEDIUMINT NULL,
  PRIMARY KEY (`customerID`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `iot`.`orders`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `iot`.`orders` (
  `orderID` INT NOT NULL AUTO_INCREMENT,
  `status` VARCHAR(10) NOT NULL DEFAULT 'pending',
  `createTime` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `loadTime` TIMESTAMP NULL,
  `fulfillTime` TIMESTAMP NULL,
  `customerID` INT NOT NULL,
  PRIMARY KEY (`orderID`),
  CONSTRAINT `FK_customers_orders`
    FOREIGN KEY (`customerID`)
    REFERENCES `iot`.`customers` (`customerID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `iot`.`bots`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `iot`.`bots` (
  `botID` INT NOT NULL,
  `status` VARCHAR(20) NULL,
  `moving` TINYINT NOT NULL DEFAULT 0,
  `channel` TINYINT NOT NULL,
  `tripID` INT NULL,
  PRIMARY KEY (`botID`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `iot`.`trips`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `iot`.`trips` (
  `tripID` INT NOT NULL AUTO_INCREMENT,
  `botID` INT NOT NULL,
  `recArrivalTime` TIMESTAMP NULL,
  `recDepartureTime` TIMESTAMP NULL,
  `shipArrivalTime` TIMESTAMP NULL,
  `shipDepartureTime` TIMESTAMP NULL,
  `tripEndTime` TIMESTAMP NULL,
  `maintenance_start` TIMESTAMP NULL,
  `maintenance_stop` TIMESTAMP NULL,
  PRIMARY KEY (`tripID`),
  CONSTRAINT `FK_bots_trips`
    FOREIGN KEY (`botID`)
    REFERENCES `iot`.`bots` (`botID`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

-- -----------------------------------------------------
-- Table `iot`.`products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `iot`.`products` (
  `productID` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `qtyInStock` INT NOT NULL DEFAULT 0,
  `assignedBot` INT NOT NULL,
  `maxBotQty` TINYINT NOT NULL,
  PRIMARY KEY (`productID`),
  CONSTRAINT `FK_bots_products`
    FOREIGN KEY (`assignedBot`)
    REFERENCES `iot`.`bots` (`botID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `iot`.`orderProducts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `iot`.`orderProducts` (
  `orderID` INT NOT NULL,
  `productID` INT NOT NULL,
  `qtyOrdered` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`orderID`, `productID`),
  CONSTRAINT `FK_orders_orderProducts`
    FOREIGN KEY (`orderID`)
    REFERENCES `iot`.`orders` (`orderID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `FK_products_orderProducts`
    FOREIGN KEY (`productID`)
    REFERENCES `iot`.`products` (`productID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `iot`.`tripOrderProducts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `iot`.`tripOrderProducts` (
  `tripID` INT NOT NULL,
  `orderID` INT NOT NULL,
  `productID` INT NOT NULL,
  `qtyOnTrip` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`tripID`, `orderID`, `productID`),
  CONSTRAINT `FK_orders_tripOrderProducts`
    FOREIGN KEY (`orderID`)
    REFERENCES `iot`.`orders` (`orderID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `FK_trips_tripOrderProducts`
    FOREIGN KEY (`tripID`)
    REFERENCES `iot`.`trips` (`tripID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `FK_products_tripOrderProducts`
    FOREIGN KEY (`productID`)
    REFERENCES `iot`.`products` (`productID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

ALTER TABLE `bots`  
ADD CONSTRAINT `FK_trips_bots` 
    FOREIGN KEY (`tripID`)
    REFERENCES `iot`.`trips` (`tripID`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

INSERT INTO bots (botID, bots.channel) VALUES (11, 11);
INSERT INTO bots (botID, bots.channel) VALUES (12, 12);

INSERT INTO products (products.name, assignedBot, maxBotQty) VALUES ('Red', 11, 8);
INSERT INTO products (products.name, assignedBot, maxBotQty) VALUES ('Green', 11, 18);
INSERT INTO products (products.name, assignedBot, maxBotQty) VALUES ('Blue', 11, 27);
INSERT INTO products (products.name, assignedBot, maxBotQty) VALUES ('Black', 12, 8);
INSERT INTO products (products.name, assignedBot, maxBotQty) VALUES ('Yellow', 12, 11);
INSERT INTO products (products.name, assignedBot, maxBotQty) VALUES ('White', 12, 28);

-- in order to manually create this database the users.csv must be placed into a specific 
-- directory that is provided permissions by default for uploading csv's into a MySql database.
-- The code below loads the users.csv from the required directory within my (Benjamin's) machine. 
-- Run the following command to determine that directory: SHOW VARIABLES LIKE 'secure_file_priv';

LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/users.csv'
INTO TABLE customers 
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\r\n'
IGNORE 1 LINES
	(
		customerID, firstName, lastName, gender, @dob,
        householdIncome, householdCount, maritalStatus,
        city, state, zipcode
    )
SET dob = STR_TO_DATE(@dob, '%d/%m/%Y');