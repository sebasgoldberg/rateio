const cds = require('@sap/cds')

describe('OData: Rateio: TiposOperacoes', () => {
  const app = require('express')()
  const request = require('supertest')(app)

  beforeAll(async () => {
    await cds.deploy(__dirname + '/../../srv/service').to('sqlite::memory:')
    await cds.serve('ConfigService').from(__dirname + '/../../srv/service').in(app)
  })

  it('Service $metadata document', async () => {
    const response = await request
      .get('/config/$metadata')
      .expect('Content-Type', /^application\/xml/)
      .expect(200)

    const expectedVersion = '<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">'
    const expectedBooksEntitySet = '<EntitySet Name="TiposOperacoes" EntityType="ConfigService.TiposOperacoes">'
    expect(response.text.includes(expectedVersion)).toBeTruthy()
    expect(response.text.includes(expectedBooksEntitySet)).toBeTruthy()
  })

  it('A tradução funciona corretamente', async () => {
    const response = await request
      .get('/config/TiposOperacoes?sap-language=en')
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