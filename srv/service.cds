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
    @readonly
    entity A_JournalEntryItemBasic as projection on ext.A_JournalEntryItemBasic;

    // Entidades de configuração
    entity EtapasProcesso as projection on rateio.EtapasProcesso;
    entity ConfigOrigens as projection on rateio.ConfigOrigens
        { *, itensExecucoes: redirected to ItensExecucoes }
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
        { *, documentosGerados: redirected to Documentos };

    @readonly
    entity Documentos as projection on rateio.Documentos
        { *, itemExecutado: redirected to ItensExecucoes }
        actions{
            action cancelar();
        }

    // Para uso interno na logica de processamento (é necessario por problemas com sqlite)

    @readonly
    entity EtapasExecucoes
        as 
        SELECT 
            key execucao.ID as execucao_ID,
            key configuracaoOrigem.ID as configuracaoOrigem_ID,
            configuracaoOrigem.etapasProcesso.sequencia as sequencia,
            configuracaoOrigem.empresa_CompanyCode as CompanyCode,
            configuracaoOrigem.contaOrigem_ChartOfAccounts as ChartOfAccounts,
            configuracaoOrigem.contaOrigem_GLAccount as GLAccount,
            configuracaoOrigem.centroCustoOrigem_ControllingArea as ControllingArea,
            configuracaoOrigem.centroCustoOrigem_CostCenter as CostCenter
            // documentosGerados: redirected to Documentos
        from rateio.ItensExecucoes
        order by configuracaoOrigem.etapasProcesso.sequencia;

    @readonly
    entity DocumentosPorOrigem as
        select
            key CompanyCode,
            key AccountingDocument,
            key FiscalYear,
            moeda,
            cancelado,
            itemExecutado.configuracaoOrigem.etapasProcesso.sequencia as sequencia,
            // itemExecutado.configuracaoOrigem.empresa_CompanyCode as CompanyCode, // o valor é o mesmo que o da chave
            itemExecutado.configuracaoOrigem.contaOrigem_ChartOfAccounts as ChartOfAccounts,
            itemExecutado.configuracaoOrigem.contaOrigem_GLAccount as GLAccount,
            itemExecutado.configuracaoOrigem.centroCustoOrigem_ControllingArea as ControllingArea,
            itemExecutado.configuracaoOrigem.centroCustoOrigem_CostCenter as CostCenter,
            itemExecutado: redirected to ItensExecucoes
        from rateio.Documentos;

}
