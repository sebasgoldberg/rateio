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
            this.PostingDate = this.JournalEntry.PostingDate

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


module.exports = {
    Documento,
    DocumentoEstorno,
}