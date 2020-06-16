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

    async ativarAction(req){

        const { ConfigOrigens, ConfigDestinos } = this.srv.entities

        const ID = req.params[0]

        const tx = cds.transaction(req)

        const result1 = await tx.run (
            SELECT.from(ConfigDestinos).where({origem_ID: ID})
          )
        
        if (result1.length == 0){
            req.error(409, `Impossível ativar configuração ${ID}, a mesma não tem destinos definidos.`)
            return
        }

        const somaPorcentagens = result1.reduce((prev, destino) => {
            const { tipoOperacao_operacao: operacao, porcentagemRateio } = destino
            prev[operacao] += porcentagemRateio
            return prev
        },{credito: 0, debito: 0})

        const {credito, debito} = somaPorcentagens

        if (credito != debito){
            req.error(409, `Impossível ativar a configuração. A soma das porcentagens agrupadas `+
                `por tipo de operação não coincidem: ${credito} distinto de ${debito}.`)
            return
        }

        const result2 = await tx.run (
            UPDATE(ConfigOrigens).set({ativa: true}).where({ID: ID})
          )

        return result2
    }

    registerHandles(){
        
        const { ConfigOrigens } = this.srv.entities

        this.srv.before('CREATE', ConfigOrigens, this.beforeCreate.bind(this))
        this.srv.before('UPDATE', ConfigOrigens, this.beforeUpdate.bind(this))
        this.srv.on('ativar', ConfigOrigens, this.ativarAction.bind(this))
    }

}

module.exports = ConfigOrigensImplementation