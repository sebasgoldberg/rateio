const cds = require('@sap/cds')
const ExternalData = require("./external-data")
const { RequestHandler } = require('./request-handler')

class ConfigDestinosImplementation{

    constructor(srv, requestHandler=new RequestHandler()){
        this.srv = srv
        this.externalData = new ExternalData(srv, requestHandler)
        this.requestHandler = requestHandler
    }

    async validateDadosInternos(req){

        const { tipoOperacao_operacao } = this.requestHandler.getData(req)

        const { TiposOperacoes } = this.srv.entities

        let tipoOperacao = await cds.transaction(req).run(
            SELECT.one.from(TiposOperacoes)
                .where({
                    operacao: tipoOperacao_operacao
                })
        )

        if (!tipoOperacao)
            this.requestHandler.error(req, 409, `O tipo de operação ${tipoOperacao_operacao} não existe.`, 'tipoOperacao_operacao')

    }

    async validateDadosExternos(req){

        const { ID } = this.requestHandler.getData(req)

        const { ConfigDestinos } = this.srv.entities

        let destino = await cds.transaction(req).run(
            SELECT
                .one
                .from(ConfigDestinos)
                .where({ ID: ID })
        )

        if (!destino)
            destino = {}

        const { 
            contaDestino_ChartOfAccounts,
            contaDestino_GLAccount,
            centroCustoDestino_ControllingArea,
            centroCustoDestino_CostCenter,
        } = {
            ...destino,
            ...this.requestHandler.getData(req),
        }

        await Promise.all([
            this.externalData.validateConta(req, contaDestino_ChartOfAccounts, contaDestino_GLAccount,
                ['contaDestino_ChartOfAccounts', 'contaDestino_GLAccount']),
            this.externalData.validateCentro(req, centroCustoDestino_ControllingArea, centroCustoDestino_CostCenter,
                ['centroCustoDestino_ControllingArea', 'centroCustoDestino_CostCenter']),
        ])

    }

    async validatePorcentagens(req){

        const { ConfigDestinos } = this.srv.entities

        const { ID } = this.requestHandler.getData(req)

        let destino = await cds.transaction(req).run(
            SELECT
                .one
                .from(ConfigDestinos)
                .where({ ID: ID })
        )

        if (!destino)
            destino = {}

        const { 
            origem_ID,
            tipoOperacao_operacao,
            porcentagemRateio,
        } = {
            ...destino,
            ...this.requestHandler.getData(req)
        }

        if (!porcentagemRateio)
            return;

        // Obtem os destinos para o mesmo origem.
        const result = await cds.transaction(req).run(
            SELECT.from(ConfigDestinos)
                .where({
                    origem_ID: origem_ID,
                    tipoOperacao_operacao: tipoOperacao_operacao,
                    ID: { '!=': ID }
                 })
        )

        // Adiciona as porcentagens junto com o novo destino.
        const porcentagemTotal = result
            .reduce( (total, o) => total + Number(o.porcentagemRateio), Number(porcentagemRateio))

        // Se for maior a 100, então temos um erro
        if (porcentagemTotal > 100)
            this.requestHandler.error(req, 409, `A soma das porcentagens (${porcentagemTotal}%) no tipo de operação ${tipoOperacao_operacao} supera o 100%.`, 'porcentagemRateio')

    }

    async validateOrigemAtivo(req){

        const { ConfigDestinos, ConfigOrigens } = this.srv.entities

        const { ID } = this.requestHandler.getData(req)

        const destino = await cds.transaction(req).run(
            SELECT
                .one
                .from(ConfigDestinos)
                .where({ ID: ID })
        )

        let origem_ID

        if (destino)
            origem_ID = destino.origem_ID
        else
            origem_ID = this.requestHandler.getData(req).origem_ID


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
            this.requestHandler.error(req, 409, `A configuração origem ${origem_ID} já esta ativa, `+
            `imposível adicionar, modificar ou eliminar destinos.`)
    }

    async beforeCreate(req){

        // TODO Se não for necessario, eliminar.
        if (!this.requestHandler.getData(req).atribuicao)
            this.requestHandler.getData(req).atribuicao = '';

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