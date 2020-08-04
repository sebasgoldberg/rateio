const cds = require('@sap/cds')
const ExternalData = require("./external-data")
const { RequestHandler } = require('./request-handler')

class ConfigOrigensImplementation{

    constructor(srv, requestHandler=new RequestHandler()){
        this.srv = srv
        this.externalData = new ExternalData(srv, requestHandler)
        this.requestHandler = requestHandler
    }

    async validatePeriodosSobrepostos(req){

        const { ConfigOrigens } = this.srv.entities

        let result = await cds.transaction(req).run(
            SELECT.from(ConfigOrigens)
                .where({
                    ID: this.requestHandler.getData(req).ID
                })
        )

        let entityData;

        if (result.length == 0)
            entityData = this.requestHandler.getData(req)
        else
            entityData = {...result[0], ...this.requestHandler.getData(req)}
            
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
            ['validFrom', 'validTo']
                .forEach(target =>
                    this.requestHandler.error(req, 409, `O periodo indicado ${validFrom} - ${validTo} é inválido.`, target)
                )
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
            ['validFrom', 'validTo']
                .forEach(target =>
                    this.requestHandler.error(req, 409, `O periodo indicado fica sobreposto com uma configuração `+
                    `já existente no periodo ${result[0].validFrom} - `+
                    `${result[0].validTo}.`, target)
                )

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
            if (fieldName in this.requestHandler.getData(req))
                this.requestHandler.error(req, 409, `O campo ${fieldName} não deve ser modificado`, fieldName)
        })
    }

    async beforeUpdate(req){

        this.validarNaoExistemMudancasCamposChave(req);
        await Promise.all([
            this.validatePeriodosSobrepostos(req),
        ]);

    }

    async validateDadosInternos(req){
        const { etapasProcesso_sequencia } = this.requestHandler.getData(req)

        const { EtapasProcesso } = this.srv.entities

        let etapa = await cds.transaction(req).run(
            SELECT.one.from(EtapasProcesso)
                .where({
                    sequencia: etapasProcesso_sequencia
                })
        )

        if (!etapa)
            this.requestHandler.error(req, 409, `A etapa ${etapasProcesso_sequencia} não existe.`, 'etapasProcesso_sequencia')

    }

    async validateDadosExternos(req){

        const { 
            empresa_CompanyCode,
            contaOrigem_ChartOfAccounts,
            contaOrigem_GLAccount,
            centroCustoOrigem_ControllingArea,
            centroCustoOrigem_CostCenter,
        } = this.requestHandler.getData(req)

        await Promise.all([
            this.externalData.validateEmpresa(req, empresa_CompanyCode),
            this.externalData.validateConta(req, contaOrigem_ChartOfAccounts, contaOrigem_GLAccount),
            this.externalData.validateCentro(req, centroCustoOrigem_ControllingArea, centroCustoOrigem_CostCenter),
        ])

    }

    async beforeCreate(req){

        // TODO Verificar se descomentar.
        // req.data.ativa = false

        const data = this.requestHandler.getData(req)

        await Promise.all([
            this.validateDadosInternos(req),
            this.validatePeriodosSobrepostos(req),
            this.validateDadosExternos(req)
        ]);

    }

    async ativarConfiguracaoAction(req){

        const { ConfigOrigens, ConfigDestinos } = this.srv.entities

        const ID = this.requestHandler.getParams(req)[0]

        const tx = cds.transaction(req)

        const result1 = await tx.run (
            SELECT.from(ConfigDestinos).where({origem_ID: ID})
          )
        
        if (result1.length == 0){
            this.requestHandler.error(req, 409, `Impossível ativar configuração ${ID}, a mesma não tem destinos definidos.`, 'destinos')
            return
        }

        const somaPorcentagens = result1.reduce((prev, destino) => {
            const { tipoOperacao_operacao: operacao, porcentagemRateio } = destino
            prev[operacao] += Number(porcentagemRateio)
            return prev
        },{credito: 0, debito: 0})

        const {credito, debito} = somaPorcentagens

        if (credito != debito){
            this.requestHandler.error(req, 409, `Impossível ativar a configuração. A soma das porcentagens agrupadas `+
                `por tipo de operação não coincidem: ${credito} distinto de ${debito}.`, 'destinos')
            return
        }

        const result2 = await tx.run (
            UPDATE(ConfigOrigens).set({ativa: true}).where({ID: ID})
          )

        return result2
    }

    async desativarConfiguracaoAction(req){

        const { ConfigOrigens, ItensExecucoes } = this.srv.entities

        const ID = this.requestHandler.getParams(req)[0]

        const tx = cds.transaction(req)

        const result1 = await tx.run (
            SELECT.one.from(ItensExecucoes).where({configuracaoOrigem_ID: ID})
          )
        
        if (result1){
            const { execucao_ID } = result1
            this.requestHandler.error(req, 409, `Impossível desativar a configuração. `+
                `A mesma é utilizada na execução ${execucao_ID}.`, 'execucoes')
            return
        }

        const result2 = await tx.run (
            UPDATE(ConfigOrigens).set({ativa: false}).where({ID: ID})
          )

        return result2
    }

    afterRead(origens){
        origens.forEach( origem => {
            origem.ativaCriticality = origem.ativa ? 3 : 1
        })
    }

    registerHandles(){
        
        const { ConfigOrigens } = this.srv.entities

        this.srv.before('CREATE', ConfigOrigens, this.beforeCreate.bind(this))
        this.srv.before('UPDATE', ConfigOrigens, this.beforeUpdate.bind(this))
        this.srv.on('ativar', ConfigOrigens, this.ativarConfiguracaoAction.bind(this))
        this.srv.on('desativar', ConfigOrigens, this.desativarConfiguracaoAction.bind(this))
        this.srv.after("READ", ConfigOrigens, this.afterRead.bind(this))
    }

}

module.exports = ConfigOrigensImplementation