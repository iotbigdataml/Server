-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Table `iot`.`customers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `iot`.`customers` (
  `customerID` INT NOT NULL,
  `firstName` VARCHAR(30) NULL,
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
  `createTime` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `loadTime` TIMESTAMP NULL,
  `fulfillTime` TIMESTAMP NULL,
  `customerID` INT NOT NULL,
  PRIMARY KEY (`orderID`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `iot`.`bots`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `iot`.`bots` (
  `botID` INT NOT NULL,
  `channel` INT NOT NULL,
  PRIMARY KEY (`botID`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `iot`.`products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `iot`.`products` (
  `productID` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `maxPalletQuantity` TINYINT NOT NULL DEFAULT 0,
  `botID` INT NOT NULL,
  PRIMARY KEY (`productID`),
  CONSTRAINT `FK_bots_products`
    FOREIGN KEY (`botID`)
    REFERENCES `iot`.`bots` (`botID`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `iot`.`orderProducts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `iot`.`orderProducts` (
  `orderID` INT NOT NULL,
  `productID` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
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
-- Table `iot`.`pallets`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `iot`.`pallets` (
  `palletID` INT NOT NULL AUTO_INCREMENT,
  `status` VARCHAR(10) NOT NULL DEFAULT 'pending',
  `createTime` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `loadTime` TIMESTAMP NULL,
  `unloadTime` TIMESTAMP NULL,
  `botID` INT NOT NULL,
  PRIMARY KEY (`palletID`),
  CONSTRAINT `FK_bots_pallets`
    FOREIGN KEY (`botID`)
    REFERENCES `iot`.`bots` (`botID`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
COMMENT = '	';


-- -----------------------------------------------------
-- Table `iot`.`orderPallets`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `iot`.`orderPallets` (
  `orderID` INT NOT NULL,
  `palletID` INT NOT NULL,
  `productID` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`orderID`, `palletID`, `productID`),
  CONSTRAINT `FK_orders_orderPallets`
    FOREIGN KEY (`orderID`)
    REFERENCES `iot`.`orders` (`orderID`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `FK_pallets_orderPallets`
    FOREIGN KEY (`palletID`)
    REFERENCES `iot`.`pallets` (`palletID`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `FK_products_orderPallets`
    FOREIGN KEY (`productID`)
    REFERENCES `iot`.`products` (`productID`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

INSERT INTO bots VALUES (11, 11);
INSERT INTO bots VALUES (12, 12);

INSERT INTO products (products.name, maxPalletQuantity, botID) VALUES ('Red', 8, 11);
INSERT INTO products (products.name, maxPalletQuantity, botID) VALUES ('Green', 18, 11);
INSERT INTO products (products.name, maxPalletQuantity, botID) VALUES ('Blue', 27, 11);
INSERT INTO products (products.name, maxPalletQuantity, botID) VALUES ('Black', 8, 12);
INSERT INTO products (products.name, maxPalletQuantity, botID) VALUES ('Yellow', 11, 12);
INSERT INTO products (products.name, maxPalletQuantity, botID) VALUES ('White', 28, 12);