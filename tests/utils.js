const cds = require('@sap/cds')

const { registerImpForInternalModels } = require("../srv/imp")

const constants = {
    GUID: "17b1febd-0d85-463c-b16d-ce72bbf3a09b",
    TIPO_OPERACAO_1: "credito",
    TIPO_OPERACAO_2: "debito",
    SEQUENCIA_1: 90,
    SEQUENCIA_2: 900,
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
        PERIODO: "006",
        ANO: "2020",
        DATA_P123: "2020-06-15T00:00:00Z",
        DATA_P6: "2020-08-15T00:00:00Z",
    }
}

function registerImpForExternalModels(){

    [
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
            entity: "A_CostCenter",
            keyFields: ["ControllingArea", "CostCenter"],
            instances: [
                {
                    "ControllingArea": constants.CONTROLLING_AREA,
                    "CostCenter": constants.COST_CENTER_1,
                },
                {
                    "ControllingArea": constants.CONTROLLING_AREA,
                    "CostCenter": constants.COST_CENTER_2,
                },
            ]
        }
    ].forEach( o => {

        this.on('READ',o.entity, req => {
            let keysDefinedInReq = o.keyFields.filter( k => k in req.data)
            const result = keysDefinedInReq.length > 0 ? 
                o.instances.filter( instance => {
                    for (let keyDefinedInReq of keysDefinedInReq){
                        if (req.data[keyDefinedInReq] !== instance[keyDefinedInReq])
                            return false
                    }
                    return true
                }) :
                o.instances
            req.reply(result)
        })
    
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
        await cds.serve('ConfigService').from(`${ this.getProjectPath() }/srv/service`).in(this.app)
            .with( srv => {

                registerImpForInternalModels.bind(srv)();

                registerImpForExternalModels.bind(srv)();

            })
    }

    getProjectPath(){
        return __dirname + '/..'
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
            this.request
                .post('/config/EtapasProcesso')
                .send({
                    sequencia: constants.SEQUENCIA_1,
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /^application\/json/)
                .expect(201),
        ])

        const results = await Promise.all([
            this.request
                .post('/config/ConfigOrigens')
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

    buildConfigDestinosUrlKey(data){
        return `origem_ID=${data.origem_ID},`+
            `centroCustoDestino_ControllingArea='${data.centroCustoDestino_ControllingArea}',`+
            `tipoOperacao_operacao='${data.tipoOperacao_operacao}',`+
            `centroCustoDestino_CostCenter='${data.centroCustoDestino_CostCenter}',`+
            `contaDestino_ChartOfAccounts='${data.contaDestino_ChartOfAccounts}',`+
            `contaDestino_GLAccount='${data.contaDestino_GLAccount}',`+
            `atribuicao='${data.atribuicao}'`
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
            .send(data)
            .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
            .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
            .expect('Content-Type', /^application\/json/)
      
    }

    activateOrigem(ID){
        return this.request
            .post(`/config/ConfigOrigens(${ID})/ConfigService.ativar`) 
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
            .send(data)
            .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
            .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
            .expect('Content-Type', /^application\/json/)

    }

    executarExecucao(ID){
        return this.request
            .post(`/config/Execucoes(${ID})/ConfigService.executar`) 
            .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
            .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
    }

    getItensExecucao(ID){
        return this.request
            .get(`/config/Execucoes(${ID})/itensExecucoes`)
            .expect('Content-Type', /^application\/json/)
    }

    modificarExecucao(ID, data){
        return this.request
            .patch(`/config/Execucoes(${ID})`) 
            .send(data)
            .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
            .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
    }

    eliminarExecucao(ID){
        return this.request
            .delete(`/config/Execucoes(${ID})`) 
            .set("Content-Type", "application/json;charset=UTF-8;IEEE754Compatible=true")
            .set("Accept", "application/json;odata.metadata=minimal;IEEE754Compatible=true")
    }

}

module.exports = {
    TestUtils: TestUtils,
    constants: constants,
}