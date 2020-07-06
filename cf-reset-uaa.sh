cf unbind-service rateio-db rateio-uaa
cf unbind-service rateio-srv rateio-uaa
cf unbind-service rateio-app rateio-uaa
cf delete-service-key rateio-uaa rateio-uaa-key -f
cf delete-service rateio-uaa -f
cf create-service xsuaa application rateio-uaa -c xs-security.json
cf bind-service rateio-db rateio-uaa
cf bind-service rateio-srv rateio-uaa
cf bind-service rateio-app rateio-uaa
cf rg rateio-db
cf rg rateio-srv
cf rg rateio-app
