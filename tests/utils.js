const cds = require('@sap/cds')

const { registerImpForInternalModels } = require("../srv/imp")

const constants = {
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
    PERIODO_1 -[------------]--------------
    PERIODO_2 ---[------]------------------
    PERIODO_3 -------[---------------]-----
    PERIODO_4 ------------------------[---]
    PERIODO_5 --------------------------[-]
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
        return Promise.all([
            this.request
                .post('/config/EtapasProcesso')
                .send({
                    sequencia: constants.SEQUENCIA_1,
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /^application\/json/)
                .expect(201),
        ])
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

}

module.exports = {
    TestUtils: TestUtils,
    constants: constants,
}