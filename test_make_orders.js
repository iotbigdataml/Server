var http = require("http");

let data = "&customer=test&red=1&blue=1&green=1&yellow=1&black=1&white=1";

let options = {
    hostname: "localhost",
    port: 3000,
    path: "/api/neworder",
    method: "POST",
    headers: {
        "Accept-Language": "en-GB,en;q=0.5",
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-length": data.length,
        "Content-Language": "en-GB",
        "charset": "utf-8"
    }
}

function post() {
    let req = http.request(options, (res) => {
        res.on('data', (d) => {
            process.stdout.write(d);
            process.stdout.write('\n');
        });
    });
    req.on("error", (err) => {
        console.log(err);
    });
    req.write(data);
    req.end();
}

setInterval(() => {
    post();
}, 1000);
