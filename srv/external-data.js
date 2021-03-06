const { RequestHandler } = require("./request-handler");

class ExternalData{

    constructor(srv, requestHandler=new RequestHandler()){
        this.srv = srv;
        this.requestHandler = requestHandler
    }

    async validateEmpresa(req, CompanyCode, target='empresa_CompanyCode'){
        const { A_CompanyCode } = this.srv.entities
        const result = await cds.transaction(req).run(
            SELECT.one.from(A_CompanyCode).where({CompanyCode: CompanyCode})
        )
        if (!result)
            this.requestHandler.error(req, 409, `A empresa ${CompanyCode} não existe`, target)
    }

    async validateConta(req, ChartOfAccounts, GLAccount, targets=['contaOrigem_ChartOfAccounts', 'contaOrigem_GLAccount']){
        const { A_GLAccountInChartOfAccounts } = this.srv.entities
        const result = await cds.transaction(req).run(
            SELECT.one.from(A_GLAccountInChartOfAccounts).where({
                ChartOfAccounts: ChartOfAccounts,
                GLAccount: GLAccount,
            })
        )
        if (!result)
            targets.forEach( target =>
                this.requestHandler.error(req, 409, `A conta ${ChartOfAccounts}/${GLAccount} não existe`, target)
            )
    }

    async validateCentro(req, ControllingArea, CostCenter, targets=['centroCustoOrigem_ControllingArea', 'centroCustoOrigem_CostCenter']){
        const { A_CostCenter } = this.srv.entities
        const result = await cds.transaction(req).run(
            SELECT.one.from(A_CostCenter).where({
                ControllingArea: ControllingArea,
                CostCenter: CostCenter,
            })
        )
        if (!result)
            targets.forEach( target =>
                this.requestHandler.error(req, 409, `O centro ${ControllingArea}/${CostCenter} não existe`, target)
            )
    }

}

module.exports = ExternalData