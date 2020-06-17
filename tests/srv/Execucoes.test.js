const { TestUtils, constants } = require('../utils')

describe('OData: Rateio: Execucoes', () => {

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
    const expectedBooksEntitySet = '<EntitySet Name="Execucoes" EntityType="ConfigService.Execucoes">'
    expect(response.text.includes(expectedVersion)).toBeTruthy()
    expect(response.text.includes(expectedBooksEntitySet)).toBeTruthy()
  })

  it('Ao criar a execução a mesma não terá itens associados.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    const origemID = this.utils.createdData.configOrigem.ID

    const response1 = await this.utils.createDestino()
      .expect(201)

    const response2 = await this.utils.createDestino({ 
      tipoOperacao_operacao: constants.TIPO_OPERACAO_2 
    })
      .expect(201)

    const response3 = await this.utils.activateOrigem(origemID)
      .expect(204)

    const response4 = await this.utils.createExecucao()
      .expect(201)

    const execucaoID = JSON.parse(response4.text).ID

    const response5 = await this.utils.getItensExecucao(execucaoID)
      .expect(200)

    expect(JSON.parse(response5.text).value).toEqual([])

  })

  it('Ao criar a execução e executa-la a mesma terá itens associados.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    const origemID = this.utils.createdData.configOrigem.ID

    const response1 = await this.utils.createDestino()
      .expect(201)

    const response2 = await this.utils.createDestino({ 
      tipoOperacao_operacao: constants.TIPO_OPERACAO_2 
    })
      .expect(201)

    const response3 = await this.utils.activateOrigem(origemID)
      .expect(204)

    const response4 = await this.utils.createExecucao()
      .expect(201)

    const execucaoID = JSON.parse(response4.text).ID

    const response5 = await this.utils.executarExecucao(execucaoID)
      .expect(204)

    const response6 = await this.utils.getItensExecucao(execucaoID)
      .expect(200)

    expect(JSON.parse(response6.text).value).toEqual(expect.arrayContaining([
      expect.objectContaining({
        execucao_ID: execucaoID,
        configuracaoOrigem_ID: this.utils.createdData.configOrigem.ID,
      })
    ]))

  })

  it('Não deve ser possível executar mais de uma vez uma mesma execução.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    const origemID = this.utils.createdData.configOrigem.ID

    const response1 = await this.utils.createDestino()
      .expect(201)

    const response2 = await this.utils.createDestino({ 
      tipoOperacao_operacao: constants.TIPO_OPERACAO_2 
    })
      .expect(201)

    const response3 = await this.utils.activateOrigem(origemID)
      .expect(204)

    const response4 = await this.utils.createExecucao()
      .expect(201)

    const execucaoID = JSON.parse(response4.text).ID

    const response5 = await this.utils.executarExecucao(execucaoID)
      .expect(204)

    const response6 = await this.utils.executarExecucao(execucaoID)
      .expect(409)

    expect(response6.text).toEqual(expect.stringMatching(
      new RegExp(`A execução ${execucaoID} não pode ser executada já que `+
        `atualmente esta com o status .*\\.`
        )))

  })

})