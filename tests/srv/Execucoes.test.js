const { TestUtils, constants } = require('../utils')
const { STATUS_EXECUCAO } = require('../../srv/execucoes')
const RateioProcess = require('../../srv/rateio')

jest.mock('../../srv/rateio')

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

    RateioProcess.mockImplementationOnce(() => {
        return {
          execute: async () => {
            return Promise.reject()
          }
        }
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

    RateioProcess.mockImplementationOnce(() => {
        return {
          execute: async () => {
            return Promise.resolve()
          }
        }
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

  it('Até o processo de rateio não finalizar, a execução deve ficar com o status de em execução.', async (done) => {

    let testeValidado;
    const validacaoTeste = new Promise( resolve => testeValidado = resolve )

    let rateioEmExecucao;
    const execucaoRateio = new Promise( resolve => rateioEmExecucao = resolve )

    RateioProcess.mockImplementationOnce(() => {
        return {
          execute: async () => {
            rateioEmExecucao()
            await validacaoTeste
          }
        }
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

    await execucaoRateio

    const response6 = await this.utils.getExecucao(execucaoID)
      .expect(200)

    const { status_status: status } = JSON.parse(response6.text)

    expect(status).toBe(STATUS_EXECUCAO.EM_EXECUCAO)

    testeValidado()

    // Necessario para conseguir finalizar a execução dos rateios de forma correta
    setTimeout(() => {
      done()
    }, 10);

  })

  // it('Apos execução deve ser realizada por etapa em ordem crecente.', async () => {

  //   await this.utils.deployAndServe()
  //   await this.utils.createTestData();

  //   // Criamos o primeiro origem com SEQUENCIA_2

  //   const response1 = await this.utils.createOrigem({
  //     "etapasProcesso_sequencia": constants.SEQUENCIA_2,
  //     "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
  //     "validFrom": constants.PERIODO_1.VALID_FROM,
  //     "validTo": constants.PERIODO_1.VALID_TO,
  //   })
  //     .expect(201)

  //   const origem1ID = JSON.parse(response1.text).ID

  //   const response2 = await this.utils.createDestino({
  //     origem_ID: origem1ID,
  //   })
  //     .expect(201)

  //   const response3 = await this.utils.createDestino({
  //     origem_ID: origem1ID,
  //     tipoOperacao_operacao: constants.TIPO_OPERACAO_2 
  //   })
  //     .expect(201)

  //   const response4 = await this.utils.activateOrigem(origem1ID)
  //     .expect(204)

  //   // Criamos o segundo origem com SEQUENCIA_1

  //   const response5 = await this.utils.createOrigem({
  //     "etapasProcesso_sequencia": constants.SEQUENCIA_1,
  //     "centroCustoOrigem_CostCenter": constants.COST_CENTER_2,
  //     "validFrom": constants.PERIODO_1.VALID_FROM,
  //     "validTo": constants.PERIODO_1.VALID_TO,
  //   })
  //     .expect(201)

  //   const origem2ID = JSON.parse(response5.text).ID

  //   const response6 = await this.utils.createDestino({
  //     origem_ID: origem2ID,
  //   })
  //     .expect(201)

  //   const response7 = await this.utils.createDestino({
  //     origem_ID: origem2ID,
  //     tipoOperacao_operacao: constants.TIPO_OPERACAO_2 
  //   })
  //     .expect(201)

  //   const response8 = await this.utils.activateOrigem(origem2ID)
  //     .expect(204)

  //   // Criamos a execução
  //   const response9 = await this.utils.createExecucao(
  //     { dataConfiguracoes: "2020-06-15T00:00:00Z" }
  //   )
  //     .expect(201)

  //   const execucaoID = JSON.parse(response9.text).ID

  //   const response10 = await this.utils.executarExecucao(execucaoID)
  //     .expect(204)

  //   // TODO Validar chamada em ordem correto ao método RateioProcess.processEtapa.

  // })
  
  })