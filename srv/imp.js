const cds = require('@sap/cds')

function ODataV2toODataV4DateTime(value){
    const groups = value.match(/\/Date\((?<arg>.*)\+.*\)\//).groups
    if (!groups)
        return value
    return new Date(Number(groups.arg))
        .toISOString()
}

function ODataV2toODataV4Date(value){
    const groups = value.match(/\/Date\((?<arg>.*)\)\//).groups
    if (!groups)
        return value
    return new Date(Number(groups.arg))
        .toISOString()
        .slice(0,10)
}

const { ConfigOrigensImplementation } = require("./")
const { ConfigDestinosImplementation } = require("./")
const { ExecucoesImplementation } = require("./")
const { DocumentosImplementation } = require('./documento-imp')
const { ExportImplementation } = require('./export')
const { ImportImplementation } = require('./import')

function ODataV2toODataV4(instance){
    const dateAttributes = ['ValidityEndDate', 'ValidityStartDate', 'CostCenterCreationDate', 'CreationDate']
    const dateTimeAttributes = ['LastChangeDateTime']

    // Conversão de datas de OData 2.0 para 4.0
    dateAttributes.forEach( attribute => {
        if (instance[attribute]) 
            instance[attribute] = ODataV2toODataV4Date(instance[attribute])
    })
    dateTimeAttributes.forEach( attribute => {
        if (instance[attribute]) 
            instance[attribute] = ODataV2toODataV4DateTime(instance[attribute])
    })

    return instance
}

async function sync(req){

    const journalEntryItemBasicSrv = await cds.connect.to('API_JOURNALENTRYITEMBASIC_SRV')

    const { 
        A_CompanyCode: extA_CompanyCode,
        A_GLAccountInChartOfAccounts: extA_GLAccountInChartOfAccounts,
        A_CostCenter: extA_CostCenter
    } = journalEntryItemBasicSrv.entities

    const { 
        A_CompanyCode,
        A_GLAccountInChartOfAccounts,
        A_CostCenterCompleto
    } = this.entities;


    const syncServices = [
        {
            src: extA_CompanyCode,
            dst: A_CompanyCode
        },
        {
            src: extA_GLAccountInChartOfAccounts,
            dst: A_GLAccountInChartOfAccounts
        },
        {
            src: extA_CostCenter,
            dst: A_CostCenterCompleto
        }
    ]

    await Promise.all(syncServices.map( async ({ src, dst }) => {

        const entities = (await
            journalEntryItemBasicSrv.tx(req).run(
                journalEntryItemBasicSrv.read(src).limit(999999)
            )).map(ODataV2toODataV4)

        try {
            await cds.transaction(req).run(
                entities.map( entity => INSERT(entity).into(dst) )
            )                
        } catch (error) {
            
        }

    }))

}

class ImplementationRegistration{

    async registerImpForInternalModels(){

        const configOrigensImp = new ConfigOrigensImplementation(this)
        configOrigensImp.registerHandles()

        const configDestinosImp = new ConfigDestinosImplementation(this)
        configDestinosImp.registerHandles()

        const execucoesImp = new ExecucoesImplementation(this)
        execucoesImp.registerHandles()

        const documentosImp = new DocumentosImplementation(this)
        documentosImp.registerHandles()

        const exportImp = new ExportImplementation(this)
        exportImp.registerHandles()

        const importImp = new ImportImplementation(this)
        importImp.registerHandles()

    }

    async registerImpForExternalModels(){

        this.on('sync', sync.bind(this))

        // this.on('UPDATE', 'Importacoes', async req => {

        //     const { Readable, PassThrough } = require('stream')
            
        //     const stream = new PassThrough()
        //     const chunks = []
        //     stream.on('data', chunk => {
        //       chunks.push(chunk)
        //     })
        //     stream.on('end', () => {
        //       const content = Buffer.concat(chunks).toString('utf-8')
        //       console.log(content);
        //     })
        //     req.data.csv.pipe(stream)
        // })
    
    }

}

module.exports = new ImplementationRegistration