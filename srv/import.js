const cds = require('@sap/cds')
const { Readable } = require("stream")
const { STATUS_EXECUCAO } = require('./constants')

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

    async importarImportacoesAction(req){

        const ID = req.params[0]

        const { Importacoes } = this.srv.entities

        const importacao = await cds.transaction(req).run(
            SELECT.one
                .from(Importacoes)
                .where('ID = ', ID)
        )

        let lines;

        try {

            const fileContent = new TextDecoder("utf-8").decode(importacao.csv)

            lines = fileContent.split('\n')
            
            // Eliminamos as duas primeiras linhas.
            lines.shift()
            lines.shift()

        } catch (error) {
            req.error(409, `Erro ao tentar interpretar o conteudo do arquivo da importação ${ID}: ${String(error)}`)
            return
        }

    }

    registerHandles(){

        const { Importacoes } = this.srv.entities
        
        this.srv.after('READ', Importacoes, this.afterReadImportacoes.bind(this))
        this.srv.before('importar', Importacoes, this.beforeImportarImportacoesAction.bind(this))
        this.srv.on('importar', Importacoes, this.importarImportacoesAction.bind(this))

    }

}

module.exports = ImportImplementation