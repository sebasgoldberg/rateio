const { TestUtils, constants } = require('../utils');
const createRateioProcess = require('../../srv/rateio-factory');
const RateioProcess = require('../../srv/rateio');

jest.mock('../../srv/rateio-factory');

describe('Processo: Rateio', () => {

  this.utils = new TestUtils()

  beforeAll(async () => {
    await this.utils.deployAndServe()
    await this.utils.createTestData();
  })

  it('Os rateios devem ser ser realizados por etapa em ordem crecente.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    // Criamos o primeiro origem com SEQUENCIA_2

    const response1 = await this.utils.createOrigem({
      "etapasProcesso_sequencia": constants.SEQUENCIA_2,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
      "validFrom": constants.PERIODO_1.VALID_FROM,
      "validTo": constants.PERIODO_1.VALID_TO,
    })
      .expect(201)

    const origem1ID = JSON.parse(response1.text).ID

    const response2 = await this.utils.createDestino({
      origem_ID: origem1ID,
    })
      .expect(201)

    const response3 = await this.utils.createDestino({
      origem_ID: origem1ID,
      tipoOperacao_operacao: constants.TIPO_OPERACAO_2 
    })
      .expect(201)

    const response4 = await this.utils.activateOrigem(origem1ID)
      .expect(204)

    // Criamos o segundo origem com SEQUENCIA_1

    const response5 = await this.utils.createOrigem({
      "etapasProcesso_sequencia": constants.SEQUENCIA_1,
      "centroCustoOrigem_CostCenter": constants.COST_CENTER_2,
      "validFrom": constants.PERIODO_1.VALID_FROM,
      "validTo": constants.PERIODO_1.VALID_TO,
    })
      .expect(201)

    const origem2ID = JSON.parse(response5.text).ID

    const response6 = await this.utils.createDestino({
      origem_ID: origem2ID,
    })
      .expect(201)

    const response7 = await this.utils.createDestino({
      origem_ID: origem2ID,
      tipoOperacao_operacao: constants.TIPO_OPERACAO_2 
    })
      .expect(201)

    const response8 = await this.utils.activateOrigem(origem2ID)
      .expect(204)

    // Criamos a execução
    const response9 = await this.utils.createExecucao(
      { dataConfiguracoes: "2020-06-15T00:00:00Z" }
    )
      .expect(201)

    const execucaoID = JSON.parse(response9.text).ID

    let rateioProcess;

    createRateioProcess.mockImplementationOnce( (ID, srv, req) => {
      rateioProcess = new RateioProcess(ID, srv, req)
      rateioProcess.processEtapa = jest.fn()
      rateioProcess.processEtapa.mockImplementation(() => Promise.resolve());
      return rateioProcess
    })

    const response10 = await this.utils.executarExecucao(execucaoID)
      .expect(204)

    expect(rateioProcess.processEtapa.mock.calls.length).toBe(2);
    
    expect(rateioProcess.processEtapa.mock.calls[0][0]).toEqual(
      expect.objectContaining({ sequencia: constants.SEQUENCIA_1 }));

    expect(rateioProcess.processEtapa.mock.calls[1][0]).toEqual(
      expect.objectContaining({ sequencia: constants.SEQUENCIA_2 }));

  })


})