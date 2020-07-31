const cds = require('@sap/cds')
const { Readable } = require("stream")
const { STATUS_EXECUCAO } = require('./constants')
const parse = require('csv-parse')

const OPERACAO_IMPORTACAO = {
    CRIAR: 'criar',
    MODIFICAR: 'modificar',
    ELIMINAR: 'eliminar',
}

class OperacaoImportacaoBase{

    constructor(req, importacao){
        this.req = req
        this.importacao = importacao
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

            req.error(409, `Erro ao tentar interpretar o conteudo do arquivo da importação ${ID}: ${String(error)}`)
            return

        }

        for (let i=0; i < lines.length; i++){
            const line = lines[i]
            await this._processLine(line)
        }

    }

    async _processLine(line){
        await this.processLine(line)
    }

    async processLine(line){
        console.log(line)
    }
    
}

class OperacaoImportacaoCriar extends OperacaoImportacaoBase{

    async processLine(line){
        super.processLine(line)
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
            return new OperacaoImportacaoCriar(req, importacao)
        else if (operacao_operacao == OPERACAO_IMPORTACAO.MODIFICAR)
            return new OperacaoImportacaoModificar(req, importacao)
        else if (operacao_operacao == OPERACAO_IMPORTACAO.ELIMINAR)
            return new OperacaoImportacaoEliminar(req, importacao)

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

module.exports = ImportImplementation