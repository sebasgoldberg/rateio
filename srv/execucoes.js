const cds = require('@sap/cds')
const ExternalData = require("./external-data")

class ExecucoesImplementation{

    constructor(srv){
        this.srv = srv
        this.externalData = new ExternalData(srv)
    }

    async executarExecucaoAction(req){

        const ID = req.params[0]

        const { Execucoes, ConfigOrigens, ItensExecucoes } = this.srv.entities

        const {
            dataConfiguracoes
        } = await cds.transaction(req).run(
            SELECT.one
                .from(Execucoes)
                .where('ID = ', ID)
        )

        const configAtivasPeriodo =  await cds.transaction(req).run(
            SELECT
                .from(ConfigOrigens)
                .where('validFrom <=', dataConfiguracoes)
                .and('validTo >=', dataConfiguracoes)
                .and('ativa', true)
        )

        if (configAtivasPeriodo.length == 0){
            req.error(409, `Não existem configurações ativas na data ${dataConfiguracoes}. Não é possível realizar a execução ${ID}.`)
        }

        const result = await cds.transaction(req).run(
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

        this.srv.on('executar', Execucoes, this.executarExecucaoAction.bind(this))

    }

}

module.exports = ExecucoesImplementation