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

class ImplementationRegistration{

    async registerImpForInternalModels(){

        const { A_CompanyCode, A_GLAccountInChartOfAccounts, A_CostCenter, ConfigOrigens } = this.entities
    
        this.before('CREATE', ConfigOrigens, async req => {

            const { 
                empresa_CompanyCode,
                contaOrigem_ChartOfAccounts,
                contaOrigem_GLAccount,
                centroCustoOrigem_ControllingArea,
                centroCustoOrigem_CostCenter,
                validFrom,
                validTo
            } = req.data

            let results = await Promise.all([
                this.read(A_CompanyCode).where({CompanyCode: empresa_CompanyCode}), // 0
                this.read(A_GLAccountInChartOfAccounts).where({ // 1
                    ChartOfAccounts: contaOrigem_ChartOfAccounts,
                    GLAccount: contaOrigem_GLAccount,
                }),
                this.read(A_CostCenter).where({ // 2
                    ControllingArea: centroCustoOrigem_ControllingArea,
                    CostCenter: centroCustoOrigem_CostCenter,
                }),
                this.read(ConfigOrigens).where({ // 3
                    or: [ 
                        {
                            validFrom: { '<=': validFrom },
                            validTo: { '>=': validFrom },
                        },
                        {
                            validFrom: { '<=': validTo },
                            validTo: { '>=': validTo },
                        },
                        {
                            validFrom: { '>=': validFrom },
                            validTo: { '<=': validTo },
                        },
                    ]
                }),
            ])
            if (results[0].length == 0)
                req.error(409, `A empresa ${empresa_CompanyCode} não existe`)
            if (results[1].length == 0)
                req.error(409, `A conta ${contaOrigem_ChartOfAccounts}/${contaOrigem_GLAccount} não existe`)
            if (results[2].length == 0)
                req.error(409, `O centro ${centroCustoOrigem_ControllingArea}/${centroCustoOrigem_CostCenter} não existe`)
            if (results[3].length > 0)
                req.error(409, `O periodo indicado fica sobreposto com uma configuração `+
                    `já existente no periodo ${results[3][0].validFrom} - `+
                    `${results[3][0].validTo}.`)
        })
    
    
    }

    async registerImpForExternalModels(){

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
    
    }

}

module.exports = new ImplementationRegistration