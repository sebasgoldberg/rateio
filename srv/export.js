const cds = require('@sap/cds')
const { Readable } = require("stream")

class ExportImplementation{

    constructor(srv){
        this.srv = srv
    }

    async getExportCSVReadableStream(req){

        const { ConfigOrigensDestinos } = this.srv.entities

        const result = await cds.transaction(req).run(
            SELECT.from(ConfigOrigensDestinos)
        )

        const BOM = "\uFEFF"; 

        const header = `#Origem;Origem;Origem;Origem;Origem;Origem;Origem;Origem;Origem;Origem;Origem;Destino;Destino;Destino;Destino;Destino;Destino;Destino;Destino\n`+
            `#ID;Etapa;Empresa;Chart Of Accounts;Conta;Controlling Area;Centro de Custo;Valido de;Valido até;Ativa;Descricao;ID;Operacao (credito, debito);Chart Of Accounts;Conta;Controlling Area;Centro de Custo;Atribuição;Porcentagem Rateio\n`+
            `origem_ID;etapasProcesso_sequencia;empresa_CompanyCode;contaOrigem_ChartOfAccounts;contaOrigem_GLAccount;centroCustoOrigem_ControllingArea;centroCustoOrigem_CostCenter;validFrom;validTo;ativa;descricao;destino_ID;operacao;contaDestino_ChartOfAccounts;contaDestino_GLAccount;centroCustoDestino_ControllingArea;centroCustoDestino_CostCenter;atribuicao;porcentagemRateio\n`

        const csvContent = BOM + result
            .reduce((result, destino)=>{
                const columns = [
                    // Dados do origem
                    'origem_ID',
                    'etapa',
                    'empresa',
                    'contaOrigem_ChartOfAccounts',
                    'contaOrigem_GLAccount',
                    'centroCustoOrigem_ControllingArea',
                    'centroCustoOrigem_CostCenter',
                    'validFrom',
                    'validTo',
                    'ativa',
                    'descricao',

                    // Dados do destino
                    'destino_ID',
                    'operacao',
                    'contaDestino_ChartOfAccounts',
                    'contaDestino_GLAccount',
                    'centroCustoDestino_ControllingArea',
                    'centroCustoDestino_CostCenter',
                    'atribuicao',
                    'porcentagemRateio',
                ]
                return result + 
                    columns.map( column => destino[column] ).join(';') +
                    '\n'
            },header)

        return Readable.from([csvContent])

    }

    async onReadExportacao(req){
        const url = req._.req.path
        
        req._.res.set('Content-Disposition', `filename="rateio-config-${new Date().toISOString()}.csv"`);

        if (/\/csv$/.test(url)) {
            return [
                {
                    value: await this.getExportCSVReadableStream(req)
                }
            ]
        }
    }

    registerHandles(){

        const { Exportacao } = this.srv.entities
        
        this.srv.on('READ', Exportacao, this.onReadExportacao.bind(this))

    }

}

module.exports = ExportImplementation