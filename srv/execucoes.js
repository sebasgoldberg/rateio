const cds = require('@sap/cds')
const ExternalData = require("./external-data")

class ExecucoesImplementation{

    constructor(srv){
        this.srv = srv
        this.externalData = new ExternalData(srv)
    }

    async beforeCreate(req){

        const {
            ID,
            dataConfiguracoes
        } = req.data

        const { ConfigOrigens, ItensExecucoes } = this.srv.entities

        const configAtivasPeriodo =  await cds.transaction(req).run(
            SELECT
                .from(ConfigOrigens)
                .where('validFrom <=', dataConfiguracoes)
                .and('validTo >=', dataConfiguracoes)
                .and('ativa', true)
        )

        await cds.transaction(req).run(
            INSERT
                .into(ItensExecucoes)
                .columns('execucao_ID', 'configuracaoOrigem_ID')
                .entries(configAtivasPeriodo.map(config => [
                    ID,
                    config.ID,
                ]))
        )

    }

    registerHandles(){
        
        const { Execucoes } = this.srv.entities

        this.srv.before('CREATE', Execucoes, this.beforeCreate.bind(this))
    }

}

module.exports = ExecucoesImplementation