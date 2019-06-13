
/******************************************************************************************************************
* File:REST.js
* Course: IOT, Data Science, Machine Learning
* Project: Fullfillment Center
* Copyright: Copyright (c) 2018 Carnegie Mellon University
* Versions:
*   1.0 April 2018 - Initial write of course order server demo (lattanze).
*
* Description: This module provides the restful webservices for the Server.js Node server. This module contains GET,
* POST, and DELETE services.
*
* Parameters:
*   router - this is the URL from the client
*   connection - this is the connection to the database
*   md5 - This is the md5 hashing/parser... included by convention, but not really used
*
* Internal Methods:
*   router.get("/"... - returns the system version information
*   router.get("/orders"... - returns a listing of everything in the ws_orderinfo database
*   router.get("/orders/:order_id"... - returns the data associated with order_id
*   router.post("/order?"... - adds the new customer data into the ws_orderinfo database
*
* External Dependencies: mysql
*
******************************************************************************************************************/

var mysql = require("mysql");     //Database
var utils = require("./utils.js");


function REST_ROUTER(router, connection) {
    var self = this;
    self.handleRoutes(router, connection);
}

// Here is where we define the routes. Essentially a route is a path taken through the code dependent upon the
// contents of the URL

REST_ROUTER.prototype.handleRoutes = function (router, connection) {

    // GET with no specifier - returns system version information
    // req paramdter is the request object
    // res parameter is the response object

    router.get("/", function (req, res) {
        res.json({ "Message": "Orders Webservices Server Version 1.0" });
    });

    // Modified by CJ - 04/26/2019
    // GET for /now - returns the current simulation time of the server.

    router.get("/now", function (req, res) {
        res.json({ "Now": utils.now().toLocaleString() });
    });

    // GET for /timeconfig - returns the simulation configuration.

    router.get("/timeconfig", function (req, res) {
        res.json(utils.getConfig());
    });

    // GET for /pending specifier - returns all pending orders currently stored in the database
    // req paramdter is the request object
    // res parameter is the response object

    router.get("/pending", function (req, res) {
        console.log("Getting all database entries...");
        var query = "SELECT * FROM ?? WHERE ??=?";
        var table = ["orders", "status", "pending"];
        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({ "Error": err, "Message": "Error executing MySQL query" });
            } else {
                res.json({ "Error": false, "Message": "Success", "Orders": rows });
            }
        });
    });

    // GET for /pending/id specifier - returns the pending order for the provided order ID
    // req paramdter is the request object
    // res parameter is the response object

    router.get("/pending/:id", function (req, res) {
        console.log("Getting order ID: ", req.params.id);
        var query = "SELECT * FROM ?? WHERE ??=? AND ??=?";
        var table = ["orders", "orderID", req.params.id, "status", "pending"];
        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({ "Error": true, "Message": "Error executing MySQL query" });
            } else {
                res.json({ "Error": false, "Message": "Success", "Users": rows });
            }
        });
    });

    // GET for /pendingcustorders specifier - returns the order for the provided order ID
    // req paramdter is the request object
    // res parameter is the response object

    router.get("/pendingcustorders/:customer", function (req, res) {
        console.log("Getting orders for: ", req.params.customer);
        var query = "SELECT * FROM ?? WHERE ??=? AND ??=?";
        var table = ["orders", "customerID", req.params.customer, "status", "pending"];
        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({ "Error": true, "Message": "Error executing MySQL query" });
            } else {
                res.json({ "Error": false, "Message": "Success", "Users": rows });
            }
        });
    });

    // GET for /filled specifier - returns all filled orders currently stored in the database
    // req paramdter is the request object
    // res parameter is the response object

    router.get("/filled", function (req, res) {
        console.log("Getting all database entries...");
        var query = "SELECT * FROM ?? WHERE ??=?";
        var table = ["orders", "status", "filled"];
        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({ "Error": true, "Message": "Error executing MySQL query" });
            } else {
                res.json({ "Error": false, "Message": "Success", "Orders": rows });
            }
        });
    });

    // GET for /filledcustorders specifier - returns the filled orders for the specified customer
    // req paramdter is the request object
    // res parameter is the response object

    router.get("/filledcustorders/:customer", function (req, res) {
        console.log("Getting orders for: ", req.params.customer);
        var query = "SELECT * FROM ?? WHERE ??=? AND ??=?";
        var table = ["orders", "customerID", req.params.customer, "status", "filled"];
        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({ "Error": true, "Message": "Error executing MySQL query" });
            } else {
                res.json({ "Error": false, "Message": "Success", "Users": rows });
            }
        });
    });

    // POST for making a pending order as satisfied for the provided order ID
    // This moves the order specified by ID to the fulfilled table.
    // req paramdter is the request object
    // res parameter is the response object

    router.post("/markOrderFilled/:id", function (req, res) {
        console.log("Marking fulfilled order ID: ", req.params.id);
        var query = "UPDATE ?? SET ??=?, ??=? WHERE ??=?"
        // var table = ["orders", "pending", false, "filldate", new (Date), "id", req.params.id];
        // Modified by CJ - 04/25/2019
        // Use the simulation time to write database.
        var table = ["orders", "status", "filled", "fulfillTime", utils.now(), "orderID", req.params.id];

        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({ "Error": true, "Message": "Error executing MySQL query" });
            } else {
                res.json({ "Error": false, "Message": "Order marked filled", "Users": rows });
            }
        });
    });

    // POST for adding orders
    // req paramdter is the request object - note to get parameters (eg. stuff afer the '?') you must use req.body.param
    // res parameter is the response object

    router.post("/neworder", function (req, res) {
        console.log("Adding order::", req.body.customer, ",", req.body.red, ",", req.body.blue, ",", req.body.green, ",", req.body.yellow, ",", req.body.black, ",", req.body.white);
        // Modified by CJ - 04/25/2019
        // Use the simulation time to write database.

        var productIDs = [1, 3, 2, 5, 4, 6];
        var productQtys = [Number(req.body.red), Number(req.body.blue), Number(req.body.green), Number(req.body.yellow), Number(req.body.black), Number(req.body.white)];

        var query = "INSERT INTO ??(??,??) VALUES (?,?)";
        var table = ["orders", "createTime", "customerID", utils.now(), Number(req.body.customer)];

        query = mysql.format(query, table);
        connection.query(query, function(err, rows, fields) {
            // if order insert
            if (err) {
                res.json({ "Error": true, "Message": err });
            } else {

                var query = "SELECT MAX(??) AS ?? FROM ??";
                var table = ["orderID", "orderID", "orders"];

                query = mysql.format(query, table);
                connection.query(query, function(err, result, fields) {
                    console.log(result);
                    console.log(result[0]);
                    console.log(result[0].orderID);

                    if (err) {
                        res.json({ "Error": true, "Message": "Error executing MySQL query" });
                    } 
                    
                    else {

                        var i;
                        for (i=0; i<productQtys.length; i++) {

                            var posts = [];

                            if (productQtys[i] > 0) {

                                // posts.push("INSERT INTO orders (orderID, productID, quantity) VALUES (${rows})
                                
                                var query = "INSERT INTO ??(??,??,??) VALUES (?,?,?)";
                                var table = ["orderProducts", "orderID", "productID", "quantity", result[0].orderID, productIDs[i], productQtys[i]];

                                query = mysql.format(query, table);
                                connection.query(query, function(err, rows, fields) {
                                    if (err) {
                                        res.json({ "Error": true, "Message": "Error executing MySQL query" });
                                    }
                                });
                            }
                        }

                        
                        res.json({ "Error": false, "Message": "Order submitted", "Users": i });
                    }
                });
            }
        });
    });

    // DELETE for deleting a pending order as satisfied for the provided order ID
    // req paramdter is the request object
    // res parameter is the response object

    router.delete("/deleteOrder/:id", function (req, res) {
        console.log("Deleting order ID: ", req.params.id);
        var query = "DELETE FROM ?? WHERE ??=?";
        var table = ["orders", "ordersID", req.params.id];
        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({ "Error": true, "Message": "Error executing MySQL query" });
            } else {
                res.json({ "Error": false, "Message": "Delete order OK", "Users": rows });
            }
        });
    });

    async function insertPorts(posts) {
        for (let post of posts) {
            await connection.insert(post);
        }
    }
}





// The next line just makes this module available... think of it as a kind package statement in Java

module.exports = REST_ROUTER;
