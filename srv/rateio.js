const cds = require('@sap/cds')
const bs = require("binary-search");
const { read } = require('@sap/cds');

class RateioProcess{

    constructor(execucoes_ID, srv, req){
        this.execucoes_ID = execucoes_ID
        this.srv = srv
        this.req = req
        this.saldosEtapaProcessada = []
    }

    async getEtapas(){

        const { EtapasExecucoes } = this.srv.entities

        const etapas = await cds.transaction(this.req).run(
            SELECT(['sequencia'])
                .from(EtapasExecucoes)
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

    async execute(){

        this.execucao = await this.getDadosExecucao()

        const etapas = await this.getEtapas()

        for (const etapa of etapas){
            await this.processEtapa(etapa)
        }

    }

    async getItensExecucao(etapa){

        const { EtapasExecucoes } = this.srv.entities

        return cds.transaction(this.req).run(
            SELECT
                .from(EtapasExecucoes)
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

        const compare = (a,b,field) => {
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
        const { Documentos } = this.srv.entities

        return cds.transaction(this.req).run(
            SELECT
                .from(ConfigDestinos)
                .where('origem_ID = ', origem_ID)
        )

    }

    async getDocumentoSeJaExiste(item, saldoItem){

        const { DocumentosPorOrigem } = this.srv.entities

        return cds.transaction(this.req).run(
            SELECT.one
                .from(DocumentosPorOrigem)
                .where((({
                    sequencia,
                    CompanyCode,
                    ChartOfAccounts,
                    GLAccount,
                    ControllingArea,
                    CostCenter,
                }) => ({
                    sequencia,
                    CompanyCode,
                    ChartOfAccounts,
                    GLAccount,
                    ControllingArea,
                    CostCenter,
                }))(item))
                .and({
                    cancelado: false,
                    moeda: saldoItem.CompanyCodeCurrency
                })
        )
    
    }
    
    getItemDebitCreditCode(saldoItem, destino){

        if (destino.tipoOperacao_operacao = 'credito'){
            return saldoItem.AmountInCompanyCodeCurrency > 0 ?
                'H' : 'S'
        }else if (destino.tipoOperacao_operacao = 'debito'){
            return saldoItem.AmountInCompanyCodeCurrency > 0 ?
                'S' : 'H'
        }
        
        throw `Tipo de operação desconhecida no destino ${JSON.stringify(destino)}`

    }

    getItemAmountInTransactionCurrency(saldoItem, destino){
        return Math.abs(saldoItem.AmountInCompanyCodeCurrency * destino.porcentagemRateio / 100)
    }
    
    async criarDocumento(item, saldoItem){

        const destinos = await this.getConfigDestinos(item.configuracaoOrigem_ID)

        const documentoExistente = await this.validarSeDocumentoExiste(saldoItem)
        if (documentoExistente){
            const { CompanyCode, AccountingDocument, FiscalYear } = documentoExistente
            // TODO implementar
            //this.logItemExecucao.warning(item, `Documento ${CompanyCode} ${AccountingDocument} ${FiscalYear} já gerado para o origem ${JSON.stringify(saldoItem)}.`)
            return
        }

        const documento = new Documento(srv)

        documento.setDadosCabecalho({
            PostingDate: this.getPostingDate(), // TODO Definir
            CompanyCode: item.CompanyCode,
        })

        for (const destino of destinos){
            documento.addItem({
                AmountInTransactionCurrency: this.getItemAmountInTransactionCurrency(saldoItem, destino),
                currencyCode: saldoItem.CompanyCodeCurrency,
                GLAccount: destino.contaDestino_GLAccount,
                CostCenter: destino.centroCustoDestino_CostCenter,
                DebitCreditCode: this.getItemDebitCreditCode(saldoItem, destino),
                DocumentItemText: `Rateio ${this.getPeriodoFim}`,
                // TODO Passar o valor do item.atribuicao e ver como enviar pela API SOAP
            })
        }

        // Geração do documento utilizando a API SOAP.
        await documento.post()

    }

    async processarItem(item){

        const index = bs(this.saldosEtapaProcessada, item, this.compareSaldosEntry)

        if (index < 0){
            // TODO implementar
            //this.logItemExecucao.warning(item, `Saldo não encontrado para o item ${JSON.stringify(item)}.`)
        }

        let from = index
        let to = index

        while ((from > 0) && 
            (this.compareSaldosEntry(this.saldosEtapaProcessada[from-1],this.saldosEtapaProcessada[from]) == 0))
            from -= 1

        while ((to < this.saldosEtapaProcessada.length) && 
            (this.compareSaldosEntry(this.saldosEtapaProcessada[to],this.saldosEtapaProcessada[to+1]) == 0))
            to += 1

        for (const i = from; i <= to; i++){
            const saldoItem = this.saldosEtapaProcessada[i]
            try {
                await this.criarDocumento(item, saldoItem)
            } catch (error) {
                // TODO implementar
                // this.logItemExecucao.error(item, error)
            }
        }
        
    }

    async processEtapa(etapa){

        // Obtiene los itens de la etapa a ser processados
        const itensAProcessar = await this.getItensExecucao(etapa)

        await this.selectSaldos(itensAProcessar)

        // Por cada item processa el item
        await Promise.all(itensAProcessar.map( item => this.processarItem(item) ))

    }

}

module.exports = RateioProcess