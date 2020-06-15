using { qintess.rateio as rateio } from '../db/schema';

using { API_JOURNALENTRYITEMBASIC_SRV as ext } from '../srv/external/API_JOURNALENTRYITEMBASIC_SRV';

service ConfigService @(requires_:'config') {

    // Serviços externos
    @readonly
    entity A_CompanyCode as projection on ext.A_CompanyCode;
    @readonly
    entity A_GLAccountInChartOfAccounts as projection on ext.A_GLAccountInChartOfAccounts;
    @readonly
    entity A_CostCenter as projection on ext.A_CostCenter;

    entity EtapasProcesso as projection on rateio.EtapasProcesso;
    entity ConfigOrigens as projection on rateio.ConfigOrigens
        actions{
            action ativar();
        };

    entity ConfigDestinos as projection on rateio.ConfigDestinos;
    entity TiposOperacoes as projection on rateio.TiposOperacoes;

}
