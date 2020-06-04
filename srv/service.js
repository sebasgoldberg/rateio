const cds = require('@sap/cds')

function ODataV2toODataV4DateTime(value){
    const groups = value.match(/\/Date\((?<arg>.*)\+.*\)\//).groups
    if (!groups)
        return value
    return new Date(Number(groups.arg))
        .toISOString()
}

function ODataV2toODataV4Date(value){
    const groups = value.match(/\/Date\((?<arg>.*)\)\//).groups
    if (!groups)
        return value
    return new Date(Number(groups.arg))
        .toISOString()
        .slice(0,10)
}

module.exports = cds.service.impl(async function () {

    const journalEntryItemBasicSrv = await cds.connect.to('API_JOURNALENTRYITEMBASIC_SRV')
    const { A_CompanyCode, A_GLAccountInChartOfAccounts, A_CostCenter } = this.entities

    const entities = [ A_CompanyCode, A_GLAccountInChartOfAccounts, A_CostCenter ]

    entities.forEach( entity => {
        this.on('READ', entity, async req => {
            let response = await journalEntryItemBasicSrv.tx(req).run(req.query)

            const dateAttributes = ['ValidityEndDate', 'ValidityStartDate', 'CostCenterCreationDate']
            const dateTimeAttributes = ['LastChangeDateTime']
        
            // Conversão de datas de OData 2.0 para 4.0
            response.forEach( instance => {
                dateAttributes.forEach( attribute => {
                    if (instance[attribute]) 
                        instance[attribute] = ODataV2toODataV4Date(instance[attribute])
                })
                dateTimeAttributes.forEach( attribute => {
                    if (instance[attribute]) 
                        instance[attribute] = ODataV2toODataV4DateTime(instance[attribute])
                })
            });

            return response;
        })
    });
})
  