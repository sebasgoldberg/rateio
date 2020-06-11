const cds = require('@sap/cds')

class ConfigOrigensImplementation{

    constructor(srv){
        this.srv = srv
    }

    async validatePeriodosSobrepostos(req){

        const { ConfigOrigens } = this.srv.entities

        let result = await cds.transaction(req).run(
            SELECT.from(ConfigOrigens)
                .where({
                    ID: req.data.ID
                })
        )

        let entityData;

        if (result.length == 0)
            entityData = req.data
        else
            entityData = {...result[0], ...req.data}
            
        const {
            ID,
            etapasProcesso_sequencia,
            empresa_CompanyCode,
            contaOrigem_ChartOfAccounts,
            contaOrigem_GLAccount,
            centroCustoOrigem_ControllingArea,
            centroCustoOrigem_CostCenter,
            validFrom,
            validTo
        } = entityData
    
        result = await cds.transaction(req).run(
            SELECT.from(ConfigOrigens)
                .where({
                    and: [
                        { etapasProcesso_sequencia: etapasProcesso_sequencia },
                        { empresa_CompanyCode: empresa_CompanyCode },
                        { contaOrigem_ChartOfAccounts: contaOrigem_ChartOfAccounts },
                        { contaOrigem_GLAccount: contaOrigem_GLAccount },
                        { centroCustoOrigem_ControllingArea: centroCustoOrigem_ControllingArea },
                        { centroCustoOrigem_CostCenter: centroCustoOrigem_CostCenter },
                        { ID: { '!=': ID } },
                        { or: [
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
                        ]}
                    ]
                })
        )

        if (result.length > 0)
            req.error(409, `O periodo indicado fica sobreposto com uma configuração `+
                `já existente no periodo ${result[0].validFrom} - `+
                `${result[0].validTo}.`)

    }

    async beforeUpdate(req){

        await this.validatePeriodosSobrepostos(req);

    }

    async validateDadosExternos(req){

        const { A_CompanyCode, A_GLAccountInChartOfAccounts, A_CostCenter } = this.srv.entities

        const { 
            empresa_CompanyCode,
            contaOrigem_ChartOfAccounts,
            contaOrigem_GLAccount,
            centroCustoOrigem_ControllingArea,
            centroCustoOrigem_CostCenter,
        } = req.data

        let results = await Promise.all([
            this.srv.read(A_CompanyCode).where({CompanyCode: empresa_CompanyCode}), // 0
            this.srv.read(A_GLAccountInChartOfAccounts).where({ // 1
                ChartOfAccounts: contaOrigem_ChartOfAccounts,
                GLAccount: contaOrigem_GLAccount,
            }),
            this.srv.read(A_CostCenter).where({ // 2
                ControllingArea: centroCustoOrigem_ControllingArea,
                CostCenter: centroCustoOrigem_CostCenter,
            }),
        ])
        if (results[0].length == 0)
            req.error(409, `A empresa ${empresa_CompanyCode} não existe`)
        if (results[1].length == 0)
            req.error(409, `A conta ${contaOrigem_ChartOfAccounts}/${contaOrigem_GLAccount} não existe`)
        if (results[2].length == 0)
            req.error(409, `O centro ${centroCustoOrigem_ControllingArea}/${centroCustoOrigem_CostCenter} não existe`)
    }

    async beforeCreate(req){

        await Promise.all([
            this.validatePeriodosSobrepostos(req),
            this.validateDadosExternos(req)
        ]);

    }

    registerHandles(){
        
        const { ConfigOrigens } = this.srv.entities

        this.srv.before('CREATE', ConfigOrigens, this.beforeCreate.bind(this))
        this.srv.before('UPDATE', ConfigOrigens, this.beforeUpdate.bind(this))
    }

}

module.exports = ConfigOrigensImplementation