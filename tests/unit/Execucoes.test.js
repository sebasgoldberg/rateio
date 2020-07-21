const { TestUtils, constants } = require('../utils')
const { STATUS_EXECUCAO } = require('../../srv/execucoes')
const createRateioProcess = require('../../srv/rateio-factory');
const RateioProcess = require('../../srv/rateio');

jest.mock('../../srv/rateio-factory');

describe('OData: Rateio: Execucoes', () => {

  this.utils = new TestUtils()

  beforeAll(async () => {
    await this.utils.deployAndServe()
    await this.utils.createTestData();
    createRateioProcess.mockImplementation( (ID, srv, req) => {
      const rateio = new RateioProcess(ID, srv, req)
      rateio.execute = jest.fn(()=>Promise.resolve())
      return rateio
    })
  })

  it('Service $metadata document', async () => {
    const response = await this.utils.request
      .get('/config/$metadata')
      .auth(constants.ADMIN_USER, constants.ADMIN_USER)
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

  it('Só possível modificar/eliminar uma execução se a mesma ainda não foi executada.', async () => {

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

    const response6 = await this.utils.modificarExecucao(execucaoID, {descricao: "Outra descrição"})
      .expect(409)

    expect(response6.text).toEqual(expect.stringMatching(
      new RegExp(`A execução ${execucaoID} não pode ser modificada/eliminada já que `+
        `atualmente esta com o status .*\\.`
        )))

    const response7 = await this.utils.eliminarExecucao(execucaoID)
      .expect(409)

    expect(response7.text).toEqual(expect.stringMatching(
      new RegExp(`A execução ${execucaoID} não pode ser modificada/eliminada já que `+
        `atualmente esta com o status .*\\.`
        )))
  
  })

  it('Se acontecer algum erro no processo de rateio, então a execução deve ficar com o status de cancelada.', async () => {

    createRateioProcess.mockImplementationOnce( (ID, srv, req) => {
      rateioProcess = new RateioProcess(ID, srv, req)
      rateioProcess.execute = jest.fn()
      rateioProcess.execute.mockImplementation(() => Promise.reject());
      return rateioProcess
    })

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

    const response6 = await this.utils.getExecucao(execucaoID)
      .expect(200)

    const { status_status: status } = JSON.parse(response6.text)

    expect(status).toBe(STATUS_EXECUCAO.CANCELADO)

  })

  it('Se não acontecer erro no processo de rateio, então a execução deve ficar com o status de finalizada.', async () => {

    createRateioProcess.mockImplementationOnce( (ID, srv, req) => {
      rateioProcess = new RateioProcess(ID, srv, req)
      rateioProcess.execute = jest.fn()
      rateioProcess.execute.mockImplementation(() => Promise.resolve());
      return rateioProcess
    })

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

    const response6 = await this.utils.getExecucao(execucaoID)
      .expect(200)

    const { status_status: status } = JSON.parse(response6.text)

    expect(status).toBe(STATUS_EXECUCAO.FINALIZADO)

  })

  it('Até o processo de rateio não finalizar, a execução deve ficar com o status de em execução.', async () => {

    let execucaoDuranteExecute

    createRateioProcess.mockImplementationOnce( (ID, srv, req) => {
      const rateioProcess = new RateioProcess(ID, srv, req)
      rateioProcess.execute = jest.fn()
      rateioProcess.execute.mockImplementation(async function(){
        
        const { Execucoes } = this.srv.entities

        execucaoDuranteExecute = await cds.transaction(this.req).run(
            SELECT.one
                .from(Execucoes)
                .where('ID = ', this.execucoes_ID)
        )

        return Promise.resolve()

      });
      return rateioProcess
    })
  
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

    const { status_status: status } = execucaoDuranteExecute

    expect(status).toBe(STATUS_EXECUCAO.EM_EXECUCAO)

  })

  it('Uma execução não pode ter multiplas instancias concorrentes.', async () => {

    createRateioProcess.mockImplementationOnce( (ID, srv, req) => {
      rateioProcess = new RateioProcess(ID, srv, req)
      rateioProcess.execute = jest.fn()
      rateioProcess.execute.mockImplementation(() => Promise.resolve());
      return rateioProcess
    })

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

    const execucoesPromises = []
    for (let i=0; i<4; i++)
      execucoesPromises.push(this.utils.executarExecucao(execucaoID))

    const responses = await Promise.all(execucoesPromises)

    const responsesStatus = responses.reduce((reduced, current) => {
      reduced[current.status]+=1
      return reduced
    }, {204:0, 409:0})

    expect(responsesStatus).toStrictEqual(expect.objectContaining({204:1, 409:3}))

  })

  it('Não é possível processar uma etapa sem antes ter processado a etapa anterior.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    // Criamos as configurações

    const origensData = [
      {
        "etapaProcesso_sequencia": constants.SEQUENCIA_3,
        "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
        "validFrom": constants.PERIODO_1.VALID_FROM,
        "validTo": constants.PERIODO_1.VALID_TO,
      },
      {
        "etapaProcesso_sequencia": constants.SEQUENCIA_1,
        "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
        "validFrom": constants.PERIODO_1.VALID_FROM,
        "validTo": constants.PERIODO_1.VALID_TO,
      }
    ]

    for (const origemData of origensData){

      const response1 = await this.utils.createOrigem(origemData).expect(201)
      
      const origemID = JSON.parse(response1.text).ID

      const response2 = await this.utils.createDestino({
        origem_ID: origemID,
      })
        .expect(201)
  
      const response3 = await this.utils.createDestino({
        origem_ID: origemID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_2 
      })
        .expect(201)
  
      const response4 = await this.utils.activateOrigem(origemID)
        .expect(204)
    }

    // Criamos a execução da ultima etapa
    const response9 = await this.utils.createExecucao(
      { 
        dataConfiguracoes: "2020-06-15T00:00:00Z",
        etapaProcesso_sequencia: constants.SEQUENCIA_3,
      }
    )
      .expect(201)

    const execucaoID = JSON.parse(response9.text).ID

    const response10 = await this.utils.executarExecucao(execucaoID)
      .expect(409)

    expect(response10.text).toEqual(expect.stringMatching(
      new RegExp(`A execução ${execucaoID} não pode ser executada já que `+
        `ainda não foi finalizada com sucesso a etapa anterior: ${constants.SEQUENCIA_1}\\.`
        )))
  
  })

  it('É possível processar uma etapa se a etapa anterior foi executada com sucesso.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    // Criamos as configurações

    const origensData = [
      {
        "etapaProcesso_sequencia": constants.SEQUENCIA_3,
        "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
        "validFrom": constants.PERIODO_1.VALID_FROM,
        "validTo": constants.PERIODO_1.VALID_TO,
      },
      {
        "etapaProcesso_sequencia": constants.SEQUENCIA_1,
        "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
        "validFrom": constants.PERIODO_1.VALID_FROM,
        "validTo": constants.PERIODO_1.VALID_TO,
      }
    ]

    for (const origemData of origensData){

      const response1 = await this.utils.createOrigem(origemData).expect(201)
      
      const origemID = JSON.parse(response1.text).ID

      const response2 = await this.utils.createDestino({
        origem_ID: origemID,
      })
        .expect(201)
  
      const response3 = await this.utils.createDestino({
        origem_ID: origemID,
        tipoOperacao_operacao: constants.TIPO_OPERACAO_2 
      })
        .expect(201)
  
      const response4 = await this.utils.activateOrigem(origemID)
        .expect(204)
    }

    // Criamos a execução da primeira etapa
    const response9 = await this.utils.createExecucao(
      { 
        dataConfiguracoes: "2020-06-15T00:00:00Z",
        etapaProcesso_sequencia: constants.SEQUENCIA_1,
      }
    )
      .expect(201)

    const execucaoID1 = JSON.parse(response9.text).ID

    const response10 = await this.utils.executarExecucao(execucaoID1)
      .expect(204)

    // Criamos a execução da seguinte etapa
    const response11 = await this.utils.createExecucao(
      { 
        dataConfiguracoes: "2020-06-15T00:00:00Z",
        etapaProcesso_sequencia: constants.SEQUENCIA_3,
      }
    )
      .expect(201)

    const execucaoID2 = JSON.parse(response11.text).ID

    const response12 = await this.utils.executarExecucao(execucaoID2)
      .expect(204)

 
  })

})