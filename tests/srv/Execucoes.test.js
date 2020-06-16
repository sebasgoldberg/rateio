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

  it('Ao criar a execução a mesma não terá itens execução associados.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    // Adição dos destinos
    const destino1 = {
      origem_ID: this.utils.createdData.configOrigem.ID,
      tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
      contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
      contaDestino_GLAccount: constants.GL_ACCOUNT_1,
      centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
      centroCustoDestino_CostCenter: constants.COST_CENTER_1,
      atribuicao: "1",
      porcentagemRateio: "40",
    }

    const response1 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send(destino1)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const destino2 = {
      origem_ID: this.utils.createdData.configOrigem.ID,
      tipoOperacao_operacao: constants.TIPO_OPERACAO_2,
      contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
      contaDestino_GLAccount: constants.GL_ACCOUNT_2,
      centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
      centroCustoDestino_CostCenter: constants.COST_CENTER_2,
      atribuicao: "2",
      porcentagemRateio: "40",
    }

    const response2 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send(destino2)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    // Ativação
    const response3 = await this.utils.request
      .post(`/config/ConfigOrigens(${this.utils.createdData.configOrigem.ID})/ConfigService.ativar`) 
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect(204)

    // Criação da execução
    const execucao = {
      descricao: constants.EXECUCAO.DESCRICAO,
      periodo: constants.EXECUCAO.PERIODO,
      ano: constants.EXECUCAO.ANO,
      dataConfiguracoes: constants.EXECUCAO.DATA_P6,
    }

    const response4 = await this.utils.request
      .post('/config/Execucoes') 
      .send(execucao)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const response5 = await this.utils.request
      .get(`/config/Execucoes(${JSON.parse(response4.text).ID})/itensExecucoes`)
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    expect(JSON.parse(response5.text).value).toEqual([])

  })

  it('Ao criar a execução e executa-la a mesma terá itens execução associados.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    // Adição dos destinos
    const destino1 = {
      origem_ID: this.utils.createdData.configOrigem.ID,
      tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
      contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
      contaDestino_GLAccount: constants.GL_ACCOUNT_1,
      centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
      centroCustoDestino_CostCenter: constants.COST_CENTER_1,
      atribuicao: "1",
      porcentagemRateio: "40",
    }

    const response1 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send(destino1)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const destino2 = {
      origem_ID: this.utils.createdData.configOrigem.ID,
      tipoOperacao_operacao: constants.TIPO_OPERACAO_2,
      contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
      contaDestino_GLAccount: constants.GL_ACCOUNT_2,
      centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
      centroCustoDestino_CostCenter: constants.COST_CENTER_2,
      atribuicao: "2",
      porcentagemRateio: "40",
    }

    const response2 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send(destino2)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    // Ativação
    const response3 = await this.utils.request
      .post(`/config/ConfigOrigens(${this.utils.createdData.configOrigem.ID})/ConfigService.ativar`) 
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect(204)

    // Criação da execução
    const execucao = {
      descricao: constants.EXECUCAO.DESCRICAO,
      periodo: constants.EXECUCAO.PERIODO,
      ano: constants.EXECUCAO.ANO,
      dataConfiguracoes: constants.EXECUCAO.DATA_P6,
    }

    const response4 = await this.utils.request
      .post('/config/Execucoes') 
      .send(execucao)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const { ID: execucaoID } = JSON.parse(response4.text)

    const response5 = await this.utils.request
      .post(`/config/Execucoes(${execucaoID})/ConfigService.executar`) 
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect(204)

    const response6 = await this.utils.request
      .get(`/config/Execucoes(${execucaoID})/itensExecucoes`)
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    expect(JSON.parse(response6.text).value).toEqual(expect.arrayContaining([
      expect.objectContaining({
        execucao_ID: execucaoID,
        configuracaoOrigem_ID: this.utils.createdData.configOrigem.ID,
      })
    ]))

  })

})