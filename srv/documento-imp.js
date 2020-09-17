const { Log, MESSAGE_TYPES } = require("./log")
const { createDocumentoEstorno } = require("./documento-factory")

class DocumentosImplementation{

    constructor(srv){
        this.srv = srv
    }

    async estornarDocumento(req, { CompanyCode, AccountingDocument, FiscalYear }){
     
        const documento = createDocumentoEstorno(this.srv)

        const dataDoDia = new Date().toISOString().split('T')[0];

        documento.setDadosCabecalho({
            PostingDate: dataDoDia,
            CompanyCode: CompanyCode,
            DocumentReferenceID: '201',
            DocumentHeaderText: `EstornoRateio`,
            CreatedByUser: req.user.id,
            ReversalReason: '02',
            ReversalReferenceDocument: `${ AccountingDocument }${ CompanyCode }${ FiscalYear }`,
        })

        await documento.post()

        return documento

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

        const documentoEstorno = await this.estornarDocumento(req, { CompanyCode, AccountingDocument, FiscalYear })

        const { AccountingDocument: AccountingDocumentEstorno } = documentoEstorno

        await Promise.all([
            cds.transaction(req).run(
                UPDATE(Documentos)
                .set({
                    cancelado: true,
                    EstornadoCom: AccountingDocumentEstorno
                })
                .where({CompanyCode: CompanyCode })
                .and({ AccountingDocument: AccountingDocument })
                .and({ FiscalYear: FiscalYear })
                .and({ cancelado: false })
            ),
            log.logItemExecucao(
                documento.execucao_ID, documento.configuracaoOrigem_ID,
                {
                    messageType: MESSAGE_TYPES.WARNING,
                    message: `O seguinte documento ${CompanyCode} ${AccountingDocument} ${FiscalYear} foi estornado com o documento ${ AccountingDocumentEstorno }.`
                })
        ])

    }

    afterRead(instances){
        instances.forEach( instance => {
            instance.canceladoCriticality = instance.cancelado ? 1 : 3
        })
    }

    registerHandles(){
        
        const { Documentos, ConfigOrigensDocumentos } = this.srv.entities

        this.srv.on('cancelar', Documentos, this.cancelarDocumentoAction.bind(this))
        this.srv.after("READ", [ Documentos, ConfigOrigensDocumentos ], this.afterRead.bind(this))

    }

}

module.exports = {
    DocumentosImplementation,
}