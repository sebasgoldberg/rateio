const { TestUtils, constants } = require('../utils')

// Necessario o mock, se não falha por tema de quantidade de conexões.
const RateioProcess = require('../../srv/rateio')
jest.mock('../../srv/rateio')

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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
    .auth(constants.ADMIN_USER)
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
    .auth(constants.ADMIN_USER)
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
    .auth(constants.ADMIN_USER)
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

  it('Não é possível criar uma configuração com um periodo invalido', async () => {
  
    const response = await this.utils.request
    .post('/config/ConfigOrigens')
    .auth(constants.ADMIN_USER)
    .send({
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": COST_CENTER,
      "validFrom": constants.PERIODO_1.VALID_TO,
      "validTo": constants.PERIODO_1.VALID_FROM,
    })
    .set('Accept', 'application/json')
    .expect('Content-Type', /^application\/json/)
    .expect(409)

    expect(response.text).toEqual(expect.stringMatching(new RegExp(
      `O periodo indicado ${constants.PERIODO_1.VALID_TO} - ${constants.PERIODO_1.VALID_FROM} é inválido.`)))

  })

  it('É possível criar uma configuração passando o indicador de se esta ativa, porem o mesmo é desconsiderado', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    const configOrigemData = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_1.VALID_FROM,
      "validTo": constants.PERIODO_1.VALID_TO,
      ativa: true,
    }
    
    const response1 = await this.utils.request
      .post('/config/ConfigOrigens')
      .auth(constants.ADMIN_USER)
      .send(configOrigemData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const response2 = await this.utils.request
      .get('/config/ConfigOrigens')
      .auth(constants.ADMIN_USER)
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    parsedResponse = JSON.parse(response2.text)

    expect(parsedResponse)
      .toHaveProperty('value')

    const configOrigemDataExpected = {
        "etapasProcesso_sequencia": constants.SEQUENCIA_1,
        "empresa_CompanyCode": constants.COMPANY_CODE,
        "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
        "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
        "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
        "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
        "validFrom": constants.PERIODO_1.VALID_FROM,
        "validTo": constants.PERIODO_1.VALID_TO,
        ativa: false,
      }

    expect(parsedResponse.value)
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining(configOrigemDataExpected)
        ]))

  })

  it('É possível modificar uma configuração passando o indicador de se esta ativa, porem o mesmo é desconsiderado', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    const configOrigemData = {
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "empresa_CompanyCode": constants.COMPANY_CODE,
      "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
      "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
      "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_1.VALID_FROM,
      "validTo": constants.PERIODO_1.VALID_TO,
      ativa: true,
    }
    
    const response1 = await this.utils.request
      .post('/config/ConfigOrigens')
      .auth(constants.ADMIN_USER)
      .send(configOrigemData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const response2 = await this.utils.request
      .patch(`/config/ConfigOrigens(${JSON.parse(response1.text).ID})`)
      .auth(constants.ADMIN_USER)
      .send({
        ativa: true
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    const response3 = await this.utils.request
      .get('/config/ConfigOrigens')
      .auth(constants.ADMIN_USER)
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    parsedResponse = JSON.parse(response3.text)

    expect(parsedResponse)
      .toHaveProperty('value')

    const configOrigemDataExpected = {
        "etapasProcesso_sequencia": constants.SEQUENCIA_1,
        "empresa_CompanyCode": constants.COMPANY_CODE,
        "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
        "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
        "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
        "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
        "validFrom": constants.PERIODO_1.VALID_FROM,
        "validTo": constants.PERIODO_1.VALID_TO,
        ativa: false,
      }

    expect(parsedResponse.value)
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining(configOrigemDataExpected)
        ]))

  })

  it('É possível criar uma configuração', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

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
      .auth(constants.ADMIN_USER)
      .send(configOrigemData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    expect(JSON.parse(response.text))
      .toEqual(expect.objectContaining(configOrigemData))

    response = await this.utils.request
      .get('/config/ConfigOrigens')
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
      .send(configOrigemData2)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    let response = await this.utils.request
      .get('/config/ConfigOrigens')
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
      .send(configOrigemData2)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    let response = await this.utils.request
      .get('/config/ConfigOrigens')
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
      .send(configOrigemData2)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    let response = await this.utils.request
      .get('/config/ConfigOrigens')
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
      .send(configOrigemData2)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const response = await this.utils.request
      .patch(`/config/ConfigOrigens(${JSON.parse(response1.text).ID})`)
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
      .send(configOrigemData2)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    await this.utils.request
      .patch(`/config/ConfigOrigens(${JSON.parse(response1.text).ID})`)
      .auth(constants.ADMIN_USER)
      .send({
        validTo: constants.PERIODO_2.VALID_TO
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    configOrigemData1.validTo = constants.PERIODO_2.VALID_TO

    const response = await this.utils.request
      .get('/config/ConfigOrigens')
      .auth(constants.ADMIN_USER)
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

  it('Não é possível modificar os campos que formam parte da identificação da configuração.', async () => {

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
      .auth(constants.ADMIN_USER)
      .send(configOrigemData1)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    await this.utils.request
      .post('/config/EtapasProcesso')
      .auth(constants.ADMIN_USER)
      .send({
        sequencia: 1234
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const keyFields = [
        [ 'etapasProcesso_sequencia', 1234 ],
        [ 'empresa_CompanyCode', '1234' ],
        [ 'contaOrigem_ChartOfAccounts', '1234' ],
        [ 'contaOrigem_GLAccount', '1234' ],
        [ 'centroCustoOrigem_ControllingArea', '1234' ],
        [ 'centroCustoOrigem_CostCenter', '1234' ],
      ]
    
    for (const modification of keyFields){

      const [ fieldName, newValue ] = modification
      const data = {}
      data[fieldName] = newValue

      const response = await this.utils.request
        .patch(`/config/ConfigOrigens(${JSON.parse(response1.text).ID})`)
        .auth(constants.ADMIN_USER)
        .send(data)
        .set('Accept', 'application/json')
        .expect('Content-Type', /^application\/json/)
        .expect(409)

      expect(response.text).toEqual(expect.stringMatching(
        new RegExp(`O campo ${fieldName} não deve ser modificado`)))

    }

  })

  it('Não é possível modificar uma configuração colocando um periodo invalido.', async () => {

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
    
    const response1 = await this.utils.request
      .post('/config/ConfigOrigens')
      .auth(constants.ADMIN_USER)
      .send(configOrigemData1)
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const response = await this.utils.request
      .patch(`/config/ConfigOrigens(${JSON.parse(response1.text).ID})`)
      .auth(constants.ADMIN_USER)
      .send({
        validTo: constants.PERIODO_1.VALID_FROM
      })
      .set('Accept', 'application/json')
      .expect('Content-Type', /^application\/json/)
      .expect(409)

    expect(response.text).toEqual(expect.stringMatching(new RegExp(
      `O periodo indicado ${constants.PERIODO_2.VALID_FROM} - ${constants.PERIODO_1.VALID_FROM} é inválido.`)))
  

  })

  it('Ao ativar uma configuração origem, a mesma tem que ter destinos.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    const ID = this.utils.createdData.configOrigem.ID

    const response = await this.utils.request
      .post(`/config/ConfigOrigens(${ID})/ConfigService.ativar`) 
      .auth(constants.ADMIN_USER)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect(409)

    expect(response.text).toEqual(expect.stringMatching(
      new RegExp(`Impossível ativar configuração ${ID}, a mesma não tem destinos definidos.`
        )))

  })

  it('Ao ativar uma configuração origem, a mesma tem que ter destinos.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
      .send(destino2)
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
      porcentagemRateio: "20.1",
    }

    const response3 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .auth(constants.ADMIN_USER)
      .send(destino3)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const destino4 = {
      origem_ID: this.utils.createdData.configOrigem.ID,
      tipoOperacao_operacao: constants.TIPO_OPERACAO_2,
      contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
      contaDestino_GLAccount: constants.GL_ACCOUNT_2,
      centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
      centroCustoDestino_CostCenter: constants.COST_CENTER_2,
      atribuicao: "4",
      porcentagemRateio: "20.05",
    }

    const response4 = await this.utils.request
      .post('/config/ConfigDestinos') 
      .auth(constants.ADMIN_USER)
      .send(destino4)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)
  
    const response = await this.utils.request
      .post(`/config/ConfigOrigens(${this.utils.createdData.configOrigem.ID})/ConfigService.ativar`) 
      .auth(constants.ADMIN_USER)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect(409)

    expect(response.text).toEqual(expect.stringMatching(
      new RegExp(`Impossível ativar a configuração. A soma das porcentagens agrupadas por tipo de operação não coincidem: .*`
        )))


  })

  it("Desativação: Só possível se a configuração não se encontra involucrada em nenhuma execução.", async () => {

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
      .auth(constants.ADMIN_USER)
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
      .auth(constants.ADMIN_USER)
      .send(destino2)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    // Ativação
    const respons3 = await this.utils.request
      .post(`/config/ConfigOrigens(${this.utils.createdData.configOrigem.ID})/ConfigService.ativar`) 
      .auth(constants.ADMIN_USER)
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

    const response9 = await this.utils.request
      .post('/config/Execucoes') 
      .auth(constants.ADMIN_USER)
      .send(execucao)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect('Content-Type', /^application\/json/)
      .expect(201)

    const { ID: execucaoID } = JSON.parse(response9.text)
      
    const response10 = await this.utils.request
      .post(`/config/Execucoes(${execucaoID})/ConfigService.executar`) 
      .auth(constants.ADMIN_USER)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect(204)

    // Intento de desativação da configuração
    const response11 = await this.utils.request
      .post(`/config/ConfigOrigens(${this.utils.createdData.configOrigem.ID})/ConfigService.desativar`) 
      .auth(constants.ADMIN_USER)
      .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
      .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
      .expect(409)

    expect(response11.text).toEqual(expect.stringMatching(
      new RegExp(`Impossível desativar a configuração. A mesma é utilizada na execução ${execucaoID}\\.`
        )))


  })

})