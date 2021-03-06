const { TestUtils, constants } = require('../utils')

describe('OData: Rateio: TiposOperacoes', () => {

  this.utils = new TestUtils()

  beforeAll(async () => {
    await this.utils.deployAndServe()
  })

  it('Service $metadata document', async () => {
    const response = await this.utils.request
      .get('/config/$metadata')
      .auth(constants.ADMIN_USER, constants.ADMIN_USER)
      .expect('Content-Type', /^application\/xml/)
      .expect(200)

    const expectedVersion = '<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">'
    const expectedBooksEntitySet = '<EntitySet Name="TiposOperacoes" EntityType="ConfigService.TiposOperacoes">'
    expect(response.text.includes(expectedVersion)).toBeTruthy()
    expect(response.text.includes(expectedBooksEntitySet)).toBeTruthy()
  })

  it('A tradução funciona corretamente', async () => {
    const response = await this.utils.request
      .get('/config/TiposOperacoes?sap-language=en')
      .auth(constants.ADMIN_USER, constants.ADMIN_USER)
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    expect(response.body.value).toEqual([
      {
        operacao: "credito",
        name: "Credit",
        descr: "Credit operation",
      },
      {
        operacao: "debito",
        name: "Debit",
        descr: "Debit operation",
      },
    ])
  })

})