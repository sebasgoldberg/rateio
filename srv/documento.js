const { Log, MESSAGE_TYPES } = require("./log")
const createJournalEntry = require("./soap")

class DocumentoBase{

    constructor(srv){
        this.srv = srv
        this.itens = []
    }

    setDadosCabecalho({
        PostingDate, CompanyCode, DocumentReferenceID, DocumentHeaderText, CreatedByUser
    }) {

        this.JournalEntry = {
            OriginalReferenceDocumentType: 'BKPFF',
            OriginalReferenceDocument: DocumentReferenceID,
            OriginalReferenceDocumentLogicalSystem: 'RATEIO',
            BusinessTransactionType: 'RFBU',
            AccountingDocumentType: 'RF',
            DocumentReferenceID: DocumentReferenceID,
            DocumentHeaderText: DocumentHeaderText,
            CreatedByUser: CreatedByUser.substring(0,12), // Se não restringimos da erro.
            CompanyCode: CompanyCode,
            DocumentDate: PostingDate,
            PostingDate: PostingDate,
            Item:[]
        }

    }

    async post(){

        const journalEntry = await createJournalEntry()

        const ID = 'MSG_20200201_APIRATEIO'
        const CreationDateTime = (new Date()).toISOString()

        const [response, ] = await journalEntry.post({ 
            MessageHeader: {
                ID: ID,
                CreationDateTime: CreationDateTime
            },
            JournalEntryCreateRequest: {
                MessageHeader: {
                    ID: ID,
                    CreationDateTime: CreationDateTime
                },
                JournalEntry: this.JournalEntry
            }
        })

        const documentCreated = response.JournalEntryCreateConfirmation[0]
            .JournalEntryCreateConfirmation

        if (documentCreated.AccountingDocument){

            const { AccountingDocument, CompanyCode, FiscalYear } = documentCreated

            this.AccountingDocument = AccountingDocument
            this.CompanyCode = CompanyCode
            this.FiscalYear = FiscalYear

        } else {

            throw JSON.stringify(response.JournalEntryCreateConfirmation[0].Log)

        }

    }

}

class Documento extends DocumentoBase{

    setDadosCabecalho(JournalEntry) {

        super.setDadosCabecalho(JournalEntry)
        this.JournalEntry.Item = []

    }

    addItem({
        AmountInTransactionCurrency, currencyCode, GLAccount,
        CostCenter, DebitCreditCode, DocumentItemText, AssignmentReference
    }){

        const ReferenceDocumentItem = (this.JournalEntry.Item.length + 1)
            .toString().padStart(2, '0')

        this.JournalEntry.Item.push({
            ReferenceDocumentItem: `${ReferenceDocumentItem}`,
            CompanyCode: this.JournalEntry.CompanyCode,
            GLAccount: GLAccount,
            AmountInTransactionCurrency:{
                attributes:{
                    currencyCode: currencyCode
                },
                $value: AmountInTransactionCurrency,
            },
            DebitCreditCode: DebitCreditCode,
            DocumentItemText: DocumentItemText,
            AccountAssignment:{
                CostCenter: CostCenter,
            },
            AssignmentReference: AssignmentReference
        })

    }

}

class DocumentoEstorno extends DocumentoBase{

    setDadosCabecalho(JournalEntry) {

        super.setDadosCabecalho(JournalEntry)

        const { ReversalReason, ReversalReferenceDocument } = JournalEntry
        this.JournalEntry.ReversalReason = ReversalReason
        this.JournalEntry.ReversalReferenceDocument = ReversalReferenceDocument

    }

}

class DocumentosImplementation{

    constructor(srv){
        this.srv = srv
    }

    async estornarDocumento(req, { CompanyCode, AccountingDocument, FiscalYear }){
     
        const { createDocumentoEstorno } = require("./documento-factory")
        console.log(createDocumentoEstorno);
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
    Documento,
    DocumentoEstorno,
    DocumentosImplementation
}