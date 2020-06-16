using { qintess.rateio as rateio } from '../db/schema';

using { API_JOURNALENTRYITEMBASIC_SRV as ext } from '../srv/external/API_JOURNALENTRYITEMBASIC_SRV';

service ConfigService @(requires_:'config') {

    // Entidades externas
    @readonly
    entity A_CompanyCode as projection on ext.A_CompanyCode;
    @readonly
    entity A_GLAccountInChartOfAccounts as projection on ext.A_GLAccountInChartOfAccounts;
    @readonly
    entity A_CostCenter as projection on ext.A_CostCenter;

    // Entidades de configuração
    entity EtapasProcesso as projection on rateio.EtapasProcesso;
    entity ConfigOrigens as projection on rateio.ConfigOrigens
        actions{
            action ativar();
            action desativar();
        };

    entity ConfigDestinos as projection on rateio.ConfigDestinos;
    entity TiposOperacoes as projection on rateio.TiposOperacoes;

    // Entidades de execução

    entity Execucoes as projection on rateio.Execucoes
        actions{
            action executar();
        };

    @readonly
    entity ItensExecucoes as projection on rateio.ItensExecucoes;

    @readonly
    entity Documentos as projection on rateio.Documentos
        actions{
            action cancelar();
        }

}
