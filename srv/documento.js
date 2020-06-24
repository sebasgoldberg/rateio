const { Log, MESSAGE_TYPES } = require("./log")

class Documento{

    constructor(srv){
        this.srv = srv
        this.itens = []
    }

    setDadosCabecalho(dados) {
        // TODO Implementar
        this.header = dados
    }

    addItem(dados){
        // TODO Implementar
        this.itens.push(dados)
    }

    async post(){
        // TODO Implementar
    }

}

class DocumentosImplementation{

    constructor(srv){
        this.srv = srv
    }

    async cancelarDocumentoAction(req){

        const { CompanyCode, AccountingDocument, FiscalYear } = req.params[0]

        const { Documentos, ConfigOrigensDocumentos } = this.srv.entities

        const log = new Log(this.srv, req)

        const documento = await cds.transaction(req).run(
            SELECT.one
                .from(ConfigOrigensDocumentos)
                .where(req.params[0])
        )

        if (documento.cancelado){
            req.error(409, `O documento já se encontra cancelado.`)
            return
        }

        await Promise.all([
            cds.transaction(req).run(
                UPDATE(Documentos)
                .set({cancelado: true})
                .where({CompanyCode: CompanyCode })
                .and({ AccountingDocument: AccountingDocument })
                .and({ FiscalYear: FiscalYear })
                .and({ cancelado: false })
            ),
            log.logItemExecucao(
                documento.execucao_ID, documento.configuracaoOrigem_ID,
                {
                    messageType: MESSAGE_TYPES.WARNING,
                    message: `O seguinte documento foi cancelado: ${CompanyCode} ${AccountingDocument} ${FiscalYear}.`
                })
        ])

    }

    registerHandles(){
        
        const { Documentos } = this.srv.entities

        this.srv.on('cancelar', Documentos, this.cancelarDocumentoAction.bind(this))

    }

}

module.exports = {
    Documento: Documento,
    DocumentosImplementation: DocumentosImplementation
}