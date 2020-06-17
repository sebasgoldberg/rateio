const cds = require('@sap/cds')

class RateioProcess{
    constructor(execucoes_ID, srv, req){
        this.execucoes_ID = execucoes_ID
        this.srv = srv
        this.req = req
    }

    async getEtapas(){
        return cds.transaction(req).run(
            SELECT
                .columns('configuracaoOrigem.etapasProcesso.sequencia as sequencia')
                .from(ItensExecucoes)
                .where('execucao.ID = ', this.execucoes_ID)
                .groupBy('sequencia')
                .orderBy('sequencia')
        )
    }

    async execute(){

        const etapas = await this.getEtapas()

        for (const etapa of etapas){
            await this.processEtapa(etapa)
        }

    }

    async processEtapa(etapa){
        // TODO Adicionar implementação.
    }
}

module.exports = RateioProcess