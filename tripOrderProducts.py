import sys
import numpy as np
import pymysql

print("python script initialized")
sys.stdout.flush()
botID = sys.argv[1]
conn = pymysql.connect(host='localhost',
                       user='root',
                       passwd='password',
                       db='iot')
cur = conn.cursor()

# query for productIDs and maxBotQty specific to bot
cur.execute('SELECT productID, maxBotQty FROM products WHERE assignedBot = {}'.format(botID))
productIDs, maxBotQty = np.hsplit(np.array(cur.fetchall()), 2)
productIDs = list(productIDs.flatten())
maxBotQty = list(maxBotQty.flatten())
capacity = dict(zip(productIDs, maxBotQty))

# query for tripID
cur.execute('SELECT tripID FROM bots WHERE botID = {}'.format(botID));
tripID = cur.fetchall()[0][0]

# query for order products of pending orders
op_rows = cur.execute("SELECT op.orderID, op.productID, op.qtyOrdered, op.qtyLoaded " +
                      "FROM orderProducts op JOIN orders o " +
                      "ON op.orderID = o.orderID " +
                      "WHERE o.status != 'shipped'" +
                      "AND op.qtyOrdered != op.qtyLoaded " +
                      "AND productID in (" + ",".join(
    [str(x) for x in productIDs]) + ")" + "ORDER BY op.orderID, op.productID")
orderProducts = np.array(cur.fetchall())

top_query = 'INSERT INTO tripOrderProducts (tripID, orderID, productID, qtyOnTrip) VALUES '
op_query = 'INSERT INTO orderProducts (orderID, productID, qtyOrdered, qtyLoaded) VALUES '

for orderID, productID, qtyOrdered, qtyLoaded in orderProducts:
    if capacity[productID] == 0:
        continue
    elif (qtyOrdered - qtyLoaded) > capacity[productID]:
        top_query += '(' + str(tripID) +',' + str(orderID) + ',' + str(productID) + ',' + str(capacity[productID]) + '),'
        op_query =  op_query + '(' + str(orderID) + ',' + str(productID) + ',' + str(qtyOrdered) + ',' + str(qtyLoaded + capacity[productID]) + '),'
        capacity[productID] = 0
    else: # capacity >= qtyOrdered
        top_query += '(' + str(tripID) +',' + str(orderID) + ',' + str(productID) + ',' + str(qtyOrdered) + '),'
        op_query =  op_query + '(' + str(orderID) + ',' + str(productID) + ',' + str(qtyOrdered) + ',' + str(qtyOrdered) + '),'
        capacity[productID] -= qtyOrdered

top_query = top_query[:-1]
op_query = op_query[:-1] + ' ON DUPLICATE KEY UPDATE orderID=VALUES(orderID),productID=VALUES(productID),qtyLoaded=VALUES(qtyLoaded)'

cur.execute(top_query)
cur.execute(op_query)
conn.commit()
conn.close()