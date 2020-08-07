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
        throw new Error(message)
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

    setValorAtiva(req){
        // Neste caso não mudamos os dados da request, já que realizamos o INSERT pelo codigo.
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

        const { Importacoes } = this.srv.entities

        await cds.transaction(this.req).run(
            UPDATE(Importacoes)
                .set({status_status: STATUS_EXECUCAO.EM_EXECUCAO})
                .where({ID: ID})
        )

        let lines;

        try {

            const fileContent = new TextDecoder("utf-8").decode(csv)
            lines = await this.parse(fileContent)
            lines.forEach( line => {
                line.etapasProcesso_sequencia = Number(line.etapasProcesso_sequencia)
                line.ativa = ( line.ativa == 'true' )
                line.porcentagemRateio = Number(line.porcentagemRateio)
            })
        } catch (error) {

            await cds.transaction(this.req).run(
                UPDATE(Importacoes)
                    .set({status_status: STATUS_EXECUCAO.NAO_EXECUTADO})
                    .where({ID: ID})
            )
    
            this.req.error(409, `Erro ao tentar interpretar o conteudo do arquivo da importação ${ID}: ${String(error)}`)
            return

        }

        for (let i=0; i < lines.length; i++){
            this.lineNumber = i
            const line = lines[i]
            await this._processLine({ line,
                isPrimeiraLinhaOrigem: this.isPrimeiraLinhaOrigem(lines,i),
                isUltimaLinhaOrigem: this.isUltimaLinhaOrigem(lines,i),
                lineNumber: i
            })
        }

        await cds.transaction(this.req).run(
            UPDATE(Importacoes)
                .set({status_status: STATUS_EXECUCAO.FINALIZADO})
                .where({ID: ID})
        )

    }

    async info(message){
        await this.log.info({
            importacao_ID: this.importacao.ID
        }, `${this.lineNumber}) ${message}`)
    }

    async warn(message){
        await this.log.warn({
            importacao_ID: this.importacao.ID
        }, `${this.lineNumber}) ${message}`)
    }

    async debug(message){
        await this.log.log({
            importacao_ID: this.importacao.ID
        },{
            message: `${this.lineNumber}) ${message}`,
            messageType: MESSAGE_TYPES.DEBUG
        })
    }

    async error(error){
        await this.log.log({ 
            importacao_ID: this.importacao.ID
        },{
            message: `${this.lineNumber}) ${error.message || String(error)}`,
            messageType: MESSAGE_TYPES.ERROR
        })
    }

    async _processLine({ line,
        isPrimeiraLinhaOrigem,
        isUltimaLinhaOrigem,
        lineNumber
    }){
        try {
            await this.processLine({ line,
                isPrimeiraLinhaOrigem,
                isUltimaLinhaOrigem,
            })
        } catch (error) {
            await this.error(error)
        }
    }

    async processLine({ line,
        isPrimeiraLinhaOrigem,
        isUltimaLinhaOrigem,
    }){
        console.log(line)
    }

    async ativarOrigem({ ID }){
        this.origemRequestProcessor.requestHandler.setParams([ID])
        try {
            await this.origemRequestProcessor.ativarConfiguracaoAction(this.req)
            await this.info(`Origem ${ID} ativada com sucesso.`)
        } catch (error) {
            this.warn(String(error))
        }
    }

    async desativarOrigem({ ID }){
        this.origemRequestProcessor.requestHandler.setParams([ID])
        try {
            await this.origemRequestProcessor.desativarConfiguracaoAction(this.req)
            await this.info(`Origem ${ID} desativada com sucesso.`)
        } catch (error) {
            this.warn(String(error))
        }
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

        const count = await cds.transaction(this.req).run(
            INSERT(destino)
                .into(ConfigDestinos)
        )

        if (count == 0)
            throw new Error(`Não foi possível criar o destino ${JSON.stringify(destino)}`)

        const { ID } = await cds.transaction(this.req).run(
            SELECT.one
                .from(ConfigDestinos)
                .where(destino)
        )

        await this.info(`Destino ${ID} criado com sucesso.`)

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
        this.origemAtual = null

        const origem = {
            etapasProcesso_sequencia,
            empresa_CompanyCode,
            contaOrigem_ChartOfAccounts,
            contaOrigem_GLAccount,
            centroCustoOrigem_ControllingArea,
            centroCustoOrigem_CostCenter,
            validFrom,
            validTo,
            descricao,
            ativa: false
        }

        this.origemRequestProcessor.requestHandler.setData(origem)
        await this.origemRequestProcessor.beforeCreate(this.req)
        
        const { ConfigOrigens } = this.srv.entities

        const count = await cds.transaction(this.req).run(
            INSERT(origem)
                .into(ConfigOrigens)
        )

        if (count == 0)
            throw new Error(`Não foi possível criar a origem ${JSON.stringify(origem)}`)

        this.origemAtual = await cds.transaction(this.req).run(
            SELECT.one
                .from(ConfigOrigens)
                .where(origem)
                .orderBy({createdAt: 'desc'})
        )

        await this.info(`Origem ${this.origemAtual.ID} criada com sucesso.`)
    }

    async processLine({ line,
        isPrimeiraLinhaOrigem,
        isUltimaLinhaOrigem,
    }){

        if (isPrimeiraLinhaOrigem)
            try {
                await this.criarOrigem(line)
            } catch (error) {
                this.error(error)
            }

        if (this.origemAtual == null){
            this.warn('Não será criado o destino, a origem não chegou a ser criada.')
            return
        }

        await this.criarDestino(line)

        if (isUltimaLinhaOrigem && line.ativa)
            await this.ativarOrigem(this.origemAtual)
    }
    
}

