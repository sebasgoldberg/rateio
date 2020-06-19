const cds = require('@sap/cds')
const ExternalData = require("./external-data")
const createRateioProcess = require('./rateio-factory')

const STATUS_EXECUCAO = {
    NAO_EXECUTADO: 'nao_executado',
    EM_EXECUCAO: 'em_execucao',
    FINALIZADO: 'finalizado',
    CANCELADO: 'cancelado',
}

class ExecucoesImplementation{

    constructor(srv){
        this.srv = srv
        this.externalData = new ExternalData(srv)
    }

    async realizarRateios(ID, req){

        const rateio = createRateioProcess(ID, this.srv, req)
        let status = STATUS_EXECUCAO.FINALIZADO

        try{
            await rateio.execute()
        }catch(e){
            status = STATUS_EXECUCAO.CANCELADO
        }

        await this.finalizarExecucao(ID, status, req)

    }

    async finalizarExecucao(ID, status, req){

        const { Execucoes } = this.srv.entities

        await cds.transaction(req).run(
            UPDATE(Execucoes)
                .set({status_status: status})
                .where({ID: ID})
        )

    }

    async iniciarExecucao(ID, req){
        const { Execucoes, ConfigOrigens, ItensExecucoes } = this.srv.entities

        const {
            dataConfiguracoes,
            status_status: status
        } = await cds.transaction(req).run(
            SELECT.one
                .from(Execucoes)
                .where('ID = ', ID)
        )

        if (status != STATUS_EXECUCAO.NAO_EXECUTADO){
            req.error(409, `A execução ${ID} não pode ser executada já que atualmente esta com o status ${status}.`)
            return
        }

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

        const [result1, result2] = await cds.transaction(req).run([
            UPDATE(Execucoes)
                .set({status_status: STATUS_EXECUCAO.EM_EXECUCAO})
                .where({ID: ID}),
            INSERT
                .into(ItensExecucoes)
                .columns('execucao_ID', 'configuracaoOrigem_ID')
                .entries(configAtivasPeriodo.map(config => [
                    ID,
                    config.ID,
                ])),
        ])
    }

    async executarExecucaoAction(req){

        const ID = req.params[0]

        await this.iniciarExecucao(ID, req)

        // FIXME Ver a possibilidade de  continuar executando após responder a request de execução.
        await this.realizarRateios(ID, req)

    }

    async validateStatusOnChange(req){
        const ID = req.params[0]

        const { Execucoes } = this.srv.entities

        const {
            status_status: status
        } = await cds.transaction(req).run(
            SELECT.one
                .from(Execucoes)
                .where('ID = ', ID)
        )

        if (status != STATUS_EXECUCAO.NAO_EXECUTADO){
            req.error(409, `A execução ${ID} não pode ser modificada/eliminada já que `+
            `atualmente esta com o status ${status}.`)
            return
        }
    }

    async beforeUpdate(req){
        await this.validateStatusOnChange(req)
    }

    async beforeDelete(req){
        await this.validateStatusOnChange(req)
    }

    registerHandles(){
        
        const { Execucoes } = this.srv.entities

        this.srv.before('UPDATE', Execucoes, this.beforeUpdate.bind(this))
        this.srv.before('DELETE', Execucoes, this.beforeDelete.bind(this))
        this.srv.on('executar', Execucoes, this.executarExecucaoAction.bind(this))

    }

}

module.exports = {
    ExecucoesImplementation: ExecucoesImplementation,
    STATUS_EXECUCAO: STATUS_EXECUCAO,
}