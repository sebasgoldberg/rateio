const cds = require('@sap/cds')
const ExternalData = require("./external-data")

class ConfigDestinosImplementation{

    constructor(srv){
        this.srv = srv
        this.externalData = new ExternalData(srv)
    }

    async validateDadosExternos(req){

        const { 
            contaDestino_ChartOfAccounts,
            contaDestino_GLAccount,
            centroCustoDestino_ControllingArea,
            centroCustoDestino_CostCenter,
        } = req.data

        await Promise.all([
            this.externalData.validateConta(req, contaDestino_ChartOfAccounts, contaDestino_GLAccount),
            this.externalData.validateCentro(req, centroCustoDestino_ControllingArea, centroCustoDestino_CostCenter),
        ])

    }

    async validatePorcentagens(req){

        const { ConfigDestinos } = this.srv.entities

        const { 
            origem_ID,
            tipoOperacao_operacao,
            porcentagemRateio,
        } = req.data

        // Obtem os destinos para o mesmo origem.
        const result = await cds.transaction(req).run(
            SELECT.from(ConfigDestinos)
                .where({
                    origem_ID: origem_ID,
                    tipoOperacao_operacao: tipoOperacao_operacao,
                })
        )

        // Adiciona as porcentagens junto com o novo destino.
        const porcentagemTotal = result.reduce(
            (total, o) => total + o.porcentagemRateio,
            porcentagemRateio)

        // Se for maior a 100, então temos um erro
        if (porcentagemTotal > 100)
            req.error(409, `A soma das porcentagens no tipo de operação ${tipoOperacao_operacao} supera o 100%.`)

    }

    async beforeCreate(req){

        await Promise.all([
            this.validateDadosExternos(req),
            this.validatePorcentagens(req),
        ]);

    }

    registerHandles(){
        
        const { ConfigDestinos } = this.srv.entities

        this.srv.before('CREATE', ConfigDestinos, this.beforeCreate.bind(this))
    }

}

module.exports = ConfigDestinosImplementation