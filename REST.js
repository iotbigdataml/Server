//import {PythonShell} from 'python-shell';

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
var requests = require('request');

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

    // GET for /orders specifier - returns all pending orders currently stored in the database
    // req paramdter is the request object
    // res parameter is the response object
    // by default, pending orders are returned

    router.get("/orders/:status?", function (req, res) {
        // console.log("Getting all database entries...");

        if (req.params.status == "pending") {
            var query = `SELECT top.orderID, top.productID, top.qtyOnTrip, o.status, b.botID  
                        FROM tripOrderProducts top  
                        JOIN orders o ON top.orderID = o.orderID 
                        JOIN bots b on top.tripID = b.tripID;`;
        } else if (req.params.status == "loaded") {
            var query = `SELECT top.orderID,top.productID,top.qtyOnTrip, o.status
                        FROM tripOrderProducts top 
                        JOIN orders o ON top.orderID = o.orderID
			WHERE o.status = 'loaded';`;
        }

        connection.query(query, function (err, rows) {
            if (err) {
                res.json({ "Error": err, "Message": "Error executing MySQL query" });
            } else {
                res.json({ "Error": false, "Message": "Success", "Orders": rows });
            }
        });
    });

    // POST to update order status
    router.post('/orders/update/:orderID', (req, res) => {
        var query = `UPDATE orders 
                    SET status = '${req.body.status}' 
                    WHERE orderID = ${req.params.orderID}`;

        connection.query(query, (err, rows) => {
            if (err) {
                res.json({ "Error": err, "Message": "Error executing MySQL query" });
            } else {
                if (req.body.status == "loaded") {
                    var query = `UPDATE ?? 
                                SET ?? = COALESCE(??, ?) WHERE ?? = ?`;
                    var table = ["orders", "loadTime", "loadTime", utils.now(), "orderID", req.params.orderID];

                    query = mysql.format(query, table);

                    connection.query(query, (err, rows) => {
                        if (err) {
                            res.json({ "Error": err, "Message": "Error executing MySQL query" });
                        } else {
                            var query = `SELECT productID, qtyOrdered 
                                        FROM orderProducts 
                                        WHERE orderID = '${req.params.orderID}';`;
                            connection.query(query, (err, rows) => {
                                if (err) {
                                    res.json({ "Error": err, "Message": "Error executing MySQL query" });
                                } else {
                                    errors = [];
                                    rows.forEach(element => {
                                        console.log(element);
                                        var query = "UPDATE ?? SET ?? = (?? - ?) WHERE ?? = ?";
                                        var table = ["products", "qtyInStock", "qtyInStock", parseInt(element.qtyOrdered), "productID", element.productID];
                                        query = mysql.format(query, table);
                                        console.log("\n\n\n" + query + "\n\n\n");
                                        connection.query(query, (err, rows) => {
                                            if (err) {
                                                errors.push(err);
                                            }
                                        });
                                    });
                                    if (errors.length > 0) {
                                        res.json({
                                            "errors": errors
                                        })
                                    } else {
                                        res.json({
                                            "status": "Success!"
                                        })
                                    }
                                }
                            })

                            // res.json({ "Error": false, "Message": "Success" });
                        }
                    });
                } else if (req.body.status == "shipped") {
                    var query = `UPDATE ?? 
                                SET ?? = ? WHERE ?? = ?`;
                    var table = ["orders", "fulfillTime", utils.now(), "orderID", req.params.orderID];

                    query = mysql.format(query, table);

                    connection.query(query, (err, rows) => {
                        if (err) {
                            res.json({ "Error": err, "Message": "Error executing MySQL query" });
                        } else {
                            res.json({ "Error": false, "Message": "Success" });
                        }
                    });
                } else if (req.body.status == "returned" && req.body.loaded) {
                    console.log("\n\nReplenishing order\n\n");
                    var query = `SELECT productID, qtyOrdered 
                                FROM orderProducts 
                                WHERE orderID = '${req.params.orderID}';`;
                    connection.query(query, (err, rows) => {
                        if (err) {
                            res.json({ "Error": err, "Message": "Error executing MySQL query" });
                        } else {
                            errors = [];
                            rows.forEach(element => {
                                console.log(element);
                                var query = "UPDATE products SET qtyInStock = qtyInStock + " + Number(element.qtyOrdered) + " WHERE productID = " + element.productID;
                                connection.query(query, (err, rows) => {
                                    if (err) {
                                        errors.push(err);
                                    }
                                });
                            });
                            if (errors.length > 0) {
                                res.json({
                                    "errors": errors
                                })
                            } else {
                                res.json({
                                    "status": "Success!"
                                })
                            }
                        }
                    })
                } else {
                    res.json({ "Error": false, "Message": "Success" });
                }
            }
        })
    })


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
        //console.log("Getting all database entries...");
        var query = "SELECT * FROM ?? WHERE ??=?";
        var table = ["orders", "status", "shipped"];
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
        var table = ["orders", "customerID", req.params.customer, "status", "shipped"];
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

    router.get("/markOrderFilled/:id", function (req, res) {
        console.log("Marking fulfilled order ID: ", req.params.id);
        var query = "UPDATE ?? SET ??=?, ??=? WHERE ??=?"
        // var table = ["orders", "pending", false, "filldate", new (Date), "id", req.params.id];
        // Modified by CJ - 04/25/2019
        // Use the simulation time to write database.
        var table = ["orders", "status", "shipped", "fulfillTime", utils.now(), "orderID", req.params.id];

        query = mysql.format(query, table);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({ "Error": true, "Message": "Error executing MySQL query" });
            } else {
                res.json({ "Error": false, "Message": "Order marked filled", "Users": rows });

                // sending data to kinesis stream of all successful orders
                sendData(req.params.id);
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
        console.log(req.body);
        var productIDs = [1, 3, 2, 5, 4, 6];
        var product_to_bot_map = new Map([[1, 11], [3, 11], [2, 11], [5, 12], [4, 12], [6, 12]])
        var productQtys = [Number(req.body.red), Number(req.body.blue), Number(req.body.green), Number(req.body.yellow), Number(req.body.black), Number(req.body.white)];
        var bot_time_since_rec_arrival
        var num_bots_to_fulfill

        var order_bots = new Set([]);
        for (i = 0; i < productQtys.length; i++) {
            if (productQtys[i] > 0) {
                order_bots.add(product_to_bot_map.get(productIDs[i]));
            }
        }
        num_bots_to_fulfill = order_bots.size;

        var query;
        var table;
        if (num_bots_to_fulfill == 1) {
            query = "SELECT (now() - recArrivalTime) AS time FROM trips WHERE tripID = (SELECT MAX(tripID) FROM trips WHERE botID = ?)"
            table = [order_bots.values().next().value];
        } else {
            query = "SELECT (now() - recArrivalTime) AS time FROM trips WHERE tripID = (SELECT MAX(tripID) FROM trips)";
        }

        query = mysql.format(query, table);
        console.log(query);
        connection.query(query, function (err, rows, fields) {
            if (err) {
                console.log(err)
                res.json({ "Error": true, "Message": err });
            } else {
                console.log(rows);
                if (rows[0]) {
                    bot_time_since_rec_arrival = rows[0].time;
                } else {
                    bot_time_since_rec_arrival = 30; // this value is arbitrary, would preferably use meaningful logic
                }

                var query = "INSERT INTO ?? (??,??,??,??) VALUES (?,?,?,?)";
                var table = ["orders", "createTime", "num_bots_to_fulfill", "bot_time_since_rec_arrival", "customerID",
                    utils.now(), num_bots_to_fulfill, bot_time_since_rec_arrival, Number(req.body.customer)];
                query = mysql.format(query, table);

                console.log(query)
                connection.query(query, function (err, rows, fields) {
                    if (err) {
                        console.log(err)
                        res.json({ "Error": true, "Message": err });
                    } else {
                        var query = "SELECT MAX(??) AS ?? FROM ??";
                        var table = ["orderID", "orderID", "orders"];
                        query = mysql.format(query, table);

                        console.log(query)
                        connection.query(query, function (err, result, fields) {
                            if (err) {
                                res.json({ "Error": err, "Message": "Error executing MySQL query" });
                            } else {

                                for (i = 0; i < productQtys.length; i++) {

                                    var posts = [];

                                    if (productQtys[i] > 0) {

                                        // posts.push("INSERT INTO orders (orderID, productID, quantity) VALUES (${rows})

                                        var query = "INSERT INTO ??(??,??,??) VALUES (?,?,?)";
                                        var table = ["orderProducts", "orderID", "productID", "qtyOrdered", result[0].orderID, productIDs[i], productQtys[i]];

                                        query = mysql.format(query, table);

                                        console.log(query);

                                        connection.query(query, function (err, rows, fields) {
                                            if (err) {
                                                res.json({ "Error": err, "Message": "Error executing MySQL query" });
                                                return;
                                            }

                                            /*
                                            
                                            */
                                        });
                                    }
                                }
                            }
                        });
                    }
                });
            }
        });

        res.json({ "Error": false, "Message": "Success" });
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

    router.post('/replenish', (req, res) => {

    });

    // UPDATE a product quantity
    // req paramdter is the request object
    // res parameter is the response object
    router.post("/products/update/:productID", (req, res) => {
        console.log("Updating inventory for product: " + req.params.productID);
        var query = "UPDATE products SET qtyInStock = qtyInStock + " + Number(req.body.quantity) + " WHERE productID = " + req.params.productID;

        console.log(query);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({ "Error": err, "Message": "Error executing MySQL query" });
            } else {
                res.json({ "Error": false, "Message": "Inventory Updated for" + req.params.productID });
            }
        });
    });

    router.post("/products/view/", (req, res) => {
        var query = "";
        if (req.body.assignedBot == null && req.body.productID == null) {
            console.log("productID and assignedBot are null, returning without filtering results");
            query = "SELECT * FROM products";
        }
        if (req.body.assignedBot != null) {
            console.log("querying for assignedBot::" + req.body.assignedBot);
            query = "SELECT * FROM products WHERE assignedBot = " + req.body.assignedBot;
        }
        if (req.body.productID != null) {
            console.log("querying for productId::" + req.body.productID);
            query = "SELECT * FROM products WHERE productID = \"" + req.body.productID + "\"";
        }
        if (req.body.productID != null && req.body.assignedBot != null) {
            console.log("querying for assignedBot::" + req.assignedBot + " alngwith querying for productId::" + req.body.productID);
            query = "SELECT * FROM products WHERE productID = \"" + req.body.productID + "\" AND assignedBot = " + req.body.assignedBot;
        }
        console.log(query);
        connection.query(query, function (err, rows) {
            if (err) {
                res.json({ "Error": err, "Message": "Error executing MySQL query" });
            } else {
                res.json({ "Error": false, "Message": "Product list retrieved", "products": rows });
            }
        });
    });


    router.get('/send-notification', (request, response) => {
        requests.get('http://172.17.0.1:5006/notify', (err, res, body) => {
            if (err) {
                console.log(err);
            }

            else if (res.statusCode == 200) {
                console.log("success");
            }

            response.json("success");
        })
    });


    router.post("/trips/update/bot/arrival", (req, res) => {
        console.log("inserting bot position...")
        console.log("Station: " + req.body.station);
        console.log("Bot: " + req.body.bot);
        var query = "";
        var table = "";
        if (req.body.station == "RECV") {
            endQuery = "SET @TripID2 = (select max(??) from ??); update ?? set tripEndTime = ? where (tripID = @TripID2 OR tripID = (@TripID2 -1)) AND botID = ?";
            endTable = ["tripID", "trips", "trips", utils.now(), req.body.bot];
            endQuery = mysql.format(endQuery, endTable);
            console.log(endQuery);
            var endTrip = execute(endQuery);

            arrivalQuery = "INSERT INTO ??(??,??) VALUES (?,?)";
            arrivalTable = ["trips", "botID", "recArrivalTime", req.body.bot, utils.now()];
            arrivalQuery = mysql.format(arrivalQuery, arrivalTable);
            console.log(arrivalQuery);
            var updateBotArrival = execute(arrivalQuery);

            botTripQuery = "UPDATE ?? SET ?? = (SELECT MAX(??) FROM ?? WHERE ?? = ?) WHERE ?? = ?";
            botTripTable = ["bots", "tripID", "tripID", "trips", "botID", req.body.bot, "botID", req.body.bot];
            botTripQuery = mysql.format(botTripQuery, botTripTable);
            console.log(botTripQuery);
            var updateBotTrip = execute(botTripQuery);
            var wait =

                Promise.all([endTrip, updateBotArrival, updateBotTrip])
                    .then(() => {
                        const path = require('path')
                        const { spawn } = require('child_process')
                        function runScript() {
                            return spawn('python3', [
                                path.join(__dirname, 'tripOrderProducts.py')
                                , req.body.bot]);
                        }

                        const subprocess = runScript()
                        subprocess.stdout.on('data', (data) => {
                            console.log(`data:${data}`);
                        });
                        subprocess.stderr.on('data', (data) => {
                            console.log(`error:${data}`);
                        });
                        subprocess.stderr.on('close', () => {
                            console.log("Closed");
                        });
                    }).then(async function () {
                        console.log(1)
                        // await sleep(1000);
                        console.log(2)
                        sendTripData();
                    })

        }
        if (req.body.station == "SHIP") {
            query = "SET @TripID2 = (select max(??) from ??); update ?? set shipArrivalTime = ? where (tripID = @TripID2 OR tripID = (@TripID2 -1)) AND botID = ?";
            table = ["tripID", "trips", "trips", utils.now(), req.body.bot];
            query = mysql.format(query, table);
            console.log(query);
            connection.query(query, function (err, rows, fields) {
                if (err) {
                    res.json({ "Error": err, "Message": "Error executing MySQL query" });
                    return;
                }
            });
        }
        res.json("success");
    });

    router.post("/trips/update/bot/departure", (req, res) => {
        console.log("inserting bot position...")
        console.log("Station: " + req.body.station);
        console.log("Bot: " + req.body.bot);
        var query = "";
        var table = "";
        if (req.body.station == "RECV") {
            query = "SET @TripID2 = (select max(??) from ??); update ?? set recDepartureTime = ? where (tripID = @TripID2 OR tripID = (@TripID2 -1)) AND botID = ?";
            table = ["tripID", "trips", "trips", utils.now(), req.body.bot];
            query = mysql.format(query, table);
            console.log(query);
            connection.query(query, function (err, rows, fields) {
                if (err) {
                    res.json({ "Error": err, "Message": "Error executing MySQL query" });
                    return;
                }
            });
        }
        if (req.body.station == "SHIP") {
            query = "SET @TripID2 = (select max(??) from ??); update ?? set shipDepartureTime = ? where (tripID = @TripID2 OR tripID = (@TripID2 -1)) AND botID = ?";
            table = ["tripID", "trips", "trips", utils.now(), req.body.bot];
            query = mysql.format(query, table);
            console.log(query);
            connection.query(query, function (err, rows, fields) {
                if (err) {
                    res.json({ "Error": err, "Message": "Error executing MySQL query" });
                    return;
                }
            });
        }
        res.json("success");
    });

    router.post("/trips/update/bot/maintenance/start", (req, res) => {
        console.log("inserting bot position...")
        console.log("Station: " + req.body.station);
        var query = "";
        var table = "";
        if (req.body.station == "MAINTENANCE_START") {
            query = "SET @TripID2 = (select max(??) from ??); update ?? set maintenance_start = ? where (tripID = @TripID2 OR tripID = (@TripID2 -1))";
            table = ["tripID", "trips", "trips", utils.now()];
            query = mysql.format(query, table);
            console.log(query);
            connection.query(query, function (err, rows, fields) {
                if (err) {
                    res.json({ "Error": err, "Message": "Error executing MySQL query" });
                    return;
                }
            });
        }
        res.json("success");
    });

    router.post("/trips/update/bot/maintenance/stop", (req, res) => {
        console.log("inserting bot position...")
        console.log("Station: " + req.body.station);
        var query = "";
        var table = "";
        if (req.body.station == "MAINTENANCE_START") {
            query = "SET @TripID2 = (select max(??) from ??); update ?? set maintenance_stop = ? where (tripID = @TripID2 OR tripID = (@TripID2 -1))";
            table = ["tripID", "trips", "trips", utils.now()];
            query = mysql.format(query, table);
            console.log(query);
            connection.query(query, function (err, rows, fields) {
                if (err) {
                    res.json({ "Error": err, "Message": "Error executing MySQL query" });
                    return;
                }
            });
        }
        res.json("success");
    });


    router.post("/loadTrip", (req, res) => {
        var query = "";
        //var table = "";

        query = `UPDATE orders o SET status = 'loaded', loadTime = ? 
			WHERE status = 'pending' and orderID in (SELECT distinct (orderID) 
                                FROM tripOrderProducts 
                                WHERE tripID  = (select MAX(tripID) from tripOrderProducts))`;
        table = [utils.now()];
        query = mysql.format(query, table);
        console.log(query);
        connection.query(query, function (err, rows, fields) {
            if (err) {
                res.json({ "Error": err, "Message": "Error executing MySQL query" });
                return;
            }
            else res.json("success");
        });

        // res.json("success");
    });

    router.post("/fulfillOrder", (req, res) => {
        var query = "";
        //var table = "";
        query = `select distinct orderID 
                from(SELECT op.orderID, SUM(op.qtyOrdered) as ordered, SUM(op.qtyLoaded) as loaded 
                    FROM orderProducts op
                    JOIN orders o on op.orderID = o.orderID 
                    WHERE o.status = 'loaded' group by op.orderID) 
                as temp WHERE ordered = loaded;`;
        //table = ["tripID", "trips", "trips", utils.now()];
        //query = mysql.format(query);
        console.log(query);
        connection.query(query, function (err, rows, fields) {
            if (err) {
                res.json({ "Error": err, "Message": "Error executing MySQL query" });
                return;
            }
            else {
                console.log(rows);
                orders = [];

                rows.forEach(row => {
                    orders.push(row.orderID);
                });

                console.log(orders)
                res.json({
                    "orders": orders
                });
            }
        });

    });


    router.post("/triputilization", (req, res) => {
        var query = "";
        query = `SELECT SUM(top.qtyOnTrip)/ temp.capacity as utilization 
                FROM tripOrderProducts top JOIN trips t on top.tripID = t.tripID 
                JOIN (SELECT assignedBot, sum(maxBotQty) as capacity from products group by assignedBot)
                 temp on temp.assignedBot = t.botID 
                 WHERE t.tripEndTime is not NULL GROUP BY top.tripID ORDER BY top.tripID DESC LIMIT 10;`;
        console.log(query);
        connection.query(query, function (err, rows, fields) {
            if (err) {
                res.json({ "Error": err, "Message": "Error executing MySQL query" });
                return;
            }
            else {
                console.log(rows);
                utilization = [];

                rows.forEach(row => {
                    utilization.push(row.utilization);
                });

                console.log(orders)
                res.json({
                    "utilization": utilization
                });
            }
        });
    });
        async function insertPorts(posts) {
            for (let post of posts) {
                await connection.insert(post);
            }
        }

        /***************************************** test *****************************************************/


        function sleep(ms) {
            return new Promise(resolve => {
                setTimeout(resolve, ms)
            })
        }



        var sendData = (id) => {

            console.log("************************In sendData******************************");
            data = [];
            var query = "select * from orders where orderID = ?";
            var table = [id];
            query = mysql.format(query, table);

            execute(query)
                .then(rows => {

                    console.log("LoadTime " + rows[0].loadTime);
                    console.log("createTime " + rows[0].createTime);
                    console.log("fulfillTime " + rows[0].fulfillTime);
                    let orderTimeToLoad = rows[0].loadTime - rows[0].createTime;
                    let orderTimeToFulfill = rows[0].fulfillTime - rows[0].createTime;
                    let numBotsToFulfill = rows[0].num_bots_to_fulfill;
                    let botTimeSinceRecArrival = rows[0].bot_time_since_rec_arrival;
                    data.push(id, orderTimeToLoad, orderTimeToFulfill, numBotsToFulfill, botTimeSinceRecArrival);



                    var qtyRed = execute("SELECT qtyOrdered AS result FROM orderProducts WHERE productID = 1 AND orderID = " + id);
                    var qtyGreen = execute("SELECT qtyOrdered AS result FROM orderProducts WHERE productID = 2 AND orderID = " + id);
                    var qtyBlue = execute("SELECT qtyOrdered AS result FROM orderProducts WHERE productID = 3 AND orderID = " + id);
                    var qtyBlack = execute("SELECT qtyOrdered AS result FROM orderProducts WHERE productID = 4 AND orderID = " + id);
                    var qtyYellow = execute("SELECT qtyOrdered AS result FROM orderProducts WHERE productID = 5 AND orderID = " + id);
                    var qtyWhite = execute("SELECT qtyOrdered AS result FROM orderProducts WHERE productID = 6 AND orderID = " + id);
                    var orderNumProducts = execute("SELECT SUM(qtyOrdered) AS result FROM orderProducts WHERE orderID = " + id);
                    var orderNumDistinctProducts = execute("SELECT COUNT(DISTINCT productID) AS result FROM orderProducts WHERE orderID = " + id);
                    var customerID = execute("SELECT customerID AS result FROM orders WHERE orderID = " + id);


                    Promise.all([qtyRed, qtyGreen, qtyBlue, qtyBlack, qtyYellow, qtyWhite, orderNumProducts, orderNumDistinctProducts, customerID]).then(values => {
                        values.forEach(value => {
                            if (value.length == 0) {
                                data.push(0);
                            } else {
                                console.log("Value: ");
                                console.log(value);
                                data.push(value[0].result);
                            }
                        });
                    }).then(() => {
                        stream(data, id, "stream_orders");
                    })
                });
        }


        var stream = (data, id, stream) => {

            console.log("***********************In stream**************************");
            console.log("Data: ");
            console.log(data);

            var url = "http://a6b21d96.ngrok.io/sendtokinesis";

            requests(
                {
                    method: 'POST',
                    uri: url,
                    body: {
                        "stream": stream,
                        "id": id,
                        "data": data.join()
                    },
                    json: true
                },
                (err, res, body) => {
                    if (err) {
                        console.log(err);
                    } else if (res.statusCode == 200) {
                        console.log("Successfully sent stream");
                    }
                }
            );


        }


        var execute = (query) => {
            return new Promise(function (resolve, reject) {
                // The Promise constructor should catch any errors thrown on
                // this tick. Alternately, try/catch and reject(err) on catch.
                console.log("********************In execute************************")
                connection.query(query, function (err, rows, fields) {
                    // Call reject on error states,
                    // call resolve with results
                    if (err) {
                        return reject(err);
                    }
                    resolve(rows);
                });
            });
        }

        var sendTripData = () => {
            console.log("************************In sendTripData******************************");
            data = [];
            var tripID;
            execute("SELECT * FROM trips WHERE tripID = (SELECT MAX(tripID)-2 FROM trips)")
                .then(rows => {
                    tripID = Number(rows[0].tripID);
                    var tripTimeToLoad = rows.length > 0 ? rows[0].recDepartureTime - rows[0].recArrivalTime : 0;
                    var tripTimeToDispatch = rows.length > 0 ? rows[0].shipArrivalTime - rows[0].recDepartureTime : 0;
                    var tripTimeToUnload = rows.length > 0 ? rows[0].shipDepartureTime - rows[0].shipArrivalTime : 0;
                    var tripTimeToReturn = rows.length > 0 ? rows[0].tripEndTime - rows[0].shipDepartureTime : 0;
                    var tripTime = rows.length > 0 ? rows[0].tripEndTime - rows[0].recArrivalTime : 0;
                    data.push(tripID, tripTimeToLoad, tripTimeToDispatch, tripTimeToUnload, tripTimeToReturn, tripTime);

                    var tripNumOrders = execute("SELECT COUNT(DISTINCT orderID) AS result FROM tripOrderProducts WHERE tripID = " + tripID);
                    var tripNumProducts = execute("SELECT SUM(qtyOnTrip) AS result FROM tripOrderProducts WHERE tripID = " + tripID);
                    var tripNumDistinctProducts = execute("SELECT COUNT(DISTINCT productID) AS result FROM tripOrderProducts WHERE tripID = " + tripID);
                    var tripCapacityUtil = execute(`SELECT SUM(top.qtyOnTrip) / ( SELECT SUM(maxBotQty) FROM products 
                                            WHERE products.productID IN (SELECT DISTINCT productID FROM tripOrderProducts 
                                                WHERE tripID = ` + tripID + `)) 
                                                AS result FROM tripOrderProducts top`);

                    Promise.all([tripNumOrders, tripNumProducts, tripNumDistinctProducts, tripCapacityUtil])
                        .then(values => {
                            values.forEach(value => {
                                if (value.length == 0 || value[0].result == null || value == 'null') {
                                    data.push(0);
                                } else {
                                    data.push(value[0].result);
                                }
                            })
                        }).then(() => {
                            stream(data, tripID, "stream_trips");
                        })
                }).catch(err => {
                    console.log(err);
                })


        }
        /****************************************************************************************************/
    }
// The next line just makes this module available... think of it as a kind package statement in Java

module.exports = REST_ROUTER;
