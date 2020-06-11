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
        "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
        "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
        "validFrom": constants.PERIODO_1.VALID_FROM,
        "validTo": constants.PERIODO_1.VALID_TO,
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
        "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
        "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
        "validFrom": constants.PERIODO_1.VALID_FROM,
        "validTo": constants.PERIODO_1.VALID_TO,
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
        "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
        "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
        "validFrom": constants.PERIODO_1.VALID_FROM,
        "validTo": constants.PERIODO_1.VALID_TO,
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
        "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
        "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
        "validFrom": constants.PERIODO_1.VALID_FROM,
        "validTo": constants.PERIODO_1.VALID_TO,
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
        "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
        "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
        "validFrom": constants.PERIODO_1.VALID_FROM,
        "validTo": constants.PERIODO_1.VALID_TO,
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(409)

      expect(response.text).toEqual(expect.stringMatching(new RegExp(`A conta ${CHART_OF_ACCOUNTS}/${constants.GL_ACCOUNT_1} não existe`)))

  })

  it('Não é possível criar uma configuração para um centro que não existe: ControllingArea/CostCenter', async () => {
  
    const response = await this.utils.request
    .post('/config/ConfigOrigens')
    .send({
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": COST_CENTER,
      "validFrom": constants.PERIODO_1.VALID_FROM,
      "validTo": constants.PERIODO_1.VALID_TO,
    })
    .set('Accept', 'application/json')
    .expect('Content-Type', /^application\/json/)
    .expect(409)

    expect(response.text).toEqual(expect.stringMatching(new RegExp(`O centro ${CONTROLLING_AREA}/${COST_CENTER} não existe`)))

  })

  it('Não é possível criar uma configuração para um centro que não existe: ControllingArea', async () => {
  
    const response = await this.utils.request
    .post('/config/ConfigOrigens')
    .send({
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_1.VALID_FROM,
      "validTo": constants.PERIODO_1.VALID_TO,
    })
    .set('Accept', 'application/json')
    .expect('Content-Type', /^application\/json/)
    .expect(409)

    expect(response.text).toEqual(expect.stringMatching(new RegExp(`O centro ${CONTROLLING_AREA}/${constants.COST_CENTER_1} não existe`)))

  })

  it('Não é possível criar uma configuração para um centro que não existe: CostCenter', async () => {
  
    const response = await this.utils.request
    .post('/config/ConfigOrigens')
    .send({
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": COST_CENTER,
      "validFrom": constants.PERIODO_1.VALID_FROM,
      "validTo": constants.PERIODO_1.VALID_TO,
    })
    .set('Accept', 'application/json')
    .expect('Content-Type', /^application\/json/)
    .expect(409)

    expect(response.text).toEqual(expect.stringMatching(new RegExp(`O centro ${constants.CONTROLLING_AREA}/${COST_CENTER} não existe`)))

  })

  it('É possível criar uma configuração', async () => {

    const configOrigemData = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_1.VALID_FROM,
      "validTo": constants.PERIODO_1.VALID_TO,
    }
    
    let response = await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    expect(JSON.parse(response.text))
      .toEqual(expect.objectContaining(configOrigemData))

    response = await this.utils.request
      .get('/config/ConfigOrigens')
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    parsedResponse = JSON.parse(response.text)

    expect(parsedResponse)
      .toHaveProperty('value')

    expect(parsedResponse.value)
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining(configOrigemData)
        ]))

  })

  it('Não é possível criar configurações em datas sobrepostas: intercessão parcial / o mais velho existe.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    const configOrigemData1 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_1.VALID_FROM,
      "validTo": constants.PERIODO_1.VALID_TO,
    }
    
    await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData1)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const configOrigemData2 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_3.VALID_FROM,
      "validTo": constants.PERIODO_3.VALID_TO,
    }
      
    const response = await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData2)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(409)

    expect(response.text).toEqual(expect.stringMatching(
      new RegExp(`O periodo indicado fica sobreposto com uma configuração `+
        `já existente no periodo ${configOrigemData1.validFrom} - `+
        `${configOrigemData1.validTo}.`
        )))

  })

  it('Não é possível criar configurações em datas sobrepostas: intercessão parcial / o mais novo existe.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    const configOrigemData1 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_3.VALID_FROM,
      "validTo": constants.PERIODO_3.VALID_TO,
    }
    
    await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData1)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const configOrigemData2 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_1.VALID_FROM,
      "validTo": constants.PERIODO_1.VALID_TO,
    }
      
    const response = await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData2)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(409)

    expect(response.text).toEqual(expect.stringMatching(
      new RegExp(`O periodo indicado fica sobreposto com uma configuração `+
        `já existente no periodo ${configOrigemData1.validFrom} - `+
        `${configOrigemData1.validTo}.`
        )))

  })

  it('Não é possível criar configurações em datas sobrepostas: intercessão total / o maior existe.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    const configOrigemData1 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_1.VALID_FROM,
      "validTo": constants.PERIODO_1.VALID_TO,
    }
    
    await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData1)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const configOrigemData2 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_2.VALID_FROM,
      "validTo": constants.PERIODO_2.VALID_TO,
    }
      
    const response = await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData2)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(409)

    expect(response.text).toEqual(expect.stringMatching(
      new RegExp(`O periodo indicado fica sobreposto com uma configuração `+
        `já existente no periodo ${configOrigemData1.validFrom} - `+
        `${configOrigemData1.validTo}.`
        )))

  })

  it('Não é possível criar configurações em datas sobrepostas: intercessão total / o menor existe.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    const configOrigemData1 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_2.VALID_FROM,
      "validTo": constants.PERIODO_2.VALID_TO,
    }
    
    await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData1)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const configOrigemData2 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_1.VALID_FROM,
      "validTo": constants.PERIODO_1.VALID_TO,
    }
      
    const response = await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData2)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(409)

    expect(response.text).toEqual(expect.stringMatching(
      new RegExp(`O periodo indicado fica sobreposto com uma configuração `+
        `já existente no periodo ${configOrigemData1.validFrom} - `+
        `${configOrigemData1.validTo}.`
        )))

  })

  it('É possível criar configurações em periodos não sobrepostos: separados.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    const configOrigemData1 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_1.VALID_FROM,
      "validTo": constants.PERIODO_1.VALID_TO,
    }
    
    await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData1)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const configOrigemData2 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_4.VALID_FROM,
      "validTo": constants.PERIODO_4.VALID_TO,
    }

    await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData2)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    let response = await this.utils.request
      .get('/config/ConfigOrigens')
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    parsedResponse = JSON.parse(response.text)

    expect(parsedResponse)
      .toHaveProperty('value')

    expect(parsedResponse.value)
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining(configOrigemData1),
          expect.objectContaining(configOrigemData2),
        ]))
  })

  it('É possível criar configurações em periodos não sobrepostos: contiguos.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    const configOrigemData1 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_3.VALID_FROM,
      "validTo": constants.PERIODO_3.VALID_TO,
    }
    
    await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData1)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const configOrigemData2 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_4.VALID_FROM,
      "validTo": constants.PERIODO_4.VALID_TO,
    }

    await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData2)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    let response = await this.utils.request
      .get('/config/ConfigOrigens')
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    parsedResponse = JSON.parse(response.text)

    expect(parsedResponse)
      .toHaveProperty('value')

    expect(parsedResponse.value)
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining(configOrigemData1),
          expect.objectContaining(configOrigemData2),
        ]))
  })

  it('É possível criar configurações com chave distinta em periodos sobrepostos.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    const configOrigemData1 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_1.VALID_FROM,
      "validTo": constants.PERIODO_1.VALID_TO,
    }
    
    await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData1)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const configOrigemData2 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_2,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_3.VALID_FROM,
      "validTo": constants.PERIODO_3.VALID_TO,
    }

    await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData2)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    let response = await this.utils.request
      .get('/config/ConfigOrigens')
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    parsedResponse = JSON.parse(response.text)

    expect(parsedResponse)
      .toHaveProperty('value')

    expect(parsedResponse.value)
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining(configOrigemData1),
          expect.objectContaining(configOrigemData2),
        ]))
  })

  it('Não é possível modificar configurações gerando periodos sobrepostos: intercessão parcial / o mais novo é modificado.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    const configOrigemData1 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_1.VALID_FROM,
      "validTo": constants.PERIODO_1.VALID_TO,
    }
    
    const response1 = await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData1)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const configOrigemData2 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_4.VALID_FROM,
      "validTo": constants.PERIODO_4.VALID_TO,
    }

    const response2 = await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData2)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const response = await this.utils.request
      .patch(`/config/ConfigOrigens(${JSON.parse(response1.text).ID})`)
      .send({
        validTo: constants.PERIODO_5.VALID_FROM
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(409)

    expect(response.text).toEqual(expect.stringMatching(
      new RegExp(`O periodo indicado fica sobreposto com uma configuração `+
        `já existente no periodo ${configOrigemData2.validFrom} - `+
        `${configOrigemData2.validTo}.`
        )))

  })

  it('É possível modificar configurações sem gerar periodos sobrepostos.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    const configOrigemData1 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_1.VALID_FROM,
      "validTo": constants.PERIODO_1.VALID_TO,
    }
    
    const response1 = await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData1)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const configOrigemData2 = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_4.VALID_FROM,
      "validTo": constants.PERIODO_4.VALID_TO,
    }

    const response2 = await this.utils.request
      .post('/config/ConfigOrigens')
      .send(configOrigemData2)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    await this.utils.request
      .patch(`/config/ConfigOrigens(${JSON.parse(response1.text).ID})`)
      .send({
        validTo: constants.PERIODO_2.VALID_TO
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    configOrigemData1.validTo = constants.PERIODO_2.VALID_TO

    const response = await this.utils.request
      .get('/config/ConfigOrigens')
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    parsedResponse = JSON.parse(response.text)

    expect(parsedResponse)
      .toHaveProperty('value')

    expect(parsedResponse.value)
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining(configOrigemData1),
          expect.objectContaining(configOrigemData2),
        ]))
  })

})