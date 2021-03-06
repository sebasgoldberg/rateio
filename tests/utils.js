const cds = require('@sap/cds')

const { registerImpForInternalModels } = require("../srv/imp")
const { EXPORT_HEADER } = require('../srv/export')

const constants = {
    GUID: "17b1febd-0d85-463c-b16d-ce72bbf3a09b",
    TIPO_OPERACAO_1: "credito",
    TIPO_OPERACAO_2: "debito",
    SEQUENCIA_1: 90,
    SEQUENCIA_2: 900,
    SEQUENCIA_3: 9000,
    COMPANY_CODE: "9000",
    CHART_OF_ACCOUNTS: "CH01",
    GL_ACCOUNT_1: "99999999",
    GL_ACCOUNT_2: "88888888",
    CONTROLLING_AREA: "AA90",
    COST_CENTER_1: "999888",
    COST_CENTER_2: "555444",
    /*
    PERIODO_1 -[------------]----------------------------
    PERIODO_2 ---[------]--------------------------------
    PERIODO_3 -------[---------------]-------------------
    PERIODO_4 ------------------------[---]--------------
    PERIODO_5 --------------------------[-]--------------
    PERIODO_6 ------------------------------[-----------]
    */
    PERIODO_1:{
        VALID_FROM: "2020-06-01T00:00:00Z",
        VALID_TO: "2020-06-30T00:00:00Z",
    },
    PERIODO_2:{
        VALID_FROM: "2020-06-05T00:00:00Z",
        VALID_TO: "2020-06-20T00:00:00Z",
    },
    PERIODO_3:{
        VALID_FROM: "2020-06-12T00:00:00Z",
        VALID_TO: "2020-07-20T00:00:00Z",
    },
    PERIODO_4:{
        VALID_FROM: "2020-07-20T00:00:01Z",
        VALID_TO: "2020-07-30T00:00:00Z",
    },
    PERIODO_5:{
        VALID_FROM: "2020-07-25T00:00:00Z",
        VALID_TO: "2020-07-30T00:00:00Z",
    },
    PERIODO_6:{
        VALID_FROM: "2020-08-01T00:00:00Z",
        VALID_TO: "2020-08-31T00:00:00Z",
    },
    INVALID:{
        CHART_OF_ACCOUNTS: "1234",
        GL_ACCOUNT: "45678910",
        CONTROLLING_AREA: "4567",
        COST_CENTER: "012345",
    },
    EXECUCAO: {
        DESCRICAO: "Test",
        PERIODO: 6,
        ANO: 2020,
        DATA_P123: "2020-06-15T00:00:00Z",
        DATA_P6: "2020-08-15T00:00:00Z",
    },
    ADMIN_USER: 'admin',
}

function registerImpForExternalModels(){

    const testData = [
        {
            entity: "A_CompanyCode",
            keyFields: ["CompanyCode"],
            instances: [
                {
                    "CompanyCode": constants.COMPANY_CODE,
                }
            ]
        },
        {
            entity: "A_GLAccountInChartOfAccounts",
            keyFields: ["ChartOfAccounts", "GLAccount"],
            instances: [
                {
                    "ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
                    "GLAccount": constants.GL_ACCOUNT_1,
                },
                {
                    "ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
                    "GLAccount": constants.GL_ACCOUNT_2,
                },
            ]
        },
        {
            entity: "A_CostCenterCompleto",
            keyFields: ["ControllingArea", "CostCenter", "ValidityEndDate"],
            instances: [
                {
                    "ControllingArea": constants.CONTROLLING_AREA,
                    "CostCenter": constants.COST_CENTER_1,
                    ValidityEndDate: constants.PERIODO_1.VALID_FROM
                },
                {
                    "ControllingArea": constants.CONTROLLING_AREA,
                    "CostCenter": constants.COST_CENTER_2,
                    ValidityEndDate: constants.PERIODO_1.VALID_FROM
                },
            ]
        }
    ]
    
    this.on('sync', async req => {

        await cds.transaction(req).run(
            testData    
                .reduce( (result, actual) => {

                    const entity = this.entities[actual.entity]

                    for (const instance of actual.instances){
                        result.push(
                            INSERT(instance).into(entity)
                        )
                    }

                    return result

                }, [])
        )
    
    })

}

class TestUtils{

    constructor(){
        this.app = require('express')()
        this.request = require('supertest')(this.app)
    }

    async deployAndServe(){
        // await cds.deploy(`${ this.getProjectPath() }/srv/external/API_JOURNALENTRYITEMBASIC_SRV`).to('sqlite::memory:', { mocked:true })
        await cds.deploy(`${ this.getProjectPath() }/srv/service`).to('sqlite::memory:')
        // await cds.serve('API_JOURNALENTRYITEMBASIC_SRV', { mocked:true }).in(this.app)
        this.srv = await cds.serve('ConfigService').from(`${ this.getProjectPath() }/srv/service`).in(this.app)
            .with( srv => {

                registerImpForInternalModels.bind(srv)();

                registerImpForExternalModels.bind(srv)();

            })
    }

    getProjectPath(){
        return __dirname + '/..'
    }

    createEtapaProcesso(data){
        return this.request
        .post('/config/EtapasProcesso')
        .auth(constants.ADMIN_USER, constants.ADMIN_USER)
        .send(data)
        .set('Accept', 'application/json')
        .expect('Content-Type', /^application\/json/)
    }

    criarImportacao({ descricao, operacao_operacao }){
        return this.request
            .post('/config/Importacoes')
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .send({ descricao, operacao_operacao })
            .set('Accept', 'application/json')
            .expect('Content-Type', /^application\/json/)
    }

    carregarCsvImportacao({ ID, csvContent }){

        const data =
            EXPORT_HEADER+
            csvContent.map( ({
                origem_ID,
                etapasProcesso_sequencia,
                empresa_CompanyCode,
                contaOrigem_ChartOfAccounts,
                contaOrigem_GLAccount,
                centroCustoOrigem_ControllingArea,
                centroCustoOrigem_CostCenter,
                validFrom,
                validTo,
                ativa,
                descricao,
                destino_ID,
                tipoOperacao_operacao,
                contaDestino_ChartOfAccounts,
                contaDestino_GLAccount,
                centroCustoDestino_ControllingArea,
                centroCustoDestino_CostCenter,
                atribuicao,
                porcentagemRateio,
            }) => `${ origem_ID };${ String(etapasProcesso_sequencia) };${ empresa_CompanyCode };${ contaOrigem_ChartOfAccounts };`+
                `${ contaOrigem_GLAccount };${ centroCustoOrigem_ControllingArea };${ centroCustoOrigem_CostCenter };${ validFrom };`+
                `${ validTo };${ ativa };${ descricao };${ destino_ID };${ tipoOperacao_operacao };${ contaDestino_ChartOfAccounts };`+
                `${ contaDestino_GLAccount };${ centroCustoDestino_ControllingArea };${ centroCustoDestino_CostCenter };`+
                `${ atribuicao };${ String(porcentagemRateio) }`
            ).join('\n')

        return this.request
            .put(`/config/Importacoes(${ID})/csv`)
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .send(data)
            .set('Content-Type', 'text/csv')
    }

    importar({ ID }){
        return this.request
            .post(`/config/Importacoes(${ID})/ConfigService.importar`)
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
            .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
    }

    sync(){
        return this.request
            .post('/config/sync')
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
            .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
    }

    async createTestData(){

        this.createdData = {
        }

        const configOrigemData = {
            "etapasProcesso_sequencia": constants.SEQUENCIA_1,
            "empresa_CompanyCode": constants.COMPANY_CODE,
            "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
            "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
            "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
            "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
            "validFrom": constants.PERIODO_6.VALID_FROM,
            "validTo": constants.PERIODO_6.VALID_TO,
          }
      
        await Promise.all([
            this.createEtapaProcesso({
                sequencia: constants.SEQUENCIA_1,
            }).expect(201),
            this.createEtapaProcesso({
                sequencia: constants.SEQUENCIA_2,
            }).expect(201),
            this.createEtapaProcesso({
                sequencia: constants.SEQUENCIA_3,
            }).expect(201),
            this.sync().expect(204)
        ])

        const results = await Promise.all([
            this.request
                .post('/config/ConfigOrigens')
                .auth(constants.ADMIN_USER, constants.ADMIN_USER)
                .send(configOrigemData)
                .set('Accept', 'application/json')
                .expect('Content-Type', /^application\/json/)
                .expect(201),
        ])

        this.createdData.configOrigem = {
            ...configOrigemData,
            ...{ ID: JSON.parse(results[0].text).ID }
        } 

    }

    buildConfigOrigensUrlKey(data){
        return `centroCustoOrigem_ControllingArea='${data.centroCustoOrigem_ControllingArea}',`+
            `centroCustoOrigem_CostCenter='${data.centroCustoOrigem_CostCenter}',`+
            `validFrom=${data.validFrom},`+
            `etapasProcesso_sequencia=${data.etapasProcesso_sequencia},`+
            `empresa_CompanyCode='${data.empresa_CompanyCode}',`+
            `contaOrigem_ChartOfAccounts='${data.contaOrigem_ChartOfAccounts}',`+
            `contaOrigem_GLAccount='${data.contaOrigem_GLAccount}'`
    }

