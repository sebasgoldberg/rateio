const cds = require('@sap/cds')
const ExternalData = require("./external-data")

class ConfigDestinosImplementation{

    constructor(srv){
        this.srv = srv
        this.externalData = new ExternalData(srv)
    }

    async validateDadosInternos(req){

        const { tipoOperacao_operacao } = req.data

        const { TiposOperacoes } = this.srv.entities

        let tipoOperacao = await cds.transaction(req).run(
            SELECT.one.from(TiposOperacoes)
                .where({
                    operacao: tipoOperacao_operacao
                })
        )

        if (!tipoOperacao)
            req.error(409, `O tipo de operação ${tipoOperacao_operacao} não existe.`, 'tipoOperacao_operacao')

    }

    async validateDadosExternos(req){

        const { 
            contaDestino_ChartOfAccounts,
            contaDestino_GLAccount,
            centroCustoDestino_ControllingArea,
            centroCustoDestino_CostCenter,
        } = req.data

        await Promise.all([
            this.externalData.validateConta(req, contaDestino_ChartOfAccounts, contaDestino_GLAccount,
                ['contaDestino_ChartOfAccounts', 'contaDestino_GLAccount']),
            this.externalData.validateCentro(req, centroCustoDestino_ControllingArea, centroCustoDestino_CostCenter,
                ['centroCustoDestino_ControllingArea', 'centroCustoDestino_CostCenter']),
        ])

    }

    async validatePorcentagens(req){

        const { ConfigDestinos } = this.srv.entities

        const { 
            origem_ID,
            tipoOperacao_operacao,
            contaDestino_ChartOfAccounts,
            contaDestino_GLAccount,
            centroCustoDestino_ControllingArea,
            centroCustoDestino_CostCenter,
            atribuicao,
            porcentagemRateio,
        } = req.data

        if (!porcentagemRateio)
            return;

        // Obtem os destinos para o mesmo origem.
        const result = await cds.transaction(req).run(
            SELECT.from(ConfigDestinos)
                .where({
                    and:[
                        { origem_ID: origem_ID },
                        { tipoOperacao_operacao: tipoOperacao_operacao },
                        {
                            // Excluimos o registro existente
                            or: [
                                { contaDestino_ChartOfAccounts: { '!=': contaDestino_ChartOfAccounts } },
                                { contaDestino_GLAccount: { '!=': contaDestino_GLAccount } },
                                { centroCustoDestino_ControllingArea: { '!=': centroCustoDestino_ControllingArea } },
                                { centroCustoDestino_CostCenter: { '!=': centroCustoDestino_CostCenter } },
                                { atribuicao: { '!=': atribuicao } },
                            ]
                        }
                    ]
                })
        )

        // Adiciona as porcentagens junto com o novo destino.
        const porcentagemTotal = result
            .reduce( (total, o) => total + o.porcentagemRateio, Number(porcentagemRateio))

        // Se for maior a 100, então temos um erro
        if (porcentagemTotal > 100)
            req.error(409, `A soma das porcentagens (${porcentagemTotal}%) no tipo de operação ${tipoOperacao_operacao} supera o 100%.`, 'porcentagemRateio')

    }

    async validateOrigemAtivo(req){
        const { ConfigOrigens } = this.srv.entities

        const { 
            origem_ID,
        } = req.data

        // Obtem os destinos para o mesmo origem.
        const result = await cds.transaction(req).run(
            SELECT.from(ConfigOrigens)
                .where({
                    and:[
                        { ID: origem_ID },
                        { ativa: true },
                    ]
                })
        )

        if (result.length > 0)
            req.error(409, `A configuração origem ${origem_ID} já esta ativa, `+
            `imposível adicionar, modificar ou eliminar destinos.`)
    }

    async beforeCreate(req){

        // TODO Se não for necessario, eliminar.
        if (!req.data.atribuicao)
            req.data.atribuicao = '';

        await Promise.all([
            this.validateDadosInternos(req),
            this.validateOrigemAtivo(req),
            this.validateDadosExternos(req),
            this.validatePorcentagens(req),
        ]);

    }

    async beforeUpdate(req){

        await Promise.all([
            this.validateDadosExternos(req),
            this.validatePorcentagens(req),
            this.validateOrigemAtivo(req),
        ]);

    }

    async beforeDelete(req){

        await Promise.all([
            this.validateOrigemAtivo(req),
        ]);

    }

    registerHandles(){
        
        const { ConfigDestinos } = this.srv.entities

        this.srv.before('CREATE', ConfigDestinos, this.beforeCreate.bind(this))
        this.srv.before('UPDATE', ConfigDestinos, this.beforeUpdate.bind(this))
        this.srv.before('DELETE', ConfigDestinos, this.beforeDelete.bind(this))
    }

}

module.exports = ConfigDestinosImplementation