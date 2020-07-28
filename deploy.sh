#!/usr/bin/env bash
./build.sh
cf push -f gen/db/ && cf push -f gen/srv/ && cf push -f app/