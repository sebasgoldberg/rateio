const cds = require('@sap/cds')
const bs = require("binary-search");
const createDocumento = require('./documento-factory');
const { Log, MESSAGE_TYPES } = require('./log');

class RateioProcess{

    constructor(execucoes_ID, srv, req){
        this.execucoes_ID = execucoes_ID
        this.srv = srv
        this.req = req
        this.saldosEtapaProcessada = []
        this._log = new Log(this.srv, this.req)
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

    async log(data){

        await this._log.logExecucao(this.execucoes_ID, data)   

    }

    async logItem(item, data){

        await this._log.logItemExecucao(this.execucoes_ID, item.configuracaoOrigem_ID, data)

    }

    async execute(){

        await this.log({
            messageType: MESSAGE_TYPES.DEBUG,
            message: `Processo de rateio iniciado.`
        })

        this.execucao = await this.getDadosExecucao()

        const etapas = await this.getEtapas()

        for (const etapa of etapas){

            try {

                await this.processEtapa(etapa)   

            } catch (error) {

                await this.log({
                    messageType: MESSAGE_TYPES.ERROR,
                    message: `Erro ao processar a etapa ${etapa.sequencia}. `+
                        `É finalizada a execução e não serão processadas etapas subsequentes.`
                })

                await this.log({
                    messageType: MESSAGE_TYPES.DEBUG,
                    message: `Processo de rateio finalizado.`
                })        

                throw error
            }

        }

        await this.log({
            messageType: MESSAGE_TYPES.DEBUG,
            message: `Processo de rateio finalizado.`
        })

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
                messageType: MESSAGE_TYPES.WARNING,
                message: `Documento ${CompanyCode} ${AccountingDocument} ${FiscalYear} já gerado para o origem ${JSON.stringify(saldoItem)}.`
            })
            return            
        }

        const documento = createDocumento(this.srv)

        documento.setDadosCabecalho({
            PostingDate: this.getPostingDate(),
            CompanyCode: item.CompanyCode,
            DocumentReferenceID: this.getPeriodoFim(),
            DocumentHeaderText: `Rateio ${this.getPeriodoFim()}`
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

        const { CompanyCode, AccountingDocument, FiscalYear } = documento

        await Promise.all([
            this.registrarDocumento(item, documento, saldoItem),
            await this.logItem(item, {
                messageType: MESSAGE_TYPES.INFO,
                message: `Documento criado com sucesso ${CompanyCode} ${AccountingDocument} ${FiscalYear}.`
            })
        ])



    }

    async processarItem(item){

        const index = bs(this.saldosEtapaProcessada, item, this.compareSaldosEntry)

        if (index < 0){

            await this.logItem(item, {
                messageType: MESSAGE_TYPES.WARNING,
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
                    messageType: MESSAGE_TYPES.ERROR,
                    message: `Aconteceu um erro ao tentar criar o documento para o saldo ${JSON.stringify(saldoItem)}.`
                })
                throw error
            }
        }
        
    }

    async processEtapa(etapa){

        await this.log({
            messageType: MESSAGE_TYPES.DEBUG,
            message: `Processamento da etapa ${etapa.sequencia} iniciado.`
        })        

        try {

            // Obtiene los itens de la etapa a ser processados
            const itensAProcessar = await this.getItensExecucao(etapa)

            await this.selectSaldos(itensAProcessar)

            // Por cada item processa el item
            // TODO Ver se paralelizar
            // await Promise.all(itensAProcessar.map( item => this.processarItem(item) ))
            for (const item of itensAProcessar){

                await this.log({
                    messageType: MESSAGE_TYPES.DEBUG,
                    message: `Inicio processamento do item ${JSON.stringify(item)}.`
                })

                try {

                    await this.processarItem(item)

                    await this.log({
                        messageType: MESSAGE_TYPES.DEBUG,
                        message: `Fim processamento do item ${JSON.stringify(item)}.`
                    })
    
                } catch (error) {

                    await this.log({
                        messageType: MESSAGE_TYPES.DEBUG,
                        message: `Fim processamento do item ${JSON.stringify(item)}.`
                    })

                    throw error
                }

            }

            await this.log({
                messageType: MESSAGE_TYPES.DEBUG,
                message: `Processamento da etapa ${etapa.sequencia} finalizado.`
            })        

        } catch (error) {
            
            await this.log({
                messageType: MESSAGE_TYPES.DEBUG,
                message: `Processamento da etapa ${etapa.sequencia} finalizado.`
            })
            
            throw error
            
        }
    
    }

}

module.exports = RateioProcess