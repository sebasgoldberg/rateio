const cds = require('@sap/cds')

const { registerImpForInternalModels } = require("../srv/imp")

function registerImpForExternalModels(){

    this.on('READ','A_CompanyCode', req => {
        const instances = [
            {
                "CompanyCode": '9000',
            }
        ]
        const result = req.data.CompanyCode ? 
            instances.filter( o => req.data.CompanyCode == o.CompanyCode ) :
            instances
        req.reply(result)
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
                    sequencia: 90,
                })
                .set('Accept', 'application/json')
                .expect('Content-Type', /^application\/json/)
                .expect(201),
        ])
    }

}
module.exports = TestUtils