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

    // TODO Descomentar e corrigir teste unitario.
    // etapasProcesso_sequencia: Integer not null;
    // etapasProcesso: Association to one EtapasProcesso on 
    //     etapasProcesso.sequencia = $self.etapasProcesso_sequencia;
    etapasProcesso: Association to one EtapasProcesso not null;

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

    itensExecucoes: Association to many ItensExecucoes on itensExecucoes.configuracaoOrigem = $self;

}

type UUIDType: String(36);

entity ConfigDestinos: managed{
    
    key origem: Association to one ConfigOrigens;

    // TODO Descomentar e corrigir teste unitario.
    // key tipoOperacao_operacao: TipoOperacao not null;
    // tipoOperacao: Association to one TiposOperacoes on
    //     tipoOperacao.operacao = $self.tipoOperacao_operacao;
    key tipoOperacao: Association to one TiposOperacoes not null;

    key contaDestino_ChartOfAccounts: ChartOfAccounts not null;
    key contaDestino_GLAccount: GLAccount not null;
    contaDestino: Association to one A_GLAccountInChartOfAccounts on
        contaDestino.ChartOfAccounts = $self.contaDestino.ChartOfAccounts and
        contaDestino.GLAccount = $self.contaDestino.GLAccount;

    key centroCustoDestino_ControllingArea: ControllingArea not null;
    key centroCustoDestino_CostCenter: CostCenter not null;
    centroCustoDestino: Association to one A_CostCenter on
        centroCustoDestino.ControllingArea = $self.centroCustoDestino.ControllingArea and
        centroCustoDestino.CostCenter = $self.centroCustoDestino.CostCenter;

    // TODO A atribução não deve ser obrigatoria
    key atribuicao: String(18);

    porcentagemRateio: Decimal(5,2) not null @assert.range: [ 0, 100 ];

    itensDocumentos: Association to many ItensDocumentos on itensDocumentos.configuracaoDestino = $self;

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

    periodo: FiscalPeriod not null @assert.range: [ 0, 12 ];
    ano: FiscalYear not null @assert.range: [ 1900, 9999 ];

    dataConfiguracoes: DateTime not null default $now;

    @readonly
    status_status: StatusExecucao not null default 'nao_executado';
    status: Association to one StatusExecucoes on status.status = $self.status_status;

    itensExecucoes: Association to many ItensExecucoes on itensExecucoes.execucao = $self;

    logs: Association to many ExecucoesLogs on logs.execucao = $self;

    logsItens: Association to many LogsItensExecucao on logsItens.execucao_ID = $self.ID

}

@autoexpose
@readonly
entity ItensExecucoes: managed {
    key execucao: Association to one Execucoes not null;
    key configuracaoOrigem: Association to one ConfigOrigens;

    documentosGerados: Association to one Documentos; // Um por configuracaoOrigem/moeda
    logs: Association to many ItensExecucoesLogs on logs.item = $self;
}

type Moeda: String(3);

@autoexpose
entity Documentos: managed {
    key CompanyCode: CompanyCode not null;
    key AccountingDocument: String(10) not null;
    key FiscalYear: FiscalYear not null;
    moeda: Moeda;
    itemExecutado: Association to one ItensExecucoes not null;
    itensDocumento: Association to many ItensDocumentos on itensDocumento.documento = $self;
    cancelado: Boolean not null default false;
};

type DocumentItemNumber: String(6);

@autoexpose
entity ItensDocumentos {
    key documento: Association to one Documentos not null;
    key documentItemNumber: DocumentItemNumber not null;
    configuracaoDestino: Association to one ConfigDestinos not null;
}

@readonly
@autoexpose
aspect log: cuid{
    messageType: String(1) not null;
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
        configuracaoOrigem.etapasProcesso.sequencia as sequencia,
        configuracaoOrigem.empresa.CompanyCode as CompanyCode,
        configuracaoOrigem.contaOrigem.ChartOfAccounts as ChartOfAccounts,
        configuracaoOrigem.contaOrigem.GLAccount as GLAccount,
        configuracaoOrigem.centroCustoOrigem.ControllingArea as ControllingArea,
        configuracaoOrigem.centroCustoOrigem.CostCenter as CostCenter
        // documentosGerados: redirected to Documentos
    from rateio.ItensExecucoes
    order by configuracaoOrigem.etapasProcesso.sequencia;

@readonly
entity ConfigOrigensDocumentos as
    select
        key CompanyCode,
        key AccountingDocument,
        key FiscalYear,
        moeda,
        cancelado,
        itemExecutado.configuracaoOrigem.etapasProcesso.sequencia as sequencia,
        // itemExecutado.configuracaoOrigem.empresa_CompanyCode as CompanyCode, // o valor é o mesmo que o da chave
        itemExecutado.configuracaoOrigem.contaOrigem.ChartOfAccounts as ChartOfAccounts,
        itemExecutado.configuracaoOrigem.contaOrigem.GLAccount as GLAccount,
        itemExecutado.configuracaoOrigem.centroCustoOrigem.ControllingArea as ControllingArea,
        itemExecutado.configuracaoOrigem.centroCustoOrigem.CostCenter as CostCenter,
        itemExecutado.execucao.ano,
        itemExecutado.execucao.periodo,
        itemExecutado.execucao.ID as execucao_ID,
        itemExecutado.configuracaoOrigem.ID as configuracaoOrigem_ID
    from rateio.Documentos;

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
    
