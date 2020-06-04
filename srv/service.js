const cds = require('@sap/cds')

module.exports = cds.service.impl(async function () {

    const journalEntryItemBasicSrv = await cds.connect.to('API_JOURNALENTRYITEMBASIC_SRV')
    const { A_CompanyCode, A_GLAccountInChartOfAccounts, A_CostCenter } = this.entities

    const entities = [ A_CompanyCode, A_GLAccountInChartOfAccounts, A_CostCenter ]
    entities.forEach( entity => {
        this.on('READ', entity, req => journalEntryItemBasicSrv.tx(req).run(req.query))
    });
})
  