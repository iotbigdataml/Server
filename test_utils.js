var utils = require("./utils.js");

utils.init();

setInterval(() => {
    console.log(utils.now())
}, 1000);

process.on("SIGINT", () => {
    console.log("save the simulation time.");
    utils.save();
    process.exit(0);
});
