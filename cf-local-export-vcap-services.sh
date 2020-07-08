export VCAP_SERVICES="$(node get-vcap-services.js "$1")"
echo $VCAP_SERVICES
