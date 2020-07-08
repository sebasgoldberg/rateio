const cds = require('@sap/cds')
const utils = require('./utils')
const LOG_MESSAGE_MAX_POSITION = 511

const MESSAGE_TYPES = {
    ERROR: 1,
    WARNING: 2,
    INFO: 3,
    DEBUG: 0
}

class Log{

    constructor(srv, req){
        this.srv = srv
        this.req = req
    }

    toLogMessage(message){
        console.log(message);
        
        if (message){
            return message.substring(0,LOG_MESSAGE_MAX_POSITION)
        }
    }

    addExtraInfo(data){
        data.timestamp = utils.timestampISOString()
    }

    async logExecucao(execucao_ID, data){
        const { ExecucoesLogs } = this.srv.entities

        const _data = {
            ...data,
            ...{
                execucao_ID: execucao_ID,
            }
        }

        this.addExtraInfo(_data)

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

        this.addExtraInfo(_data)

        _data.message = this.toLogMessage(_data.message)

        await cds.transaction(this.req).run(
            INSERT(_data)
                .into(ItensExecucoesLogs)
        )
    }
}

module.exports = {
    Log: Log,
    MESSAGE_TYPES: MESSAGE_TYPES
}