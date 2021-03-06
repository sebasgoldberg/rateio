using { cuid, temporal, managed, sap, User } from '@sap/cds/common';
using { API_JOURNALENTRYITEMBASIC_SRV as ext  } from '../srv/external/API_JOURNALENTRYITEMBASIC_SRV';
namespace qintess.rateio;

/**************************************************/
// Definições Basicas
/**************************************************/

entity EtapasProcesso: managed, sap.common.CodeList{
    key sequencia: Integer;
}

type TipoOperacao: String enum { credito; debito }

entity TiposOperacoes: sap.common.CodeList{
    key operacao: TipoOperacao @assert.range: TipoOperacao;
}

type CompanyCode : String(4);

type ChartOfAccounts : String(4);
type GLAccount : String(10);

type ControllingArea : String(4);
type CostCenter : String(10);

/**************************************************/
// Externo Sincronizado
/**************************************************/

@cds.persistence.skip: false
entity A_CompanyCode: ext.A_CompanyCode {
}

@cds.persistence.skip: false
entity A_GLAccountInChartOfAccounts: ext.A_GLAccountInChartOfAccounts {
}

// TODO Verificar tema de zeros na frente: Teoricamente tem que tirar.
@cds.persistence.skip: false
entity A_CostCenterCompleto: ext.A_CostCenter {
}

entity A_CostCenter as 
    select 
        key ControllingArea,
        key CostCenter
    from A_CostCenterCompleto;


/**************************************************/
// Configuração
/**************************************************/

// Chave: (etapasProcesso, empresa, contaOrigem, centroCustoOrigem)+periodo
entity ConfigOrigens: cuid, managed{

    etapasProcesso_sequencia: Integer not null;
    etapasProcesso: Association to one EtapasProcesso on 
        etapasProcesso.sequencia = $self.etapasProcesso_sequencia;

    empresa_CompanyCode: CompanyCode not null;
    empresa: Association to one A_CompanyCode on
        empresa.CompanyCode = $self.empresa.CompanyCode;

    contaOrigem_ChartOfAccounts: ChartOfAccounts not null;
    contaOrigem_GLAccount: GLAccount not null;
    contaOrigem: Association to one A_GLAccountInChartOfAccounts on
        contaOrigem.ChartOfAccounts = $self.contaOrigem.ChartOfAccounts and
        contaOrigem.GLAccount = $self.contaOrigem.GLAccount;

    centroCustoOrigem_ControllingArea: ControllingArea not null;
    centroCustoOrigem_CostCenter: CostCenter not null;
    centroCustoOrigem: Association to one A_CostCenter on
        centroCustoOrigem.ControllingArea = $self.centroCustoOrigem.ControllingArea and
        centroCustoOrigem.CostCenter = $self.centroCustoOrigem.CostCenter;

    validFrom : DateTime not null;
    validTo   : DateTime not null;

    descricao: String(100);

    destinos: Association to many ConfigDestinos on destinos.origem = $self;

    ativa: Boolean not null default false @readonly;
    virtual ativaCriticality: Integer;

    itensExecucoes: Association to many ItensExecucoes on itensExecucoes.configuracaoOrigem = $self;

}

type UUIDType: String(36);

entity ConfigDestinos: cuid, managed{
    
    origem: Association to one ConfigOrigens;

    tipoOperacao_operacao: TipoOperacao not null;
    tipoOperacao: Association to one TiposOperacoes on
        tipoOperacao.operacao = $self.tipoOperacao_operacao;

    contaDestino_ChartOfAccounts: ChartOfAccounts not null;
    contaDestino_GLAccount: GLAccount not null;
    contaDestino: Association to one A_GLAccountInChartOfAccounts on
        contaDestino.ChartOfAccounts = $self.contaDestino.ChartOfAccounts and
        contaDestino.GLAccount = $self.contaDestino.GLAccount;

    centroCustoDestino_ControllingArea: ControllingArea not null;
    centroCustoDestino_CostCenter: CostCenter not null;
    centroCustoDestino: Association to one A_CostCenter on
        centroCustoDestino.ControllingArea = $self.centroCustoDestino.ControllingArea and
        centroCustoDestino.CostCenter = $self.centroCustoDestino.CostCenter;

    // TODO A atribução não deve ser obrigatoria
    atribuicao: String(18);

    porcentagemRateio: Decimal(5,2) not null @assert.range: [ 0, 100 ];

}

/**************************************************/
// Execução
/**************************************************/

type FiscalYear: Integer;
type FiscalPeriod: Integer;

type StatusExecucao: String enum { nao_executado; em_execucao; finalizado; cancelado; }

entity StatusExecucoes: sap.common.CodeList{
    key status: StatusExecucao @assert.range: StatusExecucao;
}

entity Execucoes: cuid, managed{

    descricao: String(100) not null;

    etapasProcesso_sequencia: Integer null;
    etapasProcesso: Association to one EtapasProcesso on 
        etapasProcesso.sequencia = $self.etapasProcesso_sequencia;

    periodo: FiscalPeriod not null @assert.range: [ 0, 12 ];
    ano: FiscalYear not null @assert.range: [ 1900, 9999 ];

    dataConfiguracoes: DateTime not null default $now;

    @readonly
    status_status: StatusExecucao not null default 'nao_executado';
    status: Association to one StatusExecucoes on status.status = $self.status_status;
    virtual statusCriticality: Integer;

    itensExecucoes: Association to many ItensExecucoes on itensExecucoes.execucao = $self;

    logs: Association to many ExecucoesLogs on logs.execucao = $self;

    logsItens: Association to many LogsItensExecucao on logsItens.execucao_ID = $self.ID;

}

@autoexpose
@readonly
entity ItensExecucoes: managed {
    key execucao: Association to one Execucoes not null;
    key configuracaoOrigem: Association to one ConfigOrigens;

    @readonly
    status_status: StatusExecucao not null default 'nao_executado';
    status: Association to one StatusExecucoes on status.status = $self.status_status;
    virtual statusCriticality: Integer;

    documentosGerados: Association to many Documentos on
        documentosGerados.itemExecutado = $self; // Um por configuracaoOrigem/moeda
    logs: Association to many ItensExecucoesLogs on logs.item = $self;
}

type Moeda: String(3);
type AccountingDocument: String(10);

@autoexpose
entity Documentos: managed {
    key CompanyCode: CompanyCode not null;
    key AccountingDocument: AccountingDocument not null;
    key FiscalYear: FiscalYear not null;
    moeda: Moeda;
    itemExecutado: Association to one ItensExecucoes not null;
    cancelado: Boolean not null default false;
    virtual canceladoCriticality: Integer;
    EstornadoCom: AccountingDocument null;
    PostingDate: Date null;
};

type DocumentItemNumber: String(6);

@readonly
@autoexpose
aspect log: cuid{
    messageType: Integer;
    messageCode: String(10);
    message: String(512) not null;
    timestamp: Timestamp; // Necessario para estabelecer ordem a nivel de aplicação.
    createdBy: User @cds.on.insert: $user;
}

entity ExecucoesLogs: log{
    execucao: Association to Execucoes;
}

entity ItensExecucoesLogs: log{
    item: Association to ItensExecucoes;
}

@readonly
entity ConfigOrigensExecucoes
    as 
    SELECT 
        key execucao.ID as execucao_ID,
        key configuracaoOrigem.ID as configuracaoOrigem_ID,
        configuracaoOrigem.etapasProcesso_sequencia as sequencia,
        configuracaoOrigem.empresa_CompanyCode as CompanyCode,
        configuracaoOrigem.contaOrigem_ChartOfAccounts as ChartOfAccounts,
        configuracaoOrigem.contaOrigem_GLAccount as GLAccount,
        configuracaoOrigem.centroCustoOrigem_ControllingArea as ControllingArea,
        configuracaoOrigem.centroCustoOrigem_CostCenter as CostCenter
        // documentosGerados: redirected to Documentos
    from rateio.ItensExecucoes
    order by configuracaoOrigem.etapasProcesso_sequencia;

@readonly
entity ConfigOrigensDocumentos as projection on rateio.Documentos{
        key CompanyCode,
        key AccountingDocument,
        key FiscalYear,
        moeda,
        cancelado,
        canceladoCriticality,
        EstornadoCom,
        PostingDate,
        createdAt,
        createdBy,
        modifiedAt,
        modifiedBy,
        itemExecutado.configuracaoOrigem.etapasProcesso_sequencia as sequencia,
        itemExecutado.configuracaoOrigem.contaOrigem_ChartOfAccounts as ChartOfAccounts,
        itemExecutado.configuracaoOrigem.contaOrigem_GLAccount as GLAccount,
        itemExecutado.configuracaoOrigem.centroCustoOrigem_ControllingArea as ControllingArea,
        itemExecutado.configuracaoOrigem.centroCustoOrigem_CostCenter as CostCenter,
        itemExecutado.configuracaoOrigem.validFrom,
        itemExecutado.configuracaoOrigem.validTo,
        itemExecutado.execucao.ano,
        itemExecutado.execucao.periodo,
        itemExecutado.execucao.ID as execucao_ID,
        itemExecutado.configuracaoOrigem.ID as configuracaoOrigem_ID,
        itemExecutado: redirected to ItensExecucoes,
        };


@readonly
@autoexpose
entity LogsItensExecucao as
    select
        key ID,
        item.execucao.ID as execucao_ID,
        item.configuracaoOrigem.ID as configuracao_ID,
        messageType,
        message,
        timestamp,
        createdBy
    from ItensExecucoesLogs;

@readonly
// TODO Ver de mudar para obter origens sem destino (o branch fix-left-join já tem a mudança, porem ao fazer o deploy o HANA fica sem memoria).
entity ConfigOrigensDestinos as projection on rateio.ConfigDestinos{
    // Dados do origem
    origem.ID as origem_ID,
    origem.etapasProcesso_sequencia as etapa,
    origem.empresa_CompanyCode as empresa,
    origem.contaOrigem_ChartOfAccounts,
    origem.contaOrigem_GLAccount,
    origem.centroCustoOrigem_ControllingArea,
    origem.centroCustoOrigem_CostCenter,
    origem.validFrom,
    origem.validTo,
    origem.ativa,
    origem.descricao,

    // Dados do destino
    key ID as destino_ID,
    tipoOperacao_operacao as operacao,
    contaDestino_ChartOfAccounts,
    contaDestino_GLAccount,
    centroCustoDestino_ControllingArea,
    centroCustoDestino_CostCenter,
    atribuicao,
    porcentagemRateio,
}
 

@readonly
entity Exportacao{
    key dummy: Integer;
    virtual csv: LargeBinary @Core.MediaType: 'text/csv';
}

type OperacaoImportacao: String enum { criar; modificar; eliminar }

entity OperacoesImportacoes: sap.common.CodeList{
    key operacao: OperacaoImportacao @assert.range: OperacaoImportacao;
}

entity Importacoes: cuid, managed{

    descricao: String(100) not null;
    operacao: Association to one OperacoesImportacoes;

    @readonly
    status_status: StatusExecucao not null default 'nao_executado';
    status: Association to one StatusExecucoes on status.status = $self.status_status;
    virtual statusCriticality: Integer;

    csv: LargeBinary @Core.MediaType: 'text/csv';

    logs: Association to many ImportacoesLogs on logs.importacao = $self;

}

@readonly
entity ImportacoesLogs: log{
    importacao: Association to Importacoes;
}
