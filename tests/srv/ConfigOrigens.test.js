const TestUtils = require('../utils')

describe('OData: Rateio: TiposOperacoes', () => {

    utils = new TestUtils()

    beforeAll(async () => {
      await utils.deployAndServe()
    })

    it('Service $metadata document', async () => {
        const response = await utils.request
            .get('/config/$metadata')
            .expect('Content-Type', /^application\/xml/)
            .expect(200)

        const expectedVersion = '<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">'
        const expectedBooksEntitySet = '<EntitySet Name="ConfigOrigens" EntityType="ConfigService.ConfigOrigens">'
        expect(response.text.includes(expectedVersion)).toBeTruthy()
        expect(response.text.includes(expectedBooksEntitySet)).toBeTruthy()
    })


    it('Não é possível criar uma configuração para uma etapa que não existe.', async () => {
        const response = await utils.request
            .post('/config/ConfigOrigens')
            .send({
                "etapasProcesso_sequencia": 20,
                "validFrom": "2019-06-01T00:00:00.000Z",
                "validTo": "2019-06-30T00:00:00.000Z",
                "empresa_CompanyCode": "1001",
                "contaOrigem_ChartOfAccounts": "1234",
                "contaOrigem_GLAccount": "1234",
                "centroCustoOrigem_ControllingArea": "1235",
                "centroCustoOrigem_CostCenter": "1234",
                "centroCustoOrigem_ValidityEndDate": "9999-12-31"
            })
            .set('Accept', 'application/json')
            .expect('Content-Type', /^application\/json/)
            .expect(400)
        
        expect(response.text).toEqual(expect.stringMatching(/Reference integrity is violated for association 'etapasProcesso'/))
    })
})