const cds = require('@sap/cds')
const utils = require('./utils')
const LOG_MESSAGE_MAX_POSITION = 511

const MESSAGE_TYPES = {
    ERROR: 1,
    WARNING: 2,
    INFO: 3,
    DEBUG: 0
}

class LogBase{

    constructor(srv, req){
        this.srv = srv
        this.req = req
    }

    toLogMessage(message){
        if (message){
            return message.substring(0,LOG_MESSAGE_MAX_POSITION)
        }
    }

    addExtraInfo(data){
        data.timestamp = utils.timestampISOString()
    }

    getKeyObject(entity){
        throw Error('getKeyObject não foi redefinido.')
    }

    getEntitySet(){
        throw Error('getEntitySet não foi redefinido.')
    }

    async log(entity, {
        messageType,
        message
    }){

        const data = {
            messageType,
            message
        }

        const entitySet = this.getEntitySet()

        const _data = {
            ...data,
            ...this.getKeyObject(entity)
        }

        this.addExtraInfo(_data)

        _data.message = this.toLogMessage(_data.message)

        await cds.transaction(this.req).run(
            INSERT(_data)
                .into(entitySet)
        )
    }

}

class ItemExecucaoLog extends LogBase{

    getKeyObject({
        item_execucao_ID,
        item_configuracaoOrigem_ID,
    }){
        return {
            item_execucao_ID,
            item_configuracaoOrigem_ID,
        }
    }

    getEntitySet(){
        const { ItensExecucoesLogs } = this.srv.entities
        return ItensExecucoesLogs
    }

}

class Log extends LogBase{

    constructor(srv, req){
        super(srv, req)
        this.itemExecucaoLog = new ItemExecucaoLog(srv, req)
    }

    getKeyObject({ execucao_ID }){
        return { execucao_ID }
    }

    getEntitySet(){
        const { ExecucoesLogs } = this.srv.entities
        return ExecucoesLogs
    }

    async logExecucao(execucao_ID, data){
        this.log({execucao_ID}, data)
    }

    async logItemExecucao(item_execucao_ID, item_configuracaoOrigem_ID, data){

        const dataExec = {
            ...data,
            ...{
                message: `Item ${item_configuracaoOrigem_ID}: ${data.message}`
            }
        }

        await Promise.all([
            this.logExecucao(item_execucao_ID, dataExec),
            this.itemExecucaoLog.log({
                item_execucao_ID,
                item_configuracaoOrigem_ID
            }, data)
        ])

    }
}

module.exports = {
    LogBase: LogBase,
    Log: Log,
    MESSAGE_TYPES: MESSAGE_TYPES
}