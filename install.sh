#!/bin/bash


apt-get update
apt-get install -y curl apt-transport-https
curl -sL https://deb.nodesource.com/setup_10.x | bash -
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
apt-get update
apt-get install -y nodejs yarn
apt-get install -y python3-pip
pip3 install numpy
pip3 install pymysql