class OperacaoImportacaoModificar extends OperacaoImportacaoBase{

    origensLinhasIguais({ origem_ID: origem1_ID }, { origem_ID: origem2_ID }){
        return origem1_ID == origem2_ID
    }

    async modificarOrigem({
        origem_ID,
        validFrom,
        validTo,
        descricao
    }){

        const origem = {
            validFrom,
            validTo,
            descricao
        }

        this.origemRequestProcessor.requestHandler.setData(origem)
        await this.origemRequestProcessor.beforeUpdate(this.req)
        
        const { ConfigOrigens } = this.srv.entities

        const count = await cds.transaction(this.req).run(
            UPDATE(ConfigOrigens).set(origem).where({ID: origem_ID})
        )

        if (count == 0)
            await this.error(`Não foi possível modificar a origem ${origem_ID}.`)
        else
            await this.info(`Origem ${origem_ID} modificada com sucesso.`)

        this.origemAtual = await cds.transaction(this.req).run(
            SELECT.one
                .from(ConfigOrigens)
                .where({ ID: origem_ID })
        )

    }

    async modificarDestino({
        destino_ID,
        tipoOperacao_operacao,
        contaDestino_ChartOfAccounts,
        contaDestino_GLAccount,
        centroCustoDestino_ControllingArea,
        centroCustoDestino_CostCenter,
        atribuicao,
        porcentagemRateio,
    }){

        const destino = {
            tipoOperacao_operacao,
            contaDestino_ChartOfAccounts,
            contaDestino_GLAccount,
            centroCustoDestino_ControllingArea,
            centroCustoDestino_CostCenter,
            atribuicao,
            porcentagemRateio,
        }

        this.destinoRequestProcessor.requestHandler.setData(destino)
        await this.destinoRequestProcessor.beforeUpdate(this.req)
        
        const { ConfigDestinos } = this.srv.entities

        const count = await cds.transaction(this.req).run(
            UPDATE(ConfigDestinos).set(destino).where({ID: destino_ID})
        )

        if (count == 0)
            throw new Error(`Não foi possível modificar o destino ${destino_ID}.`)

        await this.info(`Destino ${destino_ID} modificado com sucesso.`)

    }

    async processLine({ line,
        isPrimeiraLinhaOrigem,
        isUltimaLinhaOrigem,
    }){

        if (isPrimeiraLinhaOrigem){
            this.origemAtual == null
            if (line.origem_ID)
                await this.modificarOrigem(line)
            if (this.origemAtual && this.origemAtual.ativa)
                await this.desativarOrigem({ ID: line.origem_ID })
        }

        if (line.destino_ID)
            await this.modificarDestino(line)
        
        if (isUltimaLinhaOrigem){
            if (line.ativa)
                await this.ativarOrigem({ ID: line.origem_ID })
        }
    }
    
}

class OperacaoImportacaoEliminar extends OperacaoImportacaoBase{

    origensLinhasIguais({ origem_ID: origem1_ID }, { origem_ID: origem2_ID }){
        return origem1_ID == origem2_ID
    }

    async eliminarOrigem({
        origem_ID,
    }){

        const { ConfigOrigens } = this.srv.entities

        const count = await cds.transaction(this.req).run(
            DELETE(ConfigOrigens).where({ID: origem_ID})
        )

        if (count == 0)
            throw Error(`Não foi possível eliminar a origem ${origem_ID}.`)

        await this.info(`Origem ${origem_ID} eliminado com sucesso.`)

    }

    async eliminarDestino({
        destino_ID,
    }){

        this.destinoRequestProcessor.requestHandler.setData({
            ID: destino_ID
        })
        await this.destinoRequestProcessor.beforeDelete(this.req)
        
        const { ConfigDestinos } = this.srv.entities

        const count = await cds.transaction(this.req).run(
            DELETE(ConfigDestinos).where({ID: destino_ID})
        )

        if (count == 0)
            throw Error(`Não foi possível eliminar o destino ${destino_ID}.`)

        await this.info(`Destino ${destino_ID} eliminado com sucesso.`)

    }

    async processLine({ line,
        isPrimeiraLinhaOrigem,
        isUltimaLinhaOrigem,
    }){

        if (isPrimeiraLinhaOrigem && line.origem_ID){
            await this.desativarOrigem({ ID: line.origem_ID })
        }

        if (line.destino_ID)
            await this.eliminarDestino(line)
        
        if (isUltimaLinhaOrigem){
            await this.eliminarOrigem(line)
        }
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

    async validarStatusImportacao(req){

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
            req.error(409, `A importação ${ID} não pode ser modificada já que atualmente esta com o status ${status_status}.`, 'status_status')
            return
        }

    }

    async beforeUpdateImportacoes(req){
        await this.validarStatusImportacao(req)
    }

    async beforeDeleteImportacoes(req){
        await this.validarStatusImportacao(req)
    }

    registerHandles(){

        const { Importacoes } = this.srv.entities
        
        this.srv.after('READ', Importacoes, this.afterReadImportacoes.bind(this))
        this.srv.before('UPDATE', Importacoes, this.beforeUpdateImportacoes.bind(this))
        this.srv.before('DELETE', Importacoes, this.beforeDeleteImportacoes.bind(this))
        this.srv.before('importar', Importacoes, this.beforeImportarImportacoesAction.bind(this))
        this.srv.on('importar', Importacoes, this.importarImportacoesAction.bind(this))

    }

}

module.exports = {
    ImportImplementation,
    OPERACAO_IMPORTACAO
}