/******************************************************************************************************************
* File:utils.js
* Course: IOT, Data Science, Machine Learning
* Project: Fullfillment Center
* Copyright: Copyright (c) 2018 Carnegie Mellon University
* Versions:
*   1.0 April 2019 - CJ.
*
* Description: Students would operate their fulfillment center in multiple sessions. Previously, we stored the
* real world time in the database. However, in that case they had to deal with the time intervals between sessions.
* E.g., the system may record that an order takes days to be fullfilled because it was generated from the last
* session. Thus, this file provides functions to simulate the passage of time.
*
* Note: You should not change this file.
*
******************************************************************************************************************/

var fs = require("fs");

// The time for starting this process.
var proc_start_time = Date.now();
var time_config = {
    // The world start time.
    world_start_time: proc_start_time,
    // The elapse scale. We can let the simulation go faster than the real world.
    // E.g., if elapse_scale = 24, then 1 hour in the real world = 24 hours in simulation
    elapse_scale: 1,
    time_passed: 0
};
var time_passed_from_last_run = 0;

exports.getConfig = function () {
    time_config["time_passed"] = exports.timePassed();
    return time_config;
}

// In initialization, try to load the existing config first. If it does not exist, follow the default values.
exports.init = function () {
    if (fs.existsSync("./simulation_time.json")) {
        fs.readFile("./simulation_time.json", (err, data) => {
            if (err) {
                console.log("Failed to read the file: ", err);
            } else {
                try {
                    time_config = JSON.parse(data);
                    time_passed_from_last_run = time_config["time_passed"];
                } catch (err) {
                    console.log("Failed to parse config file:", err);
                }
                
            }
        });
    } else {
        console.log("Using the current time as the starting time!");
    }
}

// Save the time config into a json file.
exports.save = function () {
    time_config["time_passed"] = exports.timePassed();
    fs.writeFileSync("./simulation_time.json", JSON.stringify(time_config));
}

exports.timePassed = function () {
    return Date.now() - proc_start_time + time_passed_from_last_run;
}

// Return the current simulation time.
exports.now = function () {
    let interval = exports.timePassed();
    return new Date(time_config["world_start_time"] + interval * time_config["elapse_scale"]);
}
