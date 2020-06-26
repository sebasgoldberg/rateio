const { Log, MESSAGE_TYPES } = require("./log")
const createJournalEntry = require("./soap")

class Documento{

    constructor(srv){
        this.srv = srv
        this.itens = []
    }

    setDadosCabecalho({ 
        PostingDate, CompanyCode, DocumentReferenceID, DocumentHeaderText 
    }) {

        this.JournalEntry = {
            OriginalReferenceDocumentType: 'BKPFF',
            OriginalReferenceDocument: DocumentReferenceID,
            OriginalReferenceDocumentLogicalSystem: 'RATEIO',
            BusinessTransactionType: 'RFBU',
            AccountingDocumentType: 'RF',
            DocumentReferenceID: DocumentReferenceID,
            DocumentHeaderText: DocumentHeaderText,
            CreatedByUser: 'CBUSER', // TODO Obter usuário
            CompanyCode: CompanyCode,
            DocumentDate: PostingDate,
            PostingDate: PostingDate,
            Item:[]
        }

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