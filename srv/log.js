const cds = require('@sap/cds')
const LOG_MESSAGE_MAX_POSITION = 511

class Log{

    constructor(srv, req){
        this.srv = srv
        this.req = req
    }

    toLogMessage(message){
        if (message){
            return message.substring(0,LOG_MESSAGE_MAX_POSITION)
        }
    }

    async logExecucao(execucao_ID, data){
        const { ExecucoesLogs } = this.srv.entities

        const _data = {
            ...data,
            ...{
                execucao_ID: execucao_ID,
            }
        }

        _data.message = this.toLogMessage(_data.message)

        await cds.transaction(this.req).run(
            INSERT(_data)
                .into(ExecucoesLogs)
        )
    }

    async logItemExecucao(item_execucao_ID, item_configuracaoOrigem_ID, data){
        const { ItensExecucoesLogs } = this.srv.entities

        const _data = {
            ...data,
            ...{
                item_execucao_ID: item_execucao_ID,
                item_configuracaoOrigem_ID: item_configuracaoOrigem_ID
            }
        }

        _data.message = this.toLogMessage(_data.message)

        await cds.transaction(this.req).run(
            INSERT(_data)
                .into(ItensExecucoesLogs)
        )
    }
}

module.exports = Log