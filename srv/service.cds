using { qintess.rateio as rateio } from '../db/schema';

using { API_JOURNALENTRYITEMBASIC_SRV as ext } from '../srv/external/API_JOURNALENTRYITEMBASIC_SRV';

service ConfigService @(requires:'rateioAdmin') {

    action sync();

    // Entidades externas
    @readonly
    entity A_CompanyCode as projection on rateio.A_CompanyCode;

    @readonly
    entity A_GLAccountInChartOfAccounts as projection on rateio.A_GLAccountInChartOfAccounts;
    
    @readonly
    entity A_CostCenterCompleto as projection on rateio.A_CostCenterCompleto;

    @readonly
    entity A_CostCenter as projection on rateio.A_CostCenter;

    // Entidades de configuração
    entity EtapasProcesso as projection on rateio.EtapasProcesso;
    entity ConfigOrigens 
        as projection on rateio.ConfigOrigens{
            *,
            itensExecucoes: redirected to ItensExecucoes,
            destinos: redirected to ConfigDestinos 
        }
        actions{
            action ativar();
            action desativar();
        };

    entity ConfigDestinos as projection on rateio.ConfigDestinos;
    entity TiposOperacoes as projection on rateio.TiposOperacoes;

    // Entidades de execução

    entity Execucoes as projection on rateio.Execucoes
        { *, itensExecucoes: redirected to ItensExecucoes }
        actions{
            // TODO Adicionar opção de wait
            action executar();
        };

    @readonly
    entity ItensExecucoes as projection on rateio.ItensExecucoes
        { 
            *,
            documentosGerados: redirected to Documentos,
            logs: redirected to ItensExecucoesLogs 
        };

    @readonly
    entity Documentos as projection on rateio.Documentos
        { *, itemExecutado: redirected to ItensExecucoes }
        actions{
            action cancelar();
        }

    entity ExecucoesLogs as projection on rateio.ExecucoesLogs;
    entity ItensExecucoesLogs as projection on rateio.ItensExecucoesLogs
        { *, item: redirected to ItensExecucoes };

    // Para uso interno na logica de processamento (é necessario por problemas com sqlite)

    @readonly
    entity ConfigOrigensExecucoes as projection on rateio.ConfigOrigensExecucoes;

    @readonly
    entity ConfigOrigensDocumentos as projection on rateio.ConfigOrigensDocumentos{
        *, itemExecutado: redirected to ItensExecucoes
    };

    @readonly
    entity LogsItensExecucao as projection on rateio.LogsItensExecucao;

    entity ConfigOrigensDestinos as projection on rateio.ConfigOrigensDestinos;


    // Exportação/Importação de configurações

    @readonly
    entity Exportacao as projection on rateio.Exportacao;

    @readonly
    entity OperacoesImportacoes as projection on rateio.OperacoesImportacoes;

    entity Importacoes 
        as projection on rateio.Importacoes
        actions{
            action importar();
        };

    @readonly
    entity ImportacoesLogs as projection on rateio.ImportacoesLogs;

}
