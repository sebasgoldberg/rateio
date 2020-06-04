using { cuid, temporal, managed, sap, User } from '@sap/cds/common';
using { API_JOURNALENTRYITEMBASIC_SRV as ext  } from '../srv/external/API_JOURNALENTRYITEMBASIC_SRV';
namespace qintess.rateio;

/**************************************************/
// Definições Basicas
/**************************************************/

// TODO O processamento deve ser realizado seguindo a sequencia.
entity EtapaProcesso: managed, sap.common.CodeList{
    key sequencia: Integer;
}

type TipoOperacao: String enum { credito; debito }

type CompanyCode : String(4);

type ChartOfAccounts : String(4);
type GLAccount : String(10);

type ControllingArea : String(4);
type CostCenter : String(10);

/**************************************************/
// Configuração
/**************************************************/

// TODO Se não tiver execuções só poderá habilitar/deshabilitar e modificar as datas de inicio e fim.
// TODO Validar não exista sobreposição de periodos entre 
entity ConfigOrigens : cuid, temporal {

    Descricao: String(100);

    // etapaProcesso: Association to one EtapaProcesso not null;
    etapaProcesso: Association to one EtapaProcesso not null;
    
    companyCode: CompanyCode not null;
    empresa: Association to one ext.A_CompanyCode on empresa.CompanyCode = $self.companyCode;

    // Faz parte da chave das contas.
    chartOfAccounts: ChartOfAccounts default '1234' not null;

    // Faz parte da chave dos centros de custo.
    controllingArea: ControllingArea default '1234' not null;

    // Dados Origem

    gLAccountOrigem: GLAccount not null;
    contaOrigem: Association to one ext.A_GLAccountInChartOfAccounts on 
        contaOrigem.ChartOfAccounts = $self.chartOfAccounts and
        contaOrigem.GLAccount = $self.gLAccountOrigem;

    costCenterOrigem: CostCenter not null;
    centroCustoOrigem: Association to one ext.A_CostCenter on
        centroCustoOrigem.ControllingArea = $self.controllingArea and
        centroCustoOrigem.CostCenter = $self.costCenterOrigem;

    // Dados de Destino
    destinos: Association to many ConfigDestinos on destinos.origem = $self;

    habilitado: Boolean not null default true; // Necessario já que uma vez que foi associado a alguma excecução, não sera possível modificar ou eliminar.

    itensExecucoes: Association to many ItensExecucoes on itensExecucoes.configuracaoOrigem = $self;

}

// TODO Modificação só possível se não tiver execuções (incluindo adições/eliminações).
// TODO A soma do porcentagemRateio agrupado por tipoOperacao sempre deve de ser 100.
// TODO Um mesmo origem tem que ter definidos os dois tipos de operações
entity ConfigDestinos: managed{
    
    key origem: Association to one ConfigOrigens not null;
    key tipoOperacao: TipoOperacao not null;

    key gLAccountDestino: GLAccount not null;
    contaDestino: Association to one ext.A_GLAccountInChartOfAccounts on 
        contaDestino.ChartOfAccounts = $self.origem.chartOfAccounts and
        contaDestino.GLAccount = $self.gLAccountDestino;

    key costCenterDestino: CostCenter not null;
    centroCustoDestino: Association to one ext.A_CostCenter on
        centroCustoDestino.ControllingArea = $self.origem.controllingArea and
        centroCustoDestino.CostCenter = $self.costCenterDestino;

    key atribuicao: String(18);

    porcentagemRateio: Decimal(5,2) not null;

    itensDocumentos: Association to many ItensDocumentos on itensDocumentos.configuracaoDestino = $self;

}

/**************************************************/
// Execução
/**************************************************/

type FiscalYear: String(4);
type FiscalPeriod: String(3);

entity Execucoes: cuid, managed{

    Descricao: String(100) not null;

    // companyCode: CompanyCode not null;
    // empresa: Association to one ext.A_CompanyCode on empresa.CompanyCode = $self.companyCode;

    Periodo: FiscalPeriod not null; // TODO Validar formato
    Ano: FiscalYear not null; // TODO Validar formato

    DataConfiguracoes: Date not null default $now;

    itensExecucoes: Association to many ItensExecucoes on itensExecucoes.execucao = $self;

    logs: Association to many ExecucoesLogs on logs.execucao = $self;

}

// TODO Não é possível apagar uma vez realizada a execução.
entity ItensExecucoes: cuid, managed {
    execucao: Association to one Execucoes not null;
    // TODO só poderão ser adicionadas configurações onde execucao.DataConfiguracoes esteja dentro do periodo de validez.
    configuracaoOrigem: Association to one ConfigOrigens not null;
    documentoGerado: Association to one Documentos on documentoGerado.itemExecutado = $self;
    logs: Association to many ItensExecucoesLogs on logs.item = $self;
}

@autoexpose
// TODO Um documento poderá ser criado se não existir Execucoes com Periodo e Ano com 
// itemExecutado.configuracaoOrigem similar que verifique itemExecutado.documentoGerado.cancelado = false
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