const cds = require('@sap/cds')

describe('Rateio: TiposOperacoes', () => {
    let srv, Books
  
    beforeAll(async () => {
        await cds.deploy(__dirname + '/../srv/service').to('sqlite::memory:')
        srv = await cds.serve('ConfigService').from(__dirname + '/../srv/service')
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
  })