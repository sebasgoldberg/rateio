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

// TODO Se ativo: Só poderá modificar as datas de inicio e fim, e a descrição.
// TODO Ao ativar: A soma do porcentagemRateio para os creditos deve ser igual ao dos debitos nos destinos  a origem.
// TODO Ao ativar: A origem tem que ter destinos.
// TODO Desativação: Só possível se empty(origem.itensExecucoes).
// Chave: (etapasProcesso, empresa, contaOrigem, centroCustoOrigem)+periodo
entity ConfigOrigens: cuid, managed{

    // TODO A etapa realmente deve ser chave?
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

    @readonly
    ativa: Boolean not null default false;

    itensExecucoes: Association to many ItensExecucoes on itensExecucoes.configuracaoOrigem = $self;

}

type UUIDType: String(36);

// TODO A conta e o centro de custo tem que ser validos na modificação.
// TODO adição/modificação/eliminação só possível se not origem.ativo
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

// TODO Não deve ser possível realizar uma mesma execução em paralello.
// TODO A busca dos saldos base para criação dos documentos deve ser realizado por etapa (ou por ConfigOrigem?).
entity Execucoes: cuid, managed{

    descricao: String(100) not null;

    // companyCode: CompanyCode not null;
    // empresa: Association to one ext.A_CompanyCode on empresa.CompanyCode = $self.companyCode;

    Periodo: FiscalPeriod not null; // TODO Validar formato
    Ano: FiscalYear not null; // TODO Validar formato

    // TODO Modificar para Date e mudar $now para $today se existir, já que Date é incompatível com $now.
    DataConfiguracoes: DateTime not null default $now;

    itensExecucoes: Association to many ItensExecucoes on itensExecucoes.execucao = $self;

    logs: Association to many ExecucoesLogs on logs.execucao = $self;

}

// TODO Não é possível apagar uma vez realizada a execução ().
// TODO O processamento deve ser realizado seguindo a configuracaoOrigem.etapasProcesso.sequencia
entity ItensExecucoes: managed {
    key execucao: Association to one Execucoes not null;
    // TODO só poderão ser adicionadas configurações onde execucao.DataConfiguracoes esteja dentro do periodo de validez.
    key configuracaoOrigem: Association to one ConfigOrigens;

    documentoGerado: Association to one Documentos on documentoGerado.itemExecutado = $self;
    logs: Association to many ItensExecucoesLogs on logs.item = $self;
}

@autoexpose
// TODO Validar não seja possível a duplicidade de rateios:
// Um documento X poderá ser criado se não existir outro documento Y onde
// Y.itemExecutado.configuracaoOrigem.equivalenteA(X.itemExecutado.configuracaoOrigem) e
// Y.itemExecutado.execucao.mesmoPeriodo(X.itemExecutado.execucao) e
// not Y.cancelado
// equivalenteA: Compara empresa, conta e centro de custo.
// mesmoPeriodo: Compara o mes e o ano.
// TODO Quando um documento for cancelado, deixar registrado no log associado ao item.
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
@insertonly
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

entity ExecucoesLogs: log{
    execucao: Association to Execucoes;
}

entity ItensExecucoesLogs: log{
    item: Association to ItensExecucoes;
}
