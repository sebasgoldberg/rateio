const cds = require('@sap/cds')

class RateioProcess{

    constructor(execucoes_ID, srv, req){
        this.execucoes_ID = execucoes_ID
        this.srv = srv
        this.req = req
    }

    async getEtapas(){

        const { EtapasExecucoes } = this.srv.entities

        return cds.transaction(this.req).run(
            SELECT
                .from(EtapasExecucoes)
                .where('execucao_ID = ', this.execucoes_ID)
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
        return Promise.resolve()
    }
}

module.exports = RateioProcess