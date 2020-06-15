const cds = require('@sap/cds')
const ExternalData = require("./external-data")

class ConfigOrigensImplementation{

    constructor(srv){
        this.srv = srv
        this.externalData = new ExternalData(srv)
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
    
        if (validFrom > validTo){
            req.error(409, `O periodo indicado ${validFrom} - ${validTo} é inválido.`)
            return
        }

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

    validarNaoExistemMudancasCamposChave(req){
        [
            'etapasProcesso_sequencia',
            'empresa_CompanyCode',
            'contaOrigem_ChartOfAccounts',
            'contaOrigem_GLAccount',
            'centroCustoOrigem_ControllingArea',
            'centroCustoOrigem_CostCenter',    
        ].forEach(fieldName => {
            if (fieldName in req.data)
                req.error(409, `O campo ${fieldName} não deve ser modificado`)
        })
    }

    async beforeUpdate(req){

        this.validarNaoExistemMudancasCamposChave(req);
        await this.validatePeriodosSobrepostos(req);

    }

    async validateDadosExternos(req){

        const { 
            empresa_CompanyCode,
            contaOrigem_ChartOfAccounts,
            contaOrigem_GLAccount,
            centroCustoOrigem_ControllingArea,
            centroCustoOrigem_CostCenter,
        } = req.data

        await Promise.all([
            this.externalData.validateEmpresa(req, empresa_CompanyCode),
            this.externalData.validateConta(req, contaOrigem_ChartOfAccounts, contaOrigem_GLAccount),
            this.externalData.validateCentro(req, centroCustoOrigem_ControllingArea, centroCustoOrigem_CostCenter),
        ])

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