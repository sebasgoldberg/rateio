const cds = require('@sap/cds')

describe('Rateio: TiposOperacoes', () => {
    let srv, Books
  
    beforeAll(async () => {
        await cds.deploy(__dirname + '/../../srv/service').to('sqlite::memory:')
        srv = await cds.serve('ConfigService').from(__dirname + '/../../srv/service')
        TiposOperacoes = srv.entities.TiposOperacoes
        expect(TiposOperacoes).toBeDefined()
    })
  
    it('Os valores possíveis estão definidos', async () => {
        const operacoes = await srv.read(TiposOperacoes, b => { b.operacao })
    
        expect(operacoes).toMatchObject([
            { operacao: 'credito' },
            { operacao: 'debito' },
        ])
    })

    it('Os textos ven carregados em portugues', async () => {
        const operacoes = await srv.read(TiposOperacoes, b => { b.descricao })
    
        expect(operacoes).toMatchObject([
            { descricao: 'Crédito' },
            { descricao: 'Débito' },
        ])
    })

})

describe('Rateio: ConfigOrigens', () => {
    let srv, Books
  
    beforeAll(async () => {
        await cds.deploy(__dirname + '/../../srv/service').to('sqlite::memory:')
        srv = await cds.serve('ConfigService').from(__dirname + '/../../srv/service');
        //const cds = await require('@sap/cds').connect('db')


        ConfigOrigens = srv.entities.ConfigOrigens
        expect(ConfigOrigens).toBeDefined()

        EtapasProcesso = srv.entities.EtapasProcesso
        expect(EtapasProcesso).toBeDefined()

        await srv.create(EtapasProcesso).entries([{ sequencia: 10 }])
    })
  
    it('Não é possível criar uma configuração para uma etapa que não existe.', async () => {
        let error;
        try {
            await srv.create(ConfigOrigens).entries([
                {
                    "etapasProcesso_sequencia": 20,
                    "validFrom": "2019-06-01T00:00:00.000Z",
                    "validTo": "2019-06-30T00:00:00.000Z",
                    "empresa_CompanyCode": "1001",
                    "contaOrigem_ChartOfAccounts": "1234",
                    "contaOrigem_GLAccount": "1234",
                    "centroCustoOrigem_ControllingArea": "1235",
                    "centroCustoOrigem_CostCenter": "1234",
                    "centroCustoOrigem_ValidityEndDate": "9999-12-31"
                }
            ])
        } catch (e) {
            error = e
        }
        expect(error.toString()).toEqual("Error: Reference integrity is violated for association 'etapasProcesso'")
    })

})