const cds = require('@sap/cds')
const bs = require("binary-search");
const createDocumento = require('./documento-factory');
const LOG_MESSAGE_MAX_POSITION = 511

class RateioProcess{

    constructor(execucoes_ID, srv, req){
        this.execucoes_ID = execucoes_ID
        this.srv = srv
        this.req = req
        this.saldosEtapaProcessada = []
    }

    async getEtapas(){

        const { ConfigOrigensExecucoes } = this.srv.entities

        const etapas = await cds.transaction(this.req).run(
            SELECT(['sequencia'])
                .from(ConfigOrigensExecucoes)
                .where('execucao_ID = ', this.execucoes_ID)
                .groupBy('sequencia')
                .orderBy('sequencia')
        )

        return etapas

    }

    async getDadosExecucao(){

        const { Execucoes } = this.srv.entities

        const execucao = await cds.transaction(this.req).run(
            SELECT.one
                .from(Execucoes)
                .where('ID = ', this.execucoes_ID)
        )

        return execucao

    }

    toLogMessage(message){
        if (message){
            return message.substring(0,LOG_MESSAGE_MAX_POSITION)
        }
    }

    async log(data){
        
        const { ExecucoesLogs } = this.srv.entities

        const _data = {
            ...data,
            ...{
                execucao_ID: this.execucoes_ID,
            }
        }

        _data.message = this.toLogMessage(_data.message)

        await cds.transaction(this.req).run(
            INSERT(_data)
                .into(ExecucoesLogs)
        )
    }

    async logItem(item, data){

        const { ItensExecucoesLogs } = this.srv.entities

        const _data = {
            ...data,
            ...{
                item_execucao_ID: this.execucoes_ID,
                item_configuracaoOrigem_ID: item.configuracaoOrigem_ID
            }
        }

        _data.message = this.toLogMessage(_data.message)

        await cds.transaction(this.req).run(
            INSERT(_data)
                .into(ItensExecucoesLogs)
        )
    }

    async execute(){

        this.execucao = await this.getDadosExecucao()

        const etapas = await this.getEtapas()

        for (const etapa of etapas){
            try {
                await this.processEtapa(etapa)   
            } catch (error) {
                await this.log({
                    messageType: 'E',
                    message: `Erro ao processar a etapa ${etapa.sequencia}. `+
                        `É finalizada a execução e não serão processadas etapas subsequentes.`
                })
                throw error
            }
        }

    }

    async getItensExecucao(etapa){

        const { ConfigOrigensExecucoes } = this.srv.entities

        return cds.transaction(this.req).run(
            SELECT
                .from(ConfigOrigensExecucoes)
                .where('execucao_ID = ', this.execucoes_ID)
                .and('sequencia =', etapa.sequencia)
        )

    }

    getPeriodoInicio(){
        return `001/${this.execucao.ano}`
    }

    getPeriodoFim(){
        return `${this.execucao.periodo.toString().padStart(3, '0')}/${this.execucao.ano}`
    }

    buildSaldosOrigensCondition(itensExecucao){
        return { 
            or: itensExecucao.map( item => ({
                and: [
                    'CompanyCode',
                    'ChartOfAccounts',
                    'GLAccount',
                    'ControllingArea',
                    'CostCenter',
                ].map( fieldName => ({[fieldName]: item[fieldName]})) 
            }))
        }
    }

    compareSaldosEntry(a, b){

        const compare = (a,b) => {
            if ( a < b )
                return -1
            if ( a > b )
                return 1
            return 0
        }

        let result

        result = compare(a.CompanyCode, b.CompanyCode)
        if (result != 0) return result
        
        result = compare(a.ChartOfAccounts, b.ChartOfAccounts)
        if (result != 0) return result

        result = compare(a.GLAccount, b.GLAccount)
        if (result != 0) return result

        result = compare(a.ControllingArea, b.ControllingArea)
        if (result != 0) return result

        return result = compare(a.CostCenter, b.CostCenter)

    }

    async selectSaldos(itensExecucao){

        const { A_JournalEntryItemBasic } = this.srv.entities

        const condicaoOrigens = this.buildSaldosOrigensCondition(itensExecucao)

        const periodoInicio = this.getPeriodoInicio()
        const periodoFim = this.getPeriodoFim()

        this.saldosEtapaProcessada = await

            this.srv.read(A_JournalEntryItemBasic)
                .columns(['CompanyCode', 'ChartOfAccounts', 'GLAccount', 'ControllingArea', 'CostCenter', 'AmountInCompanyCodeCurrency', 'CompanyCodeCurrency' ])
                .where('Ledger =', '0L')
                .and('FiscalYearPeriod >=', periodoInicio)
                .and('FiscalYearPeriod <=', periodoFim)
                .and(condicaoOrigens)

        this.saldosEtapaProcessada.sort(this.compareSaldosEntry)
    }

    async getConfigDestinos(origem_ID){

        // Obtenção das informações de destino.
        const { ConfigDestinos } = this.srv.entities

        return cds.transaction(this.req).run(
            SELECT
                .from(ConfigDestinos)
                .where('origem_ID = ', origem_ID)
        )

    }

