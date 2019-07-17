var bodyParser = require('body-parser');
var mysql = require('mysql');
app.use(bodyParser.json());   


var connection = mysql.createConnection({
	
	multipleStatements: true
});

//var json_array =[]
var order_list = []

function pr_query( sql, args ) {
    return new Promise( ( resolve, reject ) => {
        connection.query( sql, args, ( err, rows ) => {
            if ( err )
                return reject( err );
            resolve( rows );
        } );
    } );
}

//Variables needed in this script
//maxbotqty for each product
//quantityloaded at an order, trip level
//quantity not loaded at an order, product levelS
// total quantity loaded at product, trip level

var productOnTrip = [0,0,0];
var botProductID1 = [1,2,3];
var botProductID2 = [4,5,6];


// should be triggered 5 seconds (discuss) after the bot leaves shipping with botID as input
app.post('/placeholder', function(req, res){
    var tripID_query = "select tripID from bots where botID = ?"
    connection.query(tripID_query,[req.body.botID], (errors, results, fields) => {
        var tripID = Number(results[0].tripID) + 2; // I think we should keep things simple and just go with even and odd tripIDs for each bot.
    })

    if (req.body.botID == 11){
        productIDs = botProductID1;
    }
    else if (req.body.botID == 12){
        productIDs = botProductID2;
    }

    function makeArray(w, h, val) {
        var arr = [];
        for(let i = 0; i < h; i++) {
            arr[i] = [];
            for(let j = 0; j < w; j++) {
                arr[i][j] = val;
            }
        }
        return arr;
    }




    var sql_query = 'select orderID form orders where status = `pending`'
    pr_query( sql_query )
		.then( rows => {
			if(rows!=0){
           
			

			    //var sql_query_2 = "select orderID, productID, qtyOrdered from orderProducts where orderID in ?"; //alternative: put the queries in a loop for the combination of each orderID, productID
               
            //pr_query( sql, [order_list] )
             //   .then(rows => {orderID, productID,
        //qty to be inserted for each order on the trip
                tripOrderProduct = makeArray(order_count, 3, 0);
                for(var i =0; i<order_count; i++){
                    order_list.push(rows[i].orderID);

                    for(var j =1; j< 4; j++ ){ //iterate over the correct productIDs)
                        var sql_query_2 = "select qtyOrdered from orderProducts where orderID = ? and productID = ?"
                        pr_query( sql, [order_list[i], j] )
                        .then(rows => {
                            //you now have quantity of each product for each orderID
                            

                            // A possible option
                            //json_array.push({'orderID': order_list[i], 'productID': j, 'qtyOrdered':rows[0].qtyOrdered})
                            
                            tripOrderProduct[i][j] = min(maxBotQty[j]- productOnTrip[j], rows[0].qtyOrdered)    
                            productOnTrip[j] = productOnTrip[j] + min(maxBotQty[j]- productOnTrip[j], rows[0].qtyOrdered)
                            if(maxBotQty[j]- productOnTrip[j] < rows[0].qtyOrdered){
                                productNotLoaded[i][j] =  rows[0].qtyOrdered - maxBotQty[j]- productOnTrip[j] 

                            }

                            //insert query here for triporderproducts or outside?
                            //insert query needs to be bot specific (make this entire thing bot specific?)

                            

                        })
                    }

                }
            }

               // })
		})
})