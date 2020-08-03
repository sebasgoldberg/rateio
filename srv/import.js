const cds = require('@sap/cds')
const { Readable } = require("stream")
const { STATUS_EXECUCAO } = require('./constants')
const parse = require('csv-parse')
const ConfigOrigensImplementation = require('./config-origens')
const { LogBase, MESSAGE_TYPES } = require('./log')
const { TextDecoder } = require('util')

const OPERACAO_IMPORTACAO = {
    CRIAR: 'criar',
    MODIFICAR: 'modificar',
    ELIMINAR: 'eliminar',
}

class ImportacaoLog extends LogBase{

    getKeyObject({ importacao_ID }){
        return { importacao_ID }
    }

    getEntitySet(){
        const { ImportacoesLogs } = this.srv.entities
        return ImportacoesLogs
    }

}

class OrigemRequestProcessor extends ConfigOrigensImplementation{

    error(req, code, message, target){
        throw Error(message)
    }

    setData(data){
        this.data = data
    }

    getData(req){
        return this.data
    }

}

class OperacaoImportacaoBase{

    constructor(srv, req, importacao){
        this.srv = srv
        this.req = req
        this.importacao = importacao
        // TODO Estender ConfigOrigensImplementation.
        this.origemRequestProcessor = new OrigemRequestProcessor(this.srv)
        this.log = new ImportacaoLog(this.srv, this.req)
    }

    async parse(content){
        return new Promise( (resolve, reject) => {
            parse(content, {
                comment: '#',
                columns: true,
                bom: true,
                delimiter: ';',
            }, function(error, output){
                if (error)
                    reject(error)
                resolve(output)
            })      
        })
    }

    async executar(){

        const { ID, csv } = this.importacao

        let lines;

        try {

            const fileContent = new TextDecoder("utf-8").decode(csv)
            lines = await this.parse(fileContent)

        } catch (error) {

            this.req.error(409, `Erro ao tentar interpretar o conteudo do arquivo da importação ${ID}: ${String(error)}`)
            return

        }

        for (let i=0; i < lines.length; i++){
            const line = lines[i]
            await this._processLine(line)
        }

    }

    debug(message){
        this.log.log({ 
            importacao_ID: this.importacao.ID
        },{
            message: message,
            messageType: MESSAGE_TYPES.DEBUG
        })
    }

    error(error){
        this.log.log({ 
            importacao_ID: this.importacao.ID
        },{
            message: String(error),
            messageType: MESSAGE_TYPES.ERROR
        })
    }

    async _processLine(line){
        this.debug(`Inicio processamento ${JSON.stringify(line)}`)
        try {
            await this.processLine(line)
        } catch (error) {
            this.error(error)
        }
        this.debug(`Fim processamento ${JSON.stringify(line)}`)
    }

    async processLine(line){
        console.log(line)
    }
    
}

class OrigemAtualNaoExistente extends Error{

}

class OperacaoImportacaoCriar extends OperacaoImportacaoBase{

    constructor(srv, req, importacao){
        super(srv, req, importacao)
        this.origemAtual = null
    }

    isOrigemCoincideComLinha(origem, linha){

        const camposComparar = [ 'etapasProcesso_sequencia',
            'empresa_CompanyCode',
            'contaOrigem_ChartOfAccounts',
            'contaOrigem_GLAccount',
            'centroCustoOrigem_ControllingArea',
            'centroCustoOrigem_CostCenter',
            'validFrom',
            'validTo',
            'descricao'
        ]

        for (const campo of camposComparar){
            if (origem[campo] != linha[campo])
                return false
        }

        return true
    }

    isOrigemAtualCoincideComLinha(line){
        return this.isOrigemCoincideComLinha(this.origemAtual, line)
    }

    getOrigemAtual(line){
        if (this.origemAtual == null)
            throw new OrigemAtualNaoExistente('O origem atual ainda não foi definido')
        if (this.isOrigemAtualCoincideComLinha(line))
            return this.origemAtual
        throw new OrigemAtualNaoExistente('O origem atual não coincide com dados da linha.')
    }

