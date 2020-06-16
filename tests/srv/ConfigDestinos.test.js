const { TestUtils, constants } = require('../utils')

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

  it('Não é possível criar uma configuração de destino para uma conta que não existe.', async () => {
    const response = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.INVALID.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.INVALID.GL_ACCOUNT,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "",
        porcentagemRateio: "12.34",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(409)

    expect(response.text).toEqual(expect.stringMatching(new RegExp(
      `A conta ${constants.INVALID.CHART_OF_ACCOUNTS}/${constants.INVALID.GL_ACCOUNT} não existe`)))
  })

  it('Não é possível criar uma configuração de destino para um centro que não existe.', async () => {
    const response = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.INVALID.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.INVALID.COST_CENTER,
        atribuicao: "",
        porcentagemRateio: "12.34",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(409)

    expect(response.text).toEqual(expect.stringMatching(new RegExp(
      `O centro ${constants.INVALID.CONTROLLING_AREA}/${constants.INVALID.COST_CENTER} não existe`)))
  })

  it('Não é possível indicar uma porcentagem maior a 100.', async () => {
    const response = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "",
        porcentagemRateio: "100.01",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(400)

    expect(response.text).toEqual(expect.stringMatching(new RegExp(
      `Value of element 'porcentagemRateio' is not in specified range`)))
  })

  it('Não é possível indicar uma porcentagem menor a 0.', async () => {
    const response = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "",
        porcentagemRateio: "-12.34",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(400)

    expect(response.text).toEqual(expect.stringMatching(new RegExp(
      `Value of element 'porcentagemRateio' is not in specified range`)))
  })

  it('A soma das porcentagens agrupadas por tipo de operação não pode ultrapasar o 100%.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData()

    const response1 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "1",
        porcentagemRateio: "40",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const response2 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "2",
        porcentagemRateio: "41.01",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const response3 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "3",
        porcentagemRateio: "19",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(409)

    expect(response3.text).toEqual(expect.stringMatching(new RegExp(
      `A soma das porcentagens \\(.*%\\) no tipo de operação ${constants.TIPO_OPERACAO_1} supera o 100%.`)))
  })

  it('A soma das porcentagens sem agrupar por tipo de operação pode ultrapasar o 100%.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData()

    const response1 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "1",
        porcentagemRateio: "40",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const response2 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "2",
        porcentagemRateio: "41.01",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const response3 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_2,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "3",
        porcentagemRateio: "19",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

  })

  it('A soma das porcentagens agrupadas por tipo de operação não pode ultrapasar o 100% na modificação.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData()

    const response1 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "1",
        porcentagemRateio: "40",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const response2 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "2",
        porcentagemRateio: "41.01",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const destino3 = {
      origem_ID: this.utils.createdData.configOrigem.ID,
      tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
      contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
      contaDestino_GLAccount: constants.GL_ACCOUNT_1,
      centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
      centroCustoDestino_CostCenter: constants.COST_CENTER_1,
      atribuicao: "3",
      porcentagemRateio: "10",
    }

    const response3 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send(destino3)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const response4 = await this.utils.request
      .patch(`/config/ConfigDestinos(${this.utils.buildConfigDestinosUrlKey(destino3)})`) 
      .send({
        porcentagemRateio: "19",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(409)

    expect(response4.text).toEqual(expect.stringMatching(new RegExp(
      `A soma das porcentagens \\(.*%\\) no tipo de operação ${constants.TIPO_OPERACAO_1} supera o 100%.`)))
  
  })

  it('A soma das porcentagens agrupadas por tipo de operação pode ser modificada se não ultrapasar o 100%.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData()

    const response1 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "1",
        porcentagemRateio: "40",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const response2 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "2",
        porcentagemRateio: "41.01",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const destino3 = {
      origem_ID: this.utils.createdData.configOrigem.ID,
      tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
      contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
      contaDestino_GLAccount: constants.GL_ACCOUNT_1,
      centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
      centroCustoDestino_CostCenter: constants.COST_CENTER_1,
      atribuicao: "3",
      porcentagemRateio: "10",
    }

    const response3 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send(destino3)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const response4 = await this.utils.request
      .patch(`/config/ConfigDestinos(${this.utils.buildConfigDestinosUrlKey(destino3)})`) 
      .send({
        porcentagemRateio: "18.99",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(200)

  })

  it('Se o origem estiver ativo, não é posível modificar destinos.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData()

    const response1 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "1",
        porcentagemRateio: "40",
      })
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

    const response3 = await this.utils.request
      .post(`/config/ConfigOrigens(${destino2.origem_ID})/ConfigService.ativar`) 
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect(204)

    const response4 = await this.utils.request
      .patch(`/config/ConfigDestinos(${this.utils.buildConfigDestinosUrlKey(destino2)})`) 
      .send({
        porcentagemRateio: "18.99",
      })
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(409)

    expect(response4.text).toEqual(expect.stringMatching(new RegExp(
      `A configuração origem ${this.utils.createdData.configOrigem.ID} já esta ativa, `+
        `imposível adicionar, modificar ou eliminar destinos.`)))
  
  })

  it('Se o origem estiver ativo, não é posível adicionar destinos.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData()

    const response1 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "1",
        porcentagemRateio: "40",
      })
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

    const response3 = await this.utils.request
      .post(`/config/ConfigOrigens(${destino2.origem_ID})/ConfigService.ativar`) 
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect(204)

    const destino3 = {
      origem_ID: this.utils.createdData.configOrigem.ID,
      tipoOperacao_operacao: constants.TIPO_OPERACAO_2,
      contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
      contaDestino_GLAccount: constants.GL_ACCOUNT_2,
      centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
      centroCustoDestino_CostCenter: constants.COST_CENTER_2,
      atribuicao: "3",
      porcentagemRateio: "40",
    }

    const response4 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send(destino3)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(409)

    expect(response4.text).toEqual(expect.stringMatching(new RegExp(
      `A configuração origem ${this.utils.createdData.configOrigem.ID} já esta ativa, `+
        `imposível adicionar, modificar ou eliminar destinos.`)))
  
  })

  it('Se o origem estiver ativo, não é posível eliminar destinos.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData()

    const response1 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .send({
        origem_ID: this.utils.createdData.configOrigem.ID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
        contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
        contaDestino_GLAccount: constants.GL_ACCOUNT_1,
        centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
        centroCustoDestino_CostCenter: constants.COST_CENTER_1,
        atribuicao: "1",
        porcentagemRateio: "40",
      })
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

    const response3 = await this.utils.request
      .post(`/config/ConfigOrigens(${destino2.origem_ID})/ConfigService.ativar`) 
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect(204)

    const response4 = await this.utils.request
      .delete(`/config/ConfigDestinos(${this.utils.buildConfigDestinosUrlKey(destino2)})`) 
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(409)

    expect(response4.text).toEqual(expect.stringMatching(new RegExp(
      `A configuração origem ${this.utils.createdData.configOrigem.ID} já esta ativa, `+
        `imposível adicionar, modificar ou eliminar destinos.`)))
  
  })

})