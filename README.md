# 17640-iot

## Server Usage
### Build the Docker image
```
cd Server
docker build -t iot-server -f DockerFile .
```
If you change the server code or the data schema, you probably need to rebuild the image
(or you can copy the new files to the running container).

**ATTENTION: if you rebuild the image and run a new instance of it, you would lost all your old data. So be careful to backup them first.**

### Run the server for the first time
```
docker run -it --name iot -p 3000:3000 -p 3306:3306 iot-server
```
Now you can access the server API through http://localhost:3000/api/.

**ATTENTION: If you remove the container after shutting down the server, you would lost all your data.**

### Test: Sending order
```
docker exec -it iot node test_make_orders.js
```

### Start the server from last time
```
docker start -i iot
```

### Stop the server
```
ctrl-c when you are in the interactive mode or
docker stop iot
```

### Access the database
```
docker exec -it iot bash
mysql -p (the default password is 'password')
mysql> use iot;
mysql> select * from orders;
```

### Backup your data

```
docker exec iot sh -c "mysqldump --password=password --databases iot > iot_dump.sql"
docker cp iot:/iot-server/iot_dump.sql <path/to/dump/file>
```

### Recover from backup data
```
docker cp <path/to/dump/file> iot:/iot-server/iot_dump.sql
docker exec iot sh -c "mysql --password=password < iot_dump.sql"
```
