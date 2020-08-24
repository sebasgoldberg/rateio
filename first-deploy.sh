#!/usr/bin/env bash
cf create-service xsuaa application rateio-uaa -c xs-security.json
cf create-service destination lite rateio-destination
cf create-service hana hdi-shared rateio-db-hdi-container
if [ $? -ne 0 ]; then
    cf create-service hanatrial hdi-shared rateio-db-hdi-container
fi
./deploy.sh
echo "---------------------------------------------------------------------------"
echo "Deploy finalizado!!!"
echo "Por favor realizar as seguintes tarefas:"
echo "1) Realize o trust configuration entre SCP e o IAS: https://help.sap.com/viewer/65de2977205c403bbc107264b8eccf4b/Cloud/en-US/7c6aa87459764b179aeccadccd4f91f3.html#loio7c6aa87459764b179aeccadccd4f91f3"
echo "2) Crie um Role Collection no SCP que inclua o perfil rateioAdmin e asigne os usuários (opcionalmente pode asignar os usuários no IAS)."
echo "3) Em caso de trabalhar com um grupo no IAS: No SCP fazer o mapeamento do role collection com o grupo definido no IAS."
echo "4) Configure os destinations."
echo "5) Realize a sincronização desde o app Rateio Config."
echo "6) Opcionalmente faça o import de configurações."
echo "---------------------------------------------------------------------------"
