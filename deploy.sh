#!/usr/bin/env bash
cf push -f gen/db/ && cf push -f gen/srv/ && cf push -f app/