const cds = require('@sap/cds')
const ExternalData = require("./external-data")
const createRateioProcess = require('./rateio-factory')
const { MESSAGE_TYPES } = require('./log')

const { STATUS_EXECUCAO } = require('./constants')

class ExecucoesImplementation{

    constructor(srv){
        this.srv = srv
        this.externalData = new ExternalData(srv)
    }

    async realizarRateios(ID, req){

        const rateio = createRateioProcess(ID, this.srv, req)
        let status = STATUS_EXECUCAO.FINALIZADO

        let logPromise;
        try{
            await rateio.execute()
            logPromise = rateio.log({
                messageType: MESSAGE_TYPES.INFO,
                message: `Execução realizada com sucesso.`
            })
        }catch(e){
            logPromise = rateio.log({
                messageType: MESSAGE_TYPES.ERROR,
                message: `Aconteceu o seguinte erro: '${String(e)}'.`
            })
            status = STATUS_EXECUCAO.CANCELADO
        }

        await Promise.all([
            logPromise,
            this.finalizarExecucao(ID, status, req)
        ])

    }

    async finalizarExecucao(ID, status, req){

        const { Execucoes } = this.srv.entities

        await cds.transaction(req).run(
            UPDATE(Execucoes)
                .set({status_status: status})
                .where({ID: ID})
        )

    }

    async iniciarExecucao(req){
        
        const ID = req.params[0]

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
            req.error(409, `A execução ${ID} não pode ser executada já que atualmente esta com o status ${status}.`, 'status_status')
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
            req.error(409, `Não existem configurações ativas na data ${dataConfiguracoes}. Não é possível realizar a execução ${ID}.`, 'dataConfiguracoes')
            return
        }

        await cds.transaction(req).run([
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

    async beforeExecutarExecucaoAction(req){
        await this.iniciarExecucao(req)
    }

    async executarExecucaoAction(req){

        const ID = req.params[0]

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
            `atualmente esta com o status ${status}.`, 'status_status')
            return
        }
    }

    async beforeUpdate(req){
        await this.validateStatusOnChange(req)
    }

    async beforeDelete(req){
        await this.validateStatusOnChange(req)
    }

    afterRead(instances){
        instances.forEach( instance => {
            instance.statusCriticality = 
                instance.status_status == STATUS_EXECUCAO.FINALIZADO ? 3 :
                instance.status_status == STATUS_EXECUCAO.EM_EXECUCAO ? 2 :
                instance.status_status == STATUS_EXECUCAO.CANCELADO ? 1 :
                0
        })
    }

    registerHandles(){
        
        const { Execucoes, ItensExecucoes } = this.srv.entities

        this.srv.before('UPDATE', Execucoes, this.beforeUpdate.bind(this))
        this.srv.before('DELETE', Execucoes, this.beforeDelete.bind(this))
        this.srv.before('executar', Execucoes, this.beforeExecutarExecucaoAction.bind(this))
        this.srv.on('executar', Execucoes, this.executarExecucaoAction.bind(this))
        this.srv.after("READ", [Execucoes, ItensExecucoes], this.afterRead.bind(this))
    }

}

module.exports = {
    ExecucoesImplementation: ExecucoesImplementation,
    STATUS_EXECUCAO: STATUS_EXECUCAO,
}