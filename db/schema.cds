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
    key operacao: TipoOperacao;
}

type CompanyCode : String(4);

type ChartOfAccounts : String(4);
type GLAccount : String(10);

type ControllingArea : String(4);
type CostCenter : String(10);

/**************************************************/
// Configuração
/**************************************************/

// Chave: (etapasProcesso, empresa, contaOrigem, centroCustoOrigem)+periodo
entity ConfigOrigens: cuid, managed{

    etapasProcesso: Association to one EtapasProcesso not null;
    
    empresa: Association to one ext.A_CompanyCode not null;

    contaOrigem: Association to one ext.A_GLAccountInChartOfAccounts not null;

    centroCustoOrigem_ControllingArea: ControllingArea not null;
    centroCustoOrigem_CostCenter: CostCenter not null;
    centroCustoOrigem: Association to one ext.A_CostCenter on
        centroCustoOrigem.ControllingArea = $self.centroCustoOrigem_ControllingArea and
        centroCustoOrigem.CostCenter = $self.centroCustoOrigem_CostCenter;

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

    key tipoOperacao: Association to one TiposOperacoes not null;

    key contaDestino: Association to one ext.A_GLAccountInChartOfAccounts not null;

    key centroCustoDestino_ControllingArea: ControllingArea not null;
    key centroCustoDestino_CostCenter: CostCenter not null;
    centroCustoDestino: Association to one ext.A_CostCenter on
        centroCustoDestino.ControllingArea = $self.centroCustoDestino_ControllingArea and
        centroCustoDestino.CostCenter = $self.centroCustoDestino_CostCenter;

    key atribuicao: String(18);

    porcentagemRateio: Decimal(5,2) not null @assert.range: [ 0, 100 ];

    itensDocumentos: Association to many ItensDocumentos on itensDocumentos.configuracaoDestino = $self;

}

/**************************************************/
// Execução
/**************************************************/

type FiscalYear: String(4);
type FiscalPeriod: String(3);

type StatusExecucao: String enum { nao_executado; em_execucao; finalizado; cancelado; }

entity StatusExecucoes: sap.common.CodeList{
    key status: StatusExecucao;
}

// TODO Só possível modificar se status.status == nao_executado
// TODO Só possível eliminar se status.status == nao_executado
// TODO A busca dos saldos base para criação dos documentos deve ser realizado por etapa.
// TODO Não deve ser possível realizar uma mesma execução em paralello.
entity Execucoes: cuid, managed{

    descricao: String(100) not null;

    periodo: FiscalPeriod not null; // TODO Validar formato
    ano: FiscalYear not null; // TODO Validar formato

    // TODO Modificar para Date e mudar $now para $today se existir, já que Date é incompatível com $now.
    dataConfiguracoes: DateTime not null default $now;

    @readonly
    status_status: StatusExecucao not null default 'nao_executado';
    status: Association to one StatusExecucoes on status.status = $self.status_status;

    itensExecucoes: Association to many ItensExecucoes on itensExecucoes.execucao = $self;

    logs: Association to many ExecucoesLogs on logs.execucao = $self;

}

// TODO O processamento deve ser realizado seguindo a configuracaoOrigem.etapasProcesso.sequencia
@autoexpose
@readonly
entity ItensExecucoes: managed {
    key execucao: Association to one Execucoes not null;
    // TODO só poderão ser adicionadas configurações onde execucao.DataConfiguracoes esteja dentro do periodo de validez.
    key configuracaoOrigem: Association to one ConfigOrigens;

    documentoGerado: Association to one Documentos on documentoGerado.itemExecutado = $self;
    logs: Association to many ItensExecucoesLogs on logs.item = $self;
}

// TODO Validar não seja possível a duplicidade de rateios:
// Um documento X poderá ser criado se não existir outro documento Y onde
// Y.itemExecutado.configuracaoOrigem.equivalenteA(X.itemExecutado.configuracaoOrigem) e
// Y.itemExecutado.execucao.mesmoPeriodo(X.itemExecutado.execucao) e
// not Y.cancelado
// equivalenteA: Compara empresa, conta e centro de custo.
// mesmoPeriodo: Compara o mes e o ano.
// TODO Quando um documento for cancelado, deixar registrado no log associado ao item.
@autoexpose
entity Documentos: managed {
    key CompanyCode: CompanyCode not null;
    key AccountingDocument: String(10) not null;
    key FiscalYear: FiscalYear not null;
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

@insertonly
@autoexpose
aspect log: cuid, managed{
    messageType: String(1) not null;
    messageCode: String(10);
    message: String(255) not null;
}

@autoexpose
entity ExecucoesLogs: log{
    execucao: Association to Execucoes;
}

@autoexpose
entity ItensExecucoesLogs: log{
    item: Association to ItensExecucoes;
}
