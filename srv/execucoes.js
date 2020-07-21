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

    async realizarRateios(req){

        const ID = req.params[0]

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

    async validarEtapaAnteriorProcessada(req, dadosExecucao){

        const { Execucoes, ConfigOrigens } = this.srv.entities

        const { 
            ID,
            etapaProcesso_sequencia,
            dataConfiguracoes,
            periodo,
            ano
        } = dadosExecucao

        if (etapaProcesso_sequencia == null || etapaProcesso_sequencia == undefined)
            return

        const configAtivaPeriodoEtapaAnterior =  await cds.transaction(req).run(
            SELECT('max(etapaProcesso_sequencia) as etapaAnterior')
                .from(ConfigOrigens)
                .where('validFrom <=', dataConfiguracoes)
                .and('validTo >=', dataConfiguracoes)
                .and('ativa', true)
                .and('etapaProcesso_sequencia <', etapaProcesso_sequencia)
        )

        // Se não houver etapa anterior para as configurações ativas, quer dizer que a
        // etapa definida nesta execução é a primeira etapa.
        if (configAtivaPeriodoEtapaAnterior.length == 0)
            return
        
        const { etapaAnterior } = configAtivaPeriodoEtapaAnterior[0]

        if (etapaAnterior == null)
            return

        const execucaoAnteriorFinalizada = await cds.transaction(req).run(
            SELECT.one
                .from(Execucoes)
                .where({ etapaProcesso_sequencia: etapaAnterior})
                .and({ periodo: periodo })
                .and({ ano: ano })
                .and({ status_status: STATUS_EXECUCAO.FINALIZADO })
        )

        if (execucaoAnteriorFinalizada)
            return
        
        req.error(409, `A execução ${ID} não pode ser executada já que `+
            `ainda não foi finalizada com sucesso a etapa anterior: ${etapaAnterior}.`, 'etapaProcesso_sequencia')

    }

    async validarInicioExecucao(req){
        
        const ID = req.params[0]

        const { Execucoes, ConfigOrigens } = this.srv.entities

        const dadosExecucao = await cds.transaction(req).run(
            SELECT.one
                .from(Execucoes)
                .where('ID = ', ID)
        )

        const {
            dataConfiguracoes,
            status_status: status,
        } = dadosExecucao

        if (status != STATUS_EXECUCAO.NAO_EXECUTADO){
            req.error(409, `A execução ${ID} não pode ser executada já que atualmente esta com o status ${status}.`, 'status_status')
            return
        }

        const configAtivaPeriodo =  await cds.transaction(req).run(
            SELECT.one
                .from(ConfigOrigens)
                .where('validFrom <=', dataConfiguracoes)
                .and('validTo >=', dataConfiguracoes)
                .and('ativa', true)
        )

        if (!configAtivaPeriodo){
            req.error(409, `Não existem configurações ativas na data ${dataConfiguracoes}. Não é possível realizar a execução ${ID}.`, 'dataConfiguracoes')
            return
        }

        await this.validarEtapaAnteriorProcessada(req, dadosExecucao)

    }

    async iniciarExecucao(req){
        
        const ID = req.params[0]

        const { Execucoes, ConfigOrigens, ItensExecucoes } = this.srv.entities

        const {
            dataConfiguracoes,
        } = await cds.transaction(req).run(
            SELECT.one
                .from(Execucoes)
                .where('ID = ', ID)
        )

        const configAtivasPeriodo = await cds.transaction(req).run(
            SELECT
                .from(ConfigOrigens)
                .where('validFrom <=', dataConfiguracoes)
                .and('validTo >=', dataConfiguracoes)
                .and('ativa', true)
        )

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
        await this.validarInicioExecucao(req)
    }

    async executarExecucaoAction(req){

        await this.iniciarExecucao(req)
        // FIXME Ver a possibilidade de  continuar executando após responder a request de execução.
        await this.realizarRateios(req)

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