#!/bin/bash

echo "start mysql..."
docker-entrypoint.sh mysqld > mysql.log 2>&1 &

until [[ $(mysql test 2>&1) == *"ERROR 1045"* ]]
do
  echo "waiting for mysql to start..."
  sleep 1
done

echo "dump database if not exists..."
mysql --password=password -e "CREATE DATABASE IF NOT EXISTS iot;"
mysql --password=password -D iot < orderinfo_schema.sql

echo "initialize node modules..."
yarn
yarn start
