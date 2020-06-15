const cds = require('@sap/cds')
const ExternalData = require("./external-data")

class ConfigDestinosImplementation{

    constructor(srv){
        this.srv = srv
        this.externalData = new ExternalData(srv)
    }

    async validateDadosExternos(req){

        const { 
            contaDestino_ChartOfAccounts,
            contaDestino_GLAccount,
            centroCustoDestino_ControllingArea,
            centroCustoDestino_CostCenter,
        } = req.data

        await Promise.all([
            this.externalData.validateConta(req, contaDestino_ChartOfAccounts, contaDestino_GLAccount),
            this.externalData.validateCentro(req, centroCustoDestino_ControllingArea, centroCustoDestino_CostCenter),
        ])

    }

    async beforeCreate(req){

        await Promise.all([
            this.validateDadosExternos(req)
        ]);

    }

    registerHandles(){
        
        const { ConfigDestinos } = this.srv.entities

        this.srv.before('CREATE', ConfigDestinos, this.beforeCreate.bind(this))
    }

}

module.exports = ConfigDestinosImplementation