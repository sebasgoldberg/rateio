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

    // Criamos as configurações

    const origensData = [
      {
        "etapasProcesso_sequencia": constants.SEQUENCIA_3,
        "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
        "validFrom": constants.PERIODO_1.VALID_FROM,
        "validTo": constants.PERIODO_1.VALID_TO,
      },
      {
        "etapasProcesso_sequencia": constants.SEQUENCIA_1,
        "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
        "validFrom": constants.PERIODO_1.VALID_FROM,
        "validTo": constants.PERIODO_1.VALID_TO,
      },
      {
        "etapasProcesso_sequencia": constants.SEQUENCIA_2,
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

    expect(rateioProcess.processEtapa.mock.calls.length).toBe(3);
    
    expect(rateioProcess.processEtapa.mock.calls[0][0]).toEqual(
      expect.objectContaining({ sequencia: constants.SEQUENCIA_1 }));

    expect(rateioProcess.processEtapa.mock.calls[1][0]).toEqual(
      expect.objectContaining({ sequencia: constants.SEQUENCIA_2 }));

    expect(rateioProcess.processEtapa.mock.calls[2][0]).toEqual(
      expect.objectContaining({ sequencia: constants.SEQUENCIA_3 }));

  })

  it('O processamento de cada etapa, processa cada item conforme esperado.', async () => {

    await this.utils.deployAndServe()
    await this.utils.createTestData();

    // Criamos as configurações

    const origensData = [
      {
        "etapasProcesso_sequencia": constants.SEQUENCIA_3,
        "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
        "validFrom": constants.PERIODO_1.VALID_FROM,
        "validTo": constants.PERIODO_1.VALID_TO,
      },
      {
        "etapasProcesso_sequencia": constants.SEQUENCIA_1,
        "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
        "validFrom": constants.PERIODO_1.VALID_FROM,
        "validTo": constants.PERIODO_1.VALID_TO,
      },
      {
        "etapasProcesso_sequencia": constants.SEQUENCIA_1,
        "centroCustoOrigem_CostCenter": constants.COST_CENTER_2,
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

    // Criamos a execução
    const response9 = await this.utils.createExecucao(
      { dataConfiguracoes: "2020-06-15T00:00:00Z" }
    )
      .expect(201)

    const execucaoID = JSON.parse(response9.text).ID

    let rateioProcess;

    createRateioProcess.mockImplementationOnce( (ID, srv, req) => {
      rateioProcess = new RateioProcess(ID, srv, req)
      rateioProcess.processarItem = jest.fn()
      rateioProcess.processarItem.mockImplementation(() => Promise.resolve());
      return rateioProcess
    })

    const response10 = await this.utils.executarExecucao(execucaoID)
      .expect(204)
      
    expect(rateioProcess.processarItem.mock.calls.length).toBe(3);

    const [ origemData3, origemData1, origemData2 ] = origensData.map( o => ({
      sequencia: o.etapasProcesso_sequencia,
      CostCenter: o.centroCustoOrigem_CostCenter,
    }))

    const order = (a,b) =>
      a.CostCenter < b.CostCenter ? -1 : 
      a.CostCenter == b.CostCenter ? 0 : 
      1

    expect([
      rateioProcess.processarItem.mock.calls[0][0],
      rateioProcess.processarItem.mock.calls[1][0]
      ].sort(order)).toEqual(
        expect.arrayContaining([
          expect.objectContaining(origemData1),
          expect.objectContaining(origemData2),
        ].sort(order))
      );

    expect(rateioProcess.processarItem.mock.calls[2][0]).toEqual(
      expect.objectContaining(origemData3));

  })

})