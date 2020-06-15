const { TestUtils, constants } = require('../utils')

const CHART_OF_ACCOUNTS = "1234"
const GL_ACCOUNT = "45678910"
const CONTROLLING_AREA = "4567"
const COST_CENTER = "012345"

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
    const expectedBooksEntitySet = '<EntitySet Name="ConfigDestinos" EntityType="ConfigService.ConfigDestinos">'
    expect(response.text.includes(expectedVersion)).toBeTruthy()
    expect(response.text.includes(expectedBooksEntitySet)).toBeTruthy()
  })


  it('Não é possível criar uma configuração de destino para um origem que não existe.', async () => {
    const response = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: constants.GUID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "",
        porcentagemRateio: "12.34",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(400)

    expect(response.text).toEqual(expect.stringMatching(/Reference integrity is violated for association 'origem'/))
  })

  it('Não é possível criar uma configuração de destino para um tipo de operação que não existe.', async () => {
    const response = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: "outra",
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "",
        porcentagemRateio: "12.34",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(400)

    expect(response.text).toEqual(expect.stringMatching(/Reference integrity is violated for association 'tipoOperacao'/))
  })

})