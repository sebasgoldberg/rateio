const rp = require('request-promise')

async function request(options){
    const _options = {
        ...options,
        ...{ uri: `http://localhost:4004${options.uri}` },
    }
    
    const result = await rp(_options)
    console.log(result);
    return result
}

async function full(){

    const now = (new Date()).toISOString()

    // Verificamos el servidor esté funcionando.
    let response = await request({
        uri: '/config/$metadata' 
    })
    
    // Criamos a etapa.
    response = await request({
        method: 'POST',
        uri: '/config/EtapasProcesso',
        headers:{
            'Content-Type': 'application/json'
        },
        body: {
                "sequencia": 90
            },
        json: true,
    })

    // Criamos a origem.
    response = await request({
        method: 'POST',
        uri: '/config/ConfigOrigens',
        headers:{
            'Content-Type': 'application/json'
        },
        body: {
            "etapasProcesso_sequencia": 90,
            "validFrom": now,
            "validTo": now,
            "empresa_CompanyCode": "1410",
            "contaOrigem_ChartOfAccounts": "YCOA",
            "contaOrigem_GLAccount": "2129010503",
            "centroCustoOrigem_ControllingArea": "A000",
            "centroCustoOrigem_CostCenter": "300203"
        },
        json: true,
    })

    const origemID = response.ID

    // Criamos os destinos.
    response = await request({
        method: 'POST',
        uri: '/config/ConfigDestinos',
        headers:{
            'Content-Type': 'application/json;charset=UTF-8;IEEE754Compatible=true'
        },
        body: {
            origem_ID: origemID,
            tipoOperacao_operacao: 'credito',
            contaDestino_ChartOfAccounts: 'YCOA',
            contaDestino_GLAccount: '4291010301',
            centroCustoDestino_ControllingArea: 'A000',
            centroCustoDestino_CostCenter: '0000300101',
            atribuicao: "destino 1",
            porcentagemRateio: "1",
        },
        json: true,
    })

    // Criamos os destinos.
    response = await request({
        method: 'POST',
        uri: '/config/ConfigDestinos',
        headers:{
            'Content-Type': 'application/json;charset=UTF-8;IEEE754Compatible=true'
        },
        body: {
            origem_ID: origemID,
            tipoOperacao_operacao: 'debito',
            contaDestino_ChartOfAccounts: 'YCOA',
            contaDestino_GLAccount: '4211010300',
            centroCustoDestino_ControllingArea: 'A000',
            centroCustoDestino_CostCenter: '0000300101',
            atribuicao: "destino 2",
            porcentagemRateio: "0.99",
        },
        json: true,
    })

    // Criamos os destinos.
    response = await request({
        method: 'POST',
        uri: '/config/ConfigDestinos',
        headers:{
            'Content-Type': 'application/json;charset=UTF-8;IEEE754Compatible=true'
        },
        body: {
            origem_ID: origemID,
            tipoOperacao_operacao: 'debito',
            contaDestino_ChartOfAccounts: 'YCOA',
            contaDestino_GLAccount: '4211010300',
            centroCustoDestino_ControllingArea: 'A000',
            centroCustoDestino_CostCenter: '0000300101',
            atribuicao: "destino 3",
            porcentagemRateio: "0.01",
        },
        json: true,
    })

    // Ativamos a origem
    response = await request({
        method: 'POST',
        uri: `/config/ConfigOrigens(${origemID})/ConfigService.ativar`,
        headers:{
            'Content-Type': 'application/json;charset=UTF-8;IEEE754Compatible=true'
        },
        json: true,
    })

    // Criamos a ejecución
    response = await request({
        method: 'POST',
        uri: '/config/Execucoes',
        headers:{
            'Content-Type': 'application/json;charset=UTF-8;IEEE754Compatible=true'
        },
        body: {
            descricao: 'Full test',
            periodo: 6,
            ano: 2020,
            dataConfiguracoes: now,
        },
        json: true,
    })

    const execucaoID = response.ID

    // Executamos.
    response = await request({
        method: 'POST',
        uri: `/config/Execucoes(${execucaoID})/ConfigService.executar`,
        headers:{
            'Content-Type': 'application/json;charset=UTF-8;IEEE754Compatible=true'
        },
        json: true,
    })


}

full()