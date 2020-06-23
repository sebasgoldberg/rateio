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

        const { Documentos } = this.srv.entities

        await cds.transaction(req).run(
            UPDATE(Documentos)
            .set({cancelado: true})
            .where({CompanyCode: CompanyCode })
            .and({ AccountingDocument: AccountingDocument })
            .and({ FiscalYear: FiscalYear })
            .and({ cancelado: false })
        )

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