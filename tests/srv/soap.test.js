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
            await journalEntry.post()
        } catch (error) {
            expect(String(error)).toEqual(expect.stringMatching(/soap-env:Server: Web service processing error; more details in .*/))
        }

    })

})