    async criarOrigem({
        etapasProcesso_sequencia,
        empresa_CompanyCode,
        contaOrigem_ChartOfAccounts,
        contaOrigem_GLAccount,
        centroCustoOrigem_ControllingArea,
        centroCustoOrigem_CostCenter,
        validFrom,
        validTo,
        descricao
    }){
        const origem = {
            etapasProcesso_sequencia,
            empresa_CompanyCode,
            contaOrigem_ChartOfAccounts,
            contaOrigem_GLAccount,
            centroCustoOrigem_ControllingArea,
            centroCustoOrigem_CostCenter,
            validFrom,
            validTo,
            descricao
        }

        this.origemRequestProcessor.setData(origem)
        await this.origemRequestProcessor.beforeCreate(this.req)
        
        const { ConfigOrigens } = this.srv.entities

        // TODO Ver se é efetivamente obtido a origem atual.
        await cds.transaction(this.req).run(
            INSERT(origem)
                .into(ConfigOrigens)
        )

        this.origemAtual = await cds.transaction(this.req).run(
            SELECT.one
                .from(ConfigOrigens)
                .where(origem)
        )

    }

    async processLine(line){
        let origem
        try {
            origem = this.getOrigemAtual(line)
        } catch (error) {
            if (error instanceof OrigemAtualNaoExistente)
                origem = await this.criarOrigem(line)
            else
                throw error
        }
        // TODO Criar os destinos correspondentes.
    }
    
}

class OperacaoImportacaoModificar extends OperacaoImportacaoBase{

    async processLine(line){
        super.processLine(line)
    }
    
}

class OperacaoImportacaoEliminar extends OperacaoImportacaoBase{
    
    async processLine(line){
        super.processLine(line)
    }
    
}


class ImportImplementation{

    constructor(srv){
        this.srv = srv
    }

    async afterReadImportacoes(importacoes, req){

        const { ID } = req.data
        
        req._.res.set('Content-Disposition', `filename="rateio-config-import-${ID}.csv"`);

    }

    async beforeImportarImportacoesAction(req){

        const ID = req.params[0]

        const { Importacoes } = this.srv.entities

        const importacao = await cds.transaction(req).run(
            SELECT.one
                .from(Importacoes)
                .where('ID = ', ID)
        )

        if (!importacao){
            req.error(409, `A importacao ${ID} não existe`)
            return
        }

        const { status_status } = importacao

        if (status_status != STATUS_EXECUCAO.NAO_EXECUTADO){
            req.error(409, `A importação ${ID} não pode ser executada já que atualmente esta com o status ${status_status}.`, 'status_status')
            return
        }

        const { csv } = importacao

        if (!csv){
            req.error(409, `A importação ${ID} não tem arquivo associado, por favor realice o upload do arquivo a importar.`)
            return
        }

    }

    createOperacaoImportacao(req, importacao){

        const { operacao_operacao } = importacao

        if (operacao_operacao == OPERACAO_IMPORTACAO.CRIAR)
            return new OperacaoImportacaoCriar(this.srv, req, importacao)
        else if (operacao_operacao == OPERACAO_IMPORTACAO.MODIFICAR)
            return new OperacaoImportacaoModificar(this.srv, req, importacao)
        else if (operacao_operacao == OPERACAO_IMPORTACAO.ELIMINAR)
            return new OperacaoImportacaoEliminar(this.srv, req, importacao)

    }

    async importarImportacoesAction(req){

        const ID = req.params[0]

        const { Importacoes } = this.srv.entities

        const importacao = await cds.transaction(req).run(
            SELECT.one
                .from(Importacoes)
                .where('ID = ', ID)
        )

        const operacaoImportacao = this.createOperacaoImportacao(req, importacao)

        await operacaoImportacao.executar()

    }

    registerHandles(){

        const { Importacoes } = this.srv.entities
        
        this.srv.after('READ', Importacoes, this.afterReadImportacoes.bind(this))
        this.srv.before('importar', Importacoes, this.beforeImportarImportacoesAction.bind(this))
        this.srv.on('importar', Importacoes, this.importarImportacoesAction.bind(this))

    }

}

module.exports = {
    ImportImplementation,
    OPERACAO_IMPORTACAO
}