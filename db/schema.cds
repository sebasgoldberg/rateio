using { cuid, temporal, managed, sap } from '@sap/cds/common';
using { API_JOURNALENTRYITEMBASIC_SRV as ext  } from '../srv/external/API_JOURNALENTRYITEMBASIC_SRV';
namespace qintess.rateio;

/**************************************************/
// Serviços externos
/**************************************************/
    

// @readonly
// entity Empresas as projection on API_JOURNALENTRYITEMBASIC_SRV.A_CompanyCode;

// @readonly
// entity Contas as projection on API_JOURNALENTRYITEMBASIC_SRV.A_GLAccountInChartOfAccounts;

// @readonly
// entity CentrosCusto as projection on API_JOURNALENTRYITEMBASIC_SRV.A_CostCenter;

/**************************************************/
// Modelo 
/**************************************************/

entity EtapaProcesso: managed, sap.common.CodeList{
    key sequencia: Integer;
}

type TipoOperacao: String enum { credito; debito }

type CompanyCode : String(4);

type ChartOfAccounts : String(4);
type GLAccount : String(10);

type ControllingArea : String(4);
type CostCenter : String(10);


entity ConfigOrigens : cuid, temporal {
    // etapaProcesso: Association to one EtapaProcesso not null;
    etapaProcesso: Association to EtapaProcesso not null;
    
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
}

entity ConfigDestinos: cuid, managed{
    
    origem: Association to one ConfigOrigens;
    tipoOperacao: TipoOperacao;

    gLAccountDestino: GLAccount not null;
    contaDestino: Association to one ext.A_GLAccountInChartOfAccounts on 
        contaDestino.ChartOfAccounts = $self.origem.chartOfAccounts and
        contaDestino.GLAccount = $self.gLAccountDestino;

    costCenterDestino: CostCenter not null;
    centroCustoDestino: Association to one ext.A_CostCenter on
        centroCustoDestino.ControllingArea = $self.origem.controllingArea and
        centroCustoDestino.CostCenter = $self.costCenterDestino;

    atribuicao: String(18);

    porcentagemRateio: Decimal(5,2);

}