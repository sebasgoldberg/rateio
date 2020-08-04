const { TestUtils, constants } = require('../utils')
const { OPERACAO_IMPORTACAO } = require('../../srv/import')
const { MESSAGE_TYPES } = require('../../srv/log')

describe('OData: Rateio: Importacoes', () => {

  this.utils = new TestUtils()

  beforeEach(async () => {
    await this.utils.deployAndServe()
    await this.utils.createTestData();
  })

  it('Service $metadata document', async () => {
    const response = await this.utils.request
      .get('/config/$metadata')
      .auth(constants.ADMIN_USER, constants.ADMIN_USER)
      .expect('Content-Type', /^application\/xml/)
      .expect(200)

    const expectedVersion = '<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">'
    const expectedBooksEntitySet = '<EntitySet Name="Importacoes" EntityType="ConfigService.Importacoes">'
    expect(response.text.includes(expectedVersion)).toBeTruthy()
    expect(response.text.includes(expectedBooksEntitySet)).toBeTruthy()
  })


  it('As origens e os destinos são criados com sucesso ao importar um CSV.', async () => {

    const response1 = await this.utils.criarImportacao({
      descricao: 'Test',
      operacao_operacao: OPERACAO_IMPORTACAO.CRIAR
    }).expect(201)

    const importacaoID = JSON.parse(response1.text).ID

    const origem1 = {
      etapasProcesso_sequencia: constants.SEQUENCIA_1,
      empresa_CompanyCode: constants.COMPANY_CODE,
      contaOrigem_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
      contaOrigem_GLAccount: constants.GL_ACCOUNT_1,
      centroCustoOrigem_ControllingArea: constants.CONTROLLING_AREA,
      centroCustoOrigem_CostCenter: constants.COST_CENTER_1,
      validFrom: constants.PERIODO_1.VALID_FROM,
      validTo: constants.PERIODO_1.VALID_TO,
      ativa: true,
      descricao: 'Origem Importado 1',
    }

    const origem2 = {
      ...origem1,
      contaOrigem_GLAccount: constants.GL_ACCOUNT_1,
      descricao: 'Origem Importado 2',
      ativa: false,
    }

    const destino1 = {
      tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
      contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
      contaDestino_GLAccount: constants.GL_ACCOUNT_1,
      centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
      centroCustoDestino_CostCenter: constants.COST_CENTER_1,
      atribuicao: '',
      porcentagemRateio: 1.1
    }

    const destino2 = {
      ...destino1,
      tipoOperacao_operacao: constants.TIPO_OPERACAO_2,
    }

    const destino3 = {
      ...destino1,
      porcentagemRateio: 2.2
    }

    const destino4 = {
      ...destino3,
      tipoOperacao_operacao: constants.TIPO_OPERACAO_2,
    }

    const response2 = await this.utils.carregarCsvImportacao({ 
      ID: importacaoID,
      csvContent: [
        {
          origem_ID: '',
          ...origem1,
          destino_ID: '',
          ...destino1,
        },
        {
          origem_ID: '',
          ...origem1,
          destino_ID: '',
          ...destino2,
        },
        {
          origem_ID: '',
          ...origem2,
          destino_ID: '',
          ...destino3,
        },
        {
          origem_ID: '',
          ...origem2,
          destino_ID: '',
          ...destino4,
        },
      ]
    }).expect(204)

    await this.utils.importar({ ID: importacaoID })
      .expect(204)

    const response10 = await this.utils.request
      .get('/config/ConfigOrigens')
      .query({ 
        $filter: `descricao eq '${ origem1.descricao }'`, 
        $expand: `destinos`
      })
      .auth(constants.ADMIN_USER, constants.ADMIN_USER)
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    const parsedResponse1 = JSON.parse(response10.text)

    expect(parsedResponse1)
      .toHaveProperty('value')

    expect(parsedResponse1.value.length)
      .toBe(1)

    expect(parsedResponse1.value[0])
      .toHaveProperty('destinos')
    expect(parsedResponse1.value[0].destinos.length)
      .toBe(2)

    expect(parsedResponse1.value)
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining(origem1),
        ]))

    expect(parsedResponse1.value[0].destinos)
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining(destino1),
          expect.objectContaining(destino2),
        ]))
  
    const response11 = await this.utils.request
      .get('/config/ConfigOrigens')
      .query({ 
        $filter: `descricao eq '${ origem2.descricao }'`, 
        $expand: `destinos`
      })
      .auth(constants.ADMIN_USER, constants.ADMIN_USER)
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    const parsedResponse2 = JSON.parse(response11.text)

    expect(parsedResponse2)
      .toHaveProperty('value')

    expect(parsedResponse2.value.length)
      .toBe(1)

    expect(parsedResponse2.value[0])
      .toHaveProperty('destinos')
    expect(parsedResponse2.value[0].destinos.length)
      .toBe(2)

    expect(parsedResponse2.value)
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ...origem2,
          }),
        ]))

    expect(parsedResponse2.value[0].destinos)
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining(destino3),
          expect.objectContaining(destino4),
        ]))
  
  })

  it('Ao importar um CSV, se acontecerem multiplos erros, um deles deve aparecer no log.', async () => {

    const response1 = await this.utils.criarImportacao({
      descricao: 'Test',
      operacao_operacao: OPERACAO_IMPORTACAO.CRIAR
    }).expect(201)

    const importacaoID = JSON.parse(response1.text).ID

    const origem1 = {
      etapasProcesso_sequencia: constants.SEQUENCIA_1,
      empresa_CompanyCode: 'ZZZZ', // Não existe
      contaOrigem_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
      contaOrigem_GLAccount: '01234567', // Não existe
      centroCustoOrigem_ControllingArea: constants.CONTROLLING_AREA,
      centroCustoOrigem_CostCenter: constants.COST_CENTER_1,
      validFrom: constants.PERIODO_1.VALID_TO, // invertido
      validTo: constants.PERIODO_1.VALID_FROM, // invertido
      ativa: true,
      descricao: 'Origem Importado 1',
    }

    const destino1 = {
      tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
      contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
      contaDestino_GLAccount: constants.GL_ACCOUNT_1,
      centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
      centroCustoDestino_CostCenter: constants.COST_CENTER_1,
      atribuicao: '',
      porcentagemRateio: 1.1
    }

    const response2 = await this.utils.carregarCsvImportacao({ 
      ID: importacaoID,
      csvContent: [
        {
          origem_ID: '',
          ...origem1,
          destino_ID: '',
          ...destino1,
        },
      ]
    }).expect(204)

    await this.utils.importar({ ID: importacaoID })
      .expect(204)

    const response10 = await this.utils.request
      .get('/config/ConfigOrigens')
      .query({ 
        $filter: `descricao eq '${ origem1.descricao }'`, 
      })
      .auth(constants.ADMIN_USER, constants.ADMIN_USER)
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    const parsedResponse1 = JSON.parse(response10.text)

    expect(parsedResponse1)
      .toHaveProperty('value')

    expect(parsedResponse1.value.length)
      .toBe(0)


    const response11 = await this.utils.request
      .get(`/config/Importacoes(${importacaoID})/logs`)
      .auth(constants.ADMIN_USER, constants.ADMIN_USER)
      .expect('Content-Type', /^application\/json/)
      .expect(200)

    const parsedResponse2 = JSON.parse(response11.text)

    expect(parsedResponse2)
      .toHaveProperty('value')

    const possibleErrorMessagesRegExp = [
      new RegExp(`A empresa ${origem1.empresa_CompanyCode} não existe`),
      new RegExp(`A conta ${origem1.contaOrigem_ChartOfAccounts}/${origem1.contaOrigem_GLAccount} não existe`),
      new RegExp(`O periodo indicado ${origem1.validFrom} - ${origem1.validTo} é inválido.`),
    ]

    const errorMessagesFound = parsedResponse2.value.filter( ({ messageType, message }) => {
      if (messageType == MESSAGE_TYPES.ERROR)
        for (const messageRegExp of possibleErrorMessagesRegExp)
          if (messageRegExp.test(message))
            return true
      return false
    })

    expect(errorMessagesFound.length).toBe(1)

  })

})