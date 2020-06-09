const { TestUtils, constants } = require('../utils')

const CHART_OF_ACCOUNTS = "1234"
const GL_ACCOUNT = "45678910"

describe('OData: Rateio: ConfigOrigens', () => {

  this.utils = new TestUtils()

  beforeAll(async () => {
    await this.utils.deployAndServe()
    await this.utils.createTestData();
  })

  it('Service $metadata document', async () => {
    const response = await this.utils.request
      .get('/config/$metadata')
      .expect('Content-Type', /^application\/xml/)
      .expect(200)

    const expectedVersion = '<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">'
    const expectedBooksEntitySet = '<EntitySet Name="ConfigOrigens" EntityType="ConfigService.ConfigOrigens">'
    expect(response.text.includes(expectedVersion)).toBeTruthy()
    expect(response.text.includes(expectedBooksEntitySet)).toBeTruthy()
  })


  it('Não é possível criar uma configuração para uma etapa que não existe.', async () => {
    const response = await this.utils.request
      .post('/config/ConfigOrigens')
      .send({
        "etapasProcesso_sequencia": 20,
        "empresa_CompanyCode": constants.COMPANY_CODE,
        "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
        "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
        "centroCustoOrigem_ControllingArea": "1235",
        "centroCustoOrigem_CostCenter": "1234",
        "centroCustoOrigem_ValidityEndDate": "9999-12-31",
        "validFrom": "2019-06-01T00:00:00.000Z",
        "validTo": "2019-06-30T00:00:00.000Z",
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(400)

    expect(response.text).toEqual(expect.stringMatching(/Reference integrity is violated for association 'etapasProcesso'/))
  })

  it('Não é possível criar uma configuração para uma empresa que não existe.', async () => {
    const response = await this.utils.request
      .post('/config/ConfigOrigens')
      .send({
        "etapasProcesso_sequencia": constants.SEQUENCIA_1,
        "empresa_CompanyCode": "1001",
        "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
        "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
        "centroCustoOrigem_ControllingArea": "1235",
        "centroCustoOrigem_CostCenter": "1234",
        "centroCustoOrigem_ValidityEndDate": "9999-12-31",
        "validFrom": "2019-06-01T00:00:00.000Z",
        "validTo": "2019-06-30T00:00:00.000Z",
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(409)

    expect(response.text).toEqual(expect.stringMatching(/A empresa 1001 não existe/))
  })

  it('Não é possível criar uma configuração para uma conta que não existe: ChartOfAccounts/GLAccount.', async () => {

    const response = await this.utils.request
      .post('/config/ConfigOrigens')
      .send({
        "etapasProcesso_sequencia": constants.SEQUENCIA_1,
        "empresa_CompanyCode": constants.COMPANY_CODE,
        "contaOrigem_ChartOfAccounts": CHART_OF_ACCOUNTS,
        "contaOrigem_GLAccount": GL_ACCOUNT,
        "centroCustoOrigem_ControllingArea": "1235",
        "centroCustoOrigem_CostCenter": "1234",
        "centroCustoOrigem_ValidityEndDate": "9999-12-31",
        "validFrom": "2019-06-01T00:00:00.000Z",
        "validTo": "2019-06-30T00:00:00.000Z",
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(409)

      expect(response.text).toEqual(expect.stringMatching(new RegExp(`A conta ${CHART_OF_ACCOUNTS}/${GL_ACCOUNT} não existe`)))
    })

    it('Não é possível criar uma configuração para uma conta que não existe: GLAccount', async () => {
  
      const response = await this.utils.request
      .post('/config/ConfigOrigens')
      .send({
        "etapasProcesso_sequencia": constants.SEQUENCIA_1,
        "empresa_CompanyCode": constants.COMPANY_CODE,
        "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
        "contaOrigem_GLAccount": GL_ACCOUNT,
        "centroCustoOrigem_ControllingArea": "1235",
        "centroCustoOrigem_CostCenter": "1234",
        "centroCustoOrigem_ValidityEndDate": "9999-12-31",
        "validFrom": "2019-06-01T00:00:00.000Z",
        "validTo": "2019-06-30T00:00:00.000Z",
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(409)

      expect(response.text).toEqual(expect.stringMatching(new RegExp(`A conta ${constants.CHART_OF_ACCOUNTS}/${GL_ACCOUNT} não existe`)))

    })

    it('Não é possível criar uma configuração para uma conta que não existe: ChartOfAccounts', async () => {
  
      const response = await this.utils.request
      .post('/config/ConfigOrigens')
      .send({
        "etapasProcesso_sequencia": constants.SEQUENCIA_1,
        "empresa_CompanyCode": constants.COMPANY_CODE,
        "contaOrigem_ChartOfAccounts": CHART_OF_ACCOUNTS,
        "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
        "centroCustoOrigem_ControllingArea": "1235",
        "centroCustoOrigem_CostCenter": "1234",
        "centroCustoOrigem_ValidityEndDate": "9999-12-31",
        "validFrom": "2019-06-01T00:00:00.000Z",
        "validTo": "2019-06-30T00:00:00.000Z",
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(409)

      expect(response.text).toEqual(expect.stringMatching(new RegExp(`A conta ${CHART_OF_ACCOUNTS}/${constants.GL_ACCOUNT_1} não existe`)))

  })

})