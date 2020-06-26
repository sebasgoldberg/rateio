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

const { ConfigOrigensImplementation } = require("./")
const { ConfigDestinosImplementation } = require("./")
const { ExecucoesImplementation } = require("./")
const { DocumentosImplementation } = require('./documento')

class ImplementationRegistration{

    async registerImpForInternalModels(){

        const configOrigensImp = new ConfigOrigensImplementation(this)
        configOrigensImp.registerHandles()

        const configDestinosImp = new ConfigDestinosImplementation(this)
        configDestinosImp.registerHandles()

        const execucoesImp = new ExecucoesImplementation(this)
        execucoesImp.registerHandles()

        const documentosImp = new DocumentosImplementation(this)
        documentosImp.registerHandles()

    }

    async registerImpForExternalModels(){

        const journalEntryItemBasicSrv = await cds.connect.to('API_JOURNALENTRYITEMBASIC_SRV')
        const { A_CompanyCode, A_GLAccountInChartOfAccounts, A_CostCenter, } = this.entities
    
        const entities = [ A_CompanyCode, A_GLAccountInChartOfAccounts, A_CostCenter, ]
    
        entities.forEach( entity => {
            this.on('READ', entity, async req => {
                let response = await journalEntryItemBasicSrv.tx(req).run(req.query)
    
                const dateAttributes = ['ValidityEndDate', 'ValidityStartDate', 'CostCenterCreationDate', 'CreationDate']
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
    
    }

}

module.exports = new ImplementationRegistration