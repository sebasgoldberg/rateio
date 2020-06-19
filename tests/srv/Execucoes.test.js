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
      return new RateioProcess(ID, srv, req)
    })
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

})