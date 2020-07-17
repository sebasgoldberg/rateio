#!/usr/bin/env bash
cf start rateio-db &
cf start rateio-srv &
cf start rateio-app &