    buildConfigDestinosUrlKey(createResponse){
        return JSON.parse(createResponse.text).ID
    }

    createOrigem(data){

        const origem = {
            ...{
                "etapasProcesso_sequencia": constants.SEQUENCIA_1,
                "empresa_CompanyCode": constants.COMPANY_CODE,
                "contaOrigem_ChartOfAccounts": constants.CHART_OF_ACCOUNTS,
                "contaOrigem_GLAccount": constants.GL_ACCOUNT_1,
                "centroCustoOrigem_ControllingArea": constants.CONTROLLING_AREA,
                "centroCustoOrigem_CostCenter": constants.COST_CENTER_1,
                "validFrom": constants.PERIODO_6.VALID_FROM,
                "validTo": constants.PERIODO_6.VALID_TO,
            },
            ...data
        }

        return this.request
            .post('/config/ConfigOrigens')
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .send(origem)
            .set('Accept', 'application/json')
            .expect('Content-Type', /^application\/json/)
    }

    createDestino(destino){
        const data = {
            ...{
                origem_ID: this.createdData.configOrigem.ID,
                tipoOperacao_operacao: constants.TIPO_OPERACAO_1,
                contaDestino_ChartOfAccounts: constants.CHART_OF_ACCOUNTS,
                contaDestino_GLAccount: constants.GL_ACCOUNT_1,
                centroCustoDestino_ControllingArea: constants.CONTROLLING_AREA,
                centroCustoDestino_CostCenter: constants.COST_CENTER_1,
                atribuicao: "1",
                porcentagemRateio: "40",
            },
            ...destino
        }
      
        return this.request
            .post('/config/ConfigDestinos')
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .send(data)
            .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
            .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
            .expect('Content-Type', /^application\/json/)
      
    }

    activateOrigem(ID){
        return this.request
            .post(`/config/ConfigOrigens(${ID})/ConfigService.ativar`)
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
            .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
    }

    createExecucao(execucao){

        const data = {
            ...{
                descricao: constants.EXECUCAO.DESCRICAO,
                periodo: constants.EXECUCAO.PERIODO,
                ano: constants.EXECUCAO.ANO,
                dataConfiguracoes: constants.EXECUCAO.DATA_P6,
            },
            ...execucao
        }
      
        return this.request
            .post('/config/Execucoes')
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .send(data)
            .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
            .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
            .expect('Content-Type', /^application\/json/)

    }

    cancelarDocumento(documento){
        const { CompanyCode, AccountingDocument, FiscalYear } = documento
        const key = `CompanyCode='${CompanyCode}',AccountingDocument='${AccountingDocument}',FiscalYear=${FiscalYear}`
        return this.request
            .post(`/config/Documentos(${key})/ConfigService.cancelar`)
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
            .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
    }

    executarExecucao(ID){
        return this.request
            .post(`/config/Execucoes(${ID})/ConfigService.executar`)
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
            .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
    }

    getExecucao(ID){
        return this.request
            .get(`/config/Execucoes(${ID})`)
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .expect('Content-Type', /^application\/json/)
    }

    getLogsItemExecucao(execucao_ID, configuracaoOrigem_ID){
        const key = `execucao_ID=${execucao_ID},configuracaoOrigem_ID=${configuracaoOrigem_ID}`
        return this.request
            .get(`/config/ItensExecucoes(${key})/logs`)
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .expect('Content-Type', /^application\/json/)
    }

    getLogsItensExecucao(ID){
        return this.request
            //.get(`/config/ItensExecucoesLogs?$filter=item_execucao_ID eq ${ID}`)
            .get(`/config/Execucoes(${ID})/logsItens`)
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .expect('Content-Type', /^application\/json/)
    }

    getLogsExecucao(ID){
        return this.request
            .get(`/config/Execucoes(${ID})/logs`)
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .expect('Content-Type', /^application\/json/)
    }

    getItensExecucao(ID){
        return this.request
            .get(`/config/Execucoes(${ID})/itensExecucoes`)
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .expect('Content-Type', /^application\/json/)
    }

    modificarExecucao(ID, data){
        return this.request
            .patch(`/config/Execucoes(${ID})`)
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .send(data)
            .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
            .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
    }

    eliminarExecucao(ID){
        return this.request
            .delete(`/config/Execucoes(${ID})`)
            .auth(constants.ADMIN_USER, constants.ADMIN_USER)
            .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
            .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
    }

}

module.exports = {
    TestUtils: TestUtils,
    constants: constants,
}