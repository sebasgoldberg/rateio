const createJournalEntry = require('../../srv/soap')

const { TestUtils, constants } = require('../utils')

describe('SOAP: Rateio: Documento', () => {

    this.utils = new TestUtils()

    beforeAll(async () => {
        await this.utils.deployAndServe()
        await this.utils.createTestData();
    })

    it('Criação do cliente SOAP sem erro', async () => {
        
        let journalEntry
        
        try {
            journalEntry = await createJournalEntry()
        } catch (error) {
            fail(`Cliente não criado: ${error}`);
        }

        expect(journalEntry.client.JournalEntryCreateRequestConfirmation_In).toBeDefined()

    })

    it('Chamada à criação do Journal Entry sem erro de autenticação.', async () => {
        
        const journalEntry = await createJournalEntry()

        try {
            const response = await journalEntry.post(undefined)
        } catch (error) {
            fail(`Cliente não autenticado corretamente: ${error}`);
        }

    })

    it('Chamada à criação do Journal Entry com valores fixos, deveria criar um documento.', async () => {
        
        const args = { 
            MessageHeader: {
                ID: 'MSG_20200201_APIRATEIO',
                CreationDateTime: '2020-06-25T12:00:00.1234567Z'
            },
            JournalEntryCreateRequest: {
                MessageHeader: {
                    ID: 'MSG_20200201_APIRATEIO',
                    CreationDateTime: '2020-06-25T12:00:00.1234567Z'
                },
                JournalEntry:{
                    OriginalReferenceDocumentType: 'BKPFF',
                    OriginalReferenceDocument: '06/2020',
                    OriginalReferenceDocumentLogicalSystem: 'RATEIO',
                    BusinessTransactionType: 'RFBU',
                    AccountingDocumentType: 'RF',
                    DocumentReferenceID: '06/2020',
                    DocumentHeaderText: 'Rateio 06/2020',
                    CreatedByUser: 'CBUSER',
                    CompanyCode: '1410',
                    DocumentDate: '2020-06-30',
                    PostingDate: '2020-06-30',
                    Item:[
                        {
                        ReferenceDocumentItem: '01',
                        CompanyCode: '1410',
                        GLAccount: '4291010301',
                        AmountInTransactionCurrency:{
                            attributes:{
                                currencyCode: 'BRL'
                            },
                            $value: '-1000.00',
                        },
                        DebitCreditCode: 'H',
                        DocumentItemText: 'Rateio 06/2020',
                        AccountAssignment:{
                            CostCenter: '0000300101',
                            },
                        },
                        {
                            ReferenceDocumentItem: '02',
                            CompanyCode: '1410',
                            GLAccount: '4211010300',
                            AmountInTransactionCurrency:{
                                attributes:{
                                    currencyCode: 'BRL'
                                },
                                $value: '360.00',
                            },
                            DebitCreditCode: 'S',
                            DocumentItemText: 'Rateio 06/2020',
                            AccountAssignment:{
                                CostCenter: '0000300101',
                            }
                        },
                        {
                            ReferenceDocumentItem: '03',
                            CompanyCode: '1410',
                            GLAccount: '4221010300',
                            AmountInTransactionCurrency:{
                                attributes:{
                                    currencyCode: 'BRL'
                                },
                                $value: '160.00',
                            },
                            DebitCreditCode: 'S',
                            DocumentItemText: 'Rateio 06/2020',
                            AccountAssignment:{
                                CostCenter: '0000300101',
                            }
                        },
                        {
                            ReferenceDocumentItem: '04',
                            CompanyCode: '1410',
                            GLAccount: '4221010300',
                            AmountInTransactionCurrency:{
                                attributes:{
                                    currencyCode: 'BRL'
                                },
                                $value: '480.00',
                            },
                            DebitCreditCode: 'S',
                            DocumentItemText: 'Rateio 06/2020',
                            AccountAssignment:{
                                CostCenter: '0000300101',
                            },
                            AssignmentReference: 'Uma Atribuição'
                        },
                    ]
                }
            }
        };

        const journalEntry = await createJournalEntry()

        const result = await journalEntry.post(args)
        
        const [response, ] = result

        expect(response.JournalEntryCreateConfirmation[0].Log).toEqual(
            expect.objectContaining({
                MaximumLogItemSeverityCode: '1'
            }))

    })

})