    async getDocumentoSeJaExiste(item, saldoItem){
        
        const { ConfigOrigensDocumentos } = this.srv.entities

        const filter = {
            and: [
                'sequencia',
                'CompanyCode',
                'ChartOfAccounts',
                'GLAccount',
                'ControllingArea',
                'CostCenter',
            ].map( fieldName => ({[fieldName]: item[fieldName]}))
        }

        const documento = await cds.transaction(this.req).run(
            SELECT.one
                .from(ConfigOrigensDocumentos)
                .where(filter)
                .and({ cancelado: false })
                .and({ moeda: saldoItem.CompanyCodeCurrency })
                .and({ periodo: this.execucao.periodo })
                .and({ ano: this.execucao.ano })
            )

        return documento
            
    }
    
    getItemDebitCreditCode(saldoItem, destino){

        if (destino.tipoOperacao_operacao == 'credito'){
            return saldoItem.AmountInCompanyCodeCurrency > 0 ?
                'H' : 'S'
        }else if (destino.tipoOperacao_operacao == 'debito'){
            return saldoItem.AmountInCompanyCodeCurrency > 0 ?
                'S' : 'H'
        }
        
        throw `Tipo de operação desconhecida no destino ${JSON.stringify(destino)}`

    }

    getItemAmountInTransactionCurrency(saldoItem, destino){
        return Math.abs(saldoItem.AmountInCompanyCodeCurrency * destino.porcentagemRateio / 100)
    }

    async registrarDocumento(item, documento, saldoItem){
        
        const { Documentos } = this.srv.entities

        const entries = [
            documento.CompanyCode, documento.AccountingDocument, documento.FiscalYear,
            saldoItem.CompanyCodeCurrency, item.execucao_ID, item.configuracaoOrigem_ID
        ]

        await cds.transaction(this.req).run(
            INSERT
                .into(Documentos)
                .columns(
                    'CompanyCode', 'AccountingDocument', 'FiscalYear', 'moeda', 
                    'itemExecutado_execucao_ID', 'itemExecutado_configuracaoOrigem_ID'
                    )
                .entries(entries)
        )

    }

    getPostingDate(){
        // O ultimo dia do periodo indicado na execução.
        const d = new Date(Date.UTC(Number(this.execucao.ano), Number(this.execucao.periodo), 0))
        return d.toISOString().split('T')[0];
    }

    async criarDocumento(item, saldoItem){

        const destinos = await this.getConfigDestinos(item.configuracaoOrigem_ID)

        const documentoExistente = await this.getDocumentoSeJaExiste(item, saldoItem)

        if (documentoExistente){
            const { CompanyCode, AccountingDocument, FiscalYear } = documentoExistente
            await this.logItem(item, {
                messageType: 'W',
                message: `Documento ${CompanyCode} ${AccountingDocument} ${FiscalYear} já gerado para o origem ${JSON.stringify(saldoItem)}.`
            })
            return            
        }

        const documento = createDocumento(this.srv)

        documento.setDadosCabecalho({
            PostingDate: this.getPostingDate(),
            CompanyCode: item.CompanyCode,
        })

        for (const destino of destinos){
            documento.addItem({
                AmountInTransactionCurrency: this.getItemAmountInTransactionCurrency(saldoItem, destino),
                currencyCode: saldoItem.CompanyCodeCurrency,
                GLAccount: destino.contaDestino_GLAccount,
                CostCenter: destino.centroCustoDestino_CostCenter,
                DebitCreditCode: this.getItemDebitCreditCode(saldoItem, destino),
                DocumentItemText: `Rateio ${this.getPeriodoFim()}`,
                AssignmentReference: destino.atribuicao,
            })
        }

        // Geração do documento utilizando a API SOAP.
        await documento.post()

        await this.registrarDocumento(item, documento, saldoItem)

    }

    async processarItem(item){

        const index = bs(this.saldosEtapaProcessada, item, this.compareSaldosEntry)

        if (index < 0){

            await this.logItem(item, {
                messageType: 'W',
                message: `Saldo não encontrado para o item ${JSON.stringify(item)}.`
            })
            return
        }

        let from = index
        let to = index

        while ((from > 0) && 
            (this.compareSaldosEntry(this.saldosEtapaProcessada[from-1],this.saldosEtapaProcessada[from]) == 0))
            from -= 1

        while ((to < (this.saldosEtapaProcessada.length-1)) && 
            (this.compareSaldosEntry(this.saldosEtapaProcessada[to],this.saldosEtapaProcessada[to+1]) == 0))
            to += 1

        for (let i = from; i <= to; i++){
            const saldoItem = this.saldosEtapaProcessada[i]
            try {
                await this.criarDocumento(item, saldoItem)
            } catch (error) {
                await this.logItem(item, {
                    messageType: 'E',
                    message: `Aconteceu um erro ao tentar criar o documento para o saldo ${JSON.stringify(saldoItem)}.`
                })
                throw error
            }
        }
        
    }

    async processEtapa(etapa){
        
        // Obtiene los itens de la etapa a ser processados
        const itensAProcessar = await this.getItensExecucao(etapa)

        await this.selectSaldos(itensAProcessar)

        // Por cada item processa el item
        // TODO Ver se paralelizar
        // await Promise.all(itensAProcessar.map( item => this.processarItem(item) ))
        for (const item of itensAProcessar)
            await this.processarItem(item)

    }

}

module.exports = RateioProcess