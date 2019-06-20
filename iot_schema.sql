-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=1;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=1;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

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
  PRIMARY KEY (`botID`))
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
-- Table `iot`.`botTrips`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `iot`.`botTrips` (
  `botTripID` INT NOT NULL AUTO_INCREMENT,
  `botID` INT NOT NULL,
  `createTime` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `departureTime` TIMESTAMP NULL,
  `arrivalTime` TIMESTAMP NULL,
  `outbound` TINYINT NULL,
  PRIMARY KEY (`botTripID`),
  CONSTRAINT `FK_bots_botTrips`
    FOREIGN KEY (`botID`)
    REFERENCES `iot`.`bots` (`botID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `iot`.`botTripOrders`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `iot`.`botTripOrders` (
  `botTripID` INT NOT NULL,
  `orderID` INT NOT NULL,
  `productID` INT NOT NULL,
  `qtyOnTrip` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`botTripID`, `orderID`, `productID`),
  CONSTRAINT `FK_orders_orderBotTrips`
    FOREIGN KEY (`orderID`)
    REFERENCES `iot`.`orders` (`orderID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `FK_botTrips_orderBotTrips`
    FOREIGN KEY (`botTripID`)
    REFERENCES `iot`.`botTrips` (`botTripID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `FK_products_orderPallets`
    FOREIGN KEY (`productID`)
    REFERENCES `iot`.`products` (`productID`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


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

LOAD DATA INFILE '/var/lib/mysql-files/users.csv'
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