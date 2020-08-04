const cds = require('@sap/cds')
const { Readable } = require("stream")
const { STATUS_EXECUCAO } = require('./constants')
const parse = require('csv-parse')
const ConfigOrigensImplementation = require('./config-origens')
const { LogBase, MESSAGE_TYPES } = require('./log')
const { TextDecoder } = require('util')
const { ConfigDestinosImplementation } = require('.')
const log = require('./log')
const { RequestHandler } = require('./request-handler')

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

class ImportRequestHandler extends RequestHandler{

    error(req, code, message, target){
        throw Error(message)
    }

    setData(data){
        this.data = data
    }

    getData(req){
        return this.data
    }

    setParams(params){
        this.params = params
    }

    getParams(req){
        return this.params
    }

}

class OrigemRequestProcessor extends ConfigOrigensImplementation{

    constructor(srv){
        super(srv, new ImportRequestHandler())
    }

}

class DestinoRequestProcessor extends ConfigDestinosImplementation{

    constructor(srv){
        super(srv, new ImportRequestHandler())
    }

}

class OperacaoImportacaoBase{

    constructor(srv, req, importacao){
        this.srv = srv
        this.req = req
        this.importacao = importacao
        // TODO Estender ConfigOrigensImplementation.
        this.origemRequestProcessor = new OrigemRequestProcessor(this.srv)
        this.destinoRequestProcessor = new DestinoRequestProcessor(this.srv)
        this.log = new ImportacaoLog(this.srv, this.req)
        this.origemAtual = null
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

    origensLinhasIguais(linha1, linha2){

        const camposComparar = [ 
            'origem_ID',
            'etapasProcesso_sequencia',
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
            if (linha1[campo] != linha2[campo])
                return false
        }

        return true
    }

    isPrimeiraLinhaOrigem(lines, i){
        if (i == 0)
            return true
        // Verificamos que a linha atual seja distinta da anterior.
        return ! this.origensLinhasIguais(lines[i-1],lines[i])
    }

    isUltimaLinhaOrigem(lines, i){
        if (i == (lines.length-1))
            return true
        // Verificamos que a seguinte linha seja distinta da atual.
        return ! this.origensLinhasIguais(lines[i],lines[i+1])
    }

    async executar(){

        const { ID, csv } = this.importacao

        let lines;

        try {

            const fileContent = new TextDecoder("utf-8").decode(csv)
            lines = await this.parse(fileContent)
            lines.forEach( line => {
                line.ativa = ( line.ativa == 'true' )
                line.porcentagemRateio = Number(line.porcentagemRateio)
            })
        } catch (error) {

            this.req.error(409, `Erro ao tentar interpretar o conteudo do arquivo da importação ${ID}: ${String(error)}`)
            return

        }

        for (let i=0; i < lines.length; i++){
            const line = lines[i]
            await this._processLine({ line,
                isPrimeiraLinhaOrigem: this.isPrimeiraLinhaOrigem(lines,i),
                isUltimaLinhaOrigem: this.isUltimaLinhaOrigem(lines,i)
            })
        }

    }

    async info(message){
        await this.log.info({
            importacao_ID: this.importacao.ID
        }, message)
    }

    async debug(message){
        await this.log.log({
            importacao_ID: this.importacao.ID
        },{
            message: message,
            messageType: MESSAGE_TYPES.DEBUG
        })
    }

    async error(error){
        await this.log.log({ 
            importacao_ID: this.importacao.ID
        },{
            message: String(error),
            messageType: MESSAGE_TYPES.ERROR
        })
    }

    async _processLine({ line,
        isPrimeiraLinhaOrigem,
        isUltimaLinhaOrigem,
    }){
        await this.debug(`Inicio processamento ${JSON.stringify(line)}`)
        try {
            await this.processLine({ line,
                isPrimeiraLinhaOrigem,
                isUltimaLinhaOrigem,
            })
        } catch (error) {
            await this.error(error)
        }
        await this.debug(`Fim processamento ${JSON.stringify(line)}`)
    }

    async processLine({ line,
        isPrimeiraLinhaOrigem,
        isUltimaLinhaOrigem,
    }){
        console.log(line)
    }

    async ativarOrigem({ ID }){
        this.origemRequestProcessor.requestHandler.setParams([ID])
        await this.origemRequestProcessor.ativarConfiguracaoAction(this.req)
        await this.info(`Origem ${ID} ativada com sucesso.`)
    }

    async criarDestino({
        tipoOperacao_operacao,
        contaDestino_ChartOfAccounts,
        contaDestino_GLAccount,
        centroCustoDestino_ControllingArea,
        centroCustoDestino_CostCenter,
        atribuicao,
        porcentagemRateio,
    }){

        const destino = {
            origem_ID: this.origemAtual.ID,
            tipoOperacao_operacao,
            contaDestino_ChartOfAccounts,
            contaDestino_GLAccount,
            centroCustoDestino_ControllingArea,
            centroCustoDestino_CostCenter,
            atribuicao,
            porcentagemRateio,
        }

        this.destinoRequestProcessor.requestHandler.setData(destino)
        await this.destinoRequestProcessor.beforeCreate(this.req)
        
        const { ConfigDestinos } = this.srv.entities

        await cds.transaction(this.req).run(
            INSERT(destino)
                .into(ConfigDestinos)
        )

        const { destinoID } = await cds.transaction(this.req).run(
            SELECT.one
                .from(ConfigDestinos)
                .where(destino)
        )

        await this.info(`Destino ${destinoID} criado com sucesso.`)

    }
}

class OperacaoImportacaoCriar extends OperacaoImportacaoBase{

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

        this.origemRequestProcessor.requestHandler.setData(origem)
        await this.origemRequestProcessor.beforeCreate(this.req)
        
        const { ConfigOrigens } = this.srv.entities

        await cds.transaction(this.req).run(
            INSERT(origem)
                .into(ConfigOrigens)
        )

        this.origemAtual = await cds.transaction(this.req).run(
            SELECT.one
                .from(ConfigOrigens)
                .where(origem)
        )

        await this.info(`Origem ${this.origemAtual.ID} criada com sucesso.`)
    }

    async processLine({ line,
        isPrimeiraLinhaOrigem,
        isUltimaLinhaOrigem,
    }){
        let origem

        if (isPrimeiraLinhaOrigem)
            origem = await this.criarOrigem(line)
        else
            origem = this.origemAtual

        await this.criarDestino(line)

        if (isUltimaLinhaOrigem && line.ativa)
            await this.ativarOrigem(origem)
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