const cds = require('@sap/cds')

class TestUtils{

    constructor(){
        this.app = require('express')()
        this.request = require('supertest')(this.app)
    }

    async deployAndServe(){
        await cds.deploy(`${ this.getProjectPath() }/srv/service`).to('sqlite::memory:')
        await cds.serve('ConfigService').from(`${ this.getProjectPath() }/srv/service`).in(this.app)
    }

    getProjectPath(){
        return __dirname + '/..'
    }

}
module.exports = TestUtils