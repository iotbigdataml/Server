
#Needs to be executed from an API in nodeJS with a command-line-like argument which is  botID

import sys
import pymysql
import numpy as np
conn = pymysql.connect(host='localhost',
                       user='root',
                       passwd='password',
                       db='iot')
cur = conn.cursor()


order_count = cur.execute('select orderID from orders where `status` = "pending"')

order_list = list(np.array(cur.fetchall())[:,0])
botID = sys.argv[1]
botProductID1 = [1,2,3]
botProductID2 = [4,5,6]
maxBotQty = [10,10,10]
flag = [0,0,0]
tripOrderProduct = np.zeros(shape=(order_count,3))
productNotLoaded = np.zeros(shape=(order_count,3))
productOnTrip = [0,0,0]
tripID = 1

if (botID == 11):
    productIDs = botProductID1
    maxBotQty = [10,10,10]
elif (botID == 12):
    productIDs = botProductID2
    maxBotQty = [10,10,10]
tid_query = 'select tripID from bots where botID = ' + str(botID)
cur.execute(tid_query);
tripID = cur.fetchall()


op_rows = cur.execute("select orderID,productID, qtyOrdered from orderProducts where orderID in(" + ','.join([str(x) for x in order_list]) + ") and productID in (" + ','.join([str(x) for x in productIDs])+ ")")

orderProducts = np.array(cur.fetchall())


counter = 0
top_query = 'Insert into tripOrderProducts (tripID, orderID, productID, qtyOnTrip) Values '
op_query = 'Insert into orderProducts (orderID, productID, qtyLoaded) Values '
for i in range(order_count):
    for j in range(3):
        counter = counter + 1
        temp = orderProducts[(orderProducts[:,0]==order_list[i]) & (orderProducts[:,1]==productIDs[j]),2]
        if (temp.size == 0):
            temp = 0
        tripOrderProduct[i,j] = min(maxBotQty[j]- productOnTrip[j], temp)
        productOnTrip[j] = productOnTrip[j] + tripOrderProduct[i,j]
        
        if(maxBotQty[j]- productOnTrip[j] <= temp):
            productNotLoaded[i,j] =  temp - (maxBotQty[j]- productOnTrip[j]) 
            flag[j] = 1
            if (sum(flag) == 3):
                break
        else:
            continue
        break

temp_counter = 0
for i in range(order_count):
    for j in range(3):
        temp_counter = temp_counter + 1
        if (temp_counter == counter):
            if (tripOrderProduct[i,j] != 0):
                top_query = top_query + '(' + str(tripID) +',' + str(order_list[i]) + ',' + str(productIDs[j]) + ',' + str(tripOrderProduct[i,j]) +')'
                op_query =  op_query + '(' + str(order_list[i]) + ',' + str(productIDs[j]) + ',' + str(tripOrderProduct[i,j]) + ')'
            else:
                a = 2
                top_query = top_query[:-1]
                op_query = op_query[:-1]
            break
        else:
            if (tripOrderProduct[i,j] != 0):
                top_query = top_query + '(' + str(tripID) +',' + str(order_list[i]) + ',' + str(productIDs[j]) + ',' + str(tripOrderProduct[i,j]) +'),'
                op_query =  op_query + '(' + str(order_list[i]) + ',' + str(productIDs[j]) + ',' + str(tripOrderProduct[i,j]) + '),'
    else:
        continue
    break
op_query = op_query + 'ON DUPLICATE KEY UPDATE orderID=VALUES(orderID),productID=VALUES(productID),qtyLoaded=VALUES(qtyLoaded)'


cur.execute(top_query)


cur.execute(op_query)


conn.commit()


conn.close()



