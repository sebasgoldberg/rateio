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

}

module.exports = {
    TestUtils: TestUtils,
    constants: constants,
}