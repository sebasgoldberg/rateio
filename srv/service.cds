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
    entity ConfigOrigensDocumentos as projection on rateio.ConfigOrigensDocumentos;

    @readonly
    entity LogsItensExecucao as projection on rateio.LogsItensExecucao;

}

annotate ConfigService.A_CompanyCode with @cds.odata.valuelist;

annotate ConfigService.A_GLAccountInChartOfAccounts with @cds.odata.valuelist;

annotate ConfigService.A_CostCenter with @cds.odata.valuelist;

annotate ConfigService.ConfigOrigens with{

    etapasProcesso @Common.Label: 'Etapa';

    empresa_CompanyCode @(
		Common: {
			Label: 'Empresa',
			FieldControl: #Mandatory,
            ValueList: {
                Label: 'Empresas',
                CollectionPath: 'A_CompanyCode',
                SearchSupported: true,
                Parameters: [
                    {
                        $Type: 'Common.ValueListParameterInOut',
                        LocalDataProperty: 'empresa_CompanyCode',
                        ValueListProperty: 'CompanyCode'
                    },
                    {
                        $Type: 'Common.ValueListParameterDisplayOnly',
                        // LocalDataProperty: 'contaOrigem_GLAccount',
                        ValueListProperty: 'CompanyCodeName'
                    }
                ]
            },
		},
		// ValueList.entity: 'A_CompanyCode',CompanyCodeName
	);

    contaOrigem_ChartOfAccounts @(
            Common: {
                Label: 'Chart Of Accounts',
                FieldControl: #Mandatory,
                ValueList: {
                    Label: 'Chart Of Accounts',
                    CollectionPath: 'A_GLAccountInChartOfAccounts',
                    SearchSupported: true,
                    Parameters: [
                        {
                            $Type: 'Common.ValueListParameterInOut',
                            LocalDataProperty: 'contaOrigem_ChartOfAccounts',
                            ValueListProperty: 'ChartOfAccounts'
                        },
                        {
                            $Type: 'Common.ValueListParameterOut',
                            LocalDataProperty: 'contaOrigem_GLAccount',
                            ValueListProperty: 'GLAccount'
                        }
                    ]
                },
            },
	    );

    contaOrigem_GLAccount @(
            Common: {
                Label: 'Conta',
                FieldControl: #Mandatory,
                ValueList: {
                    Label: 'Conta',
                    CollectionPath: 'A_GLAccountInChartOfAccounts',
                    SearchSupported: true,
                    Parameters: [
                        {
                            $Type: 'Common.ValueListParameterOut',
                            LocalDataProperty: 'contaOrigem_ChartOfAccounts',
                            ValueListProperty: 'ChartOfAccounts'
                        },
                        {
                            $Type: 'Common.ValueListParameterInOut',
                            LocalDataProperty: 'contaOrigem_GLAccount',
                            ValueListProperty: 'GLAccount'
                        }
                    ]
                },
            },
	    );

    centroCustoOrigem_ControllingArea @(
            Common: {
                Label: 'Controlling Area',
                FieldControl: #Mandatory,
                ValueList: {
                    Label: 'Centros de custo',
                    CollectionPath: 'A_CostCenterCompleto',
                    SearchSupported: true,
                    Parameters: [
                        {
                            $Type: 'Common.ValueListParameterOut',
                            LocalDataProperty: 'centroCustoOrigem_ControllingArea',
                            ValueListProperty: 'ControllingArea'
                        },
                        {
                            $Type: 'Common.ValueListParameterOut',
                            LocalDataProperty: 'centroCustoOrigem_CostCenter',
                            ValueListProperty: 'CostCenter'
                        }
                    ]
                },
            },
	    );

    centroCustoOrigem_CostCenter @(
            Common: {
                Label: 'Centro de custo',
                FieldControl: #Mandatory,
                ValueList: {
                    Label: 'Centros de custo',
                    CollectionPath: 'A_CostCenterCompleto',
                    SearchSupported: true,
                    Parameters: [
                        {
                            $Type: 'Common.ValueListParameterOut',
                            LocalDataProperty: 'centroCustoOrigem_ControllingArea',
                            ValueListProperty: 'ControllingArea'
                        },
                        {
                            $Type: 'Common.ValueListParameterOut',
                            LocalDataProperty: 'centroCustoOrigem_CostCenter',
                            ValueListProperty: 'CostCenter'
                        }
                    ]
                },
            },
	    );

    validFrom @Common.Label: 'Valido de';
    validTo @Common.Label: 'Valido até';
    ativa @Common.Label: 'Ativa';
}


annotate ConfigService.EtapasProcesso with {
    sequencia @Common.Label: 'Sequencia';
}

// @odata.draft.enabled
annotate ConfigService.ConfigOrigens with @(
    UI: {
        SelectionFields: [ 
            etapasProcesso_sequencia, empresa_CompanyCode, contaOrigem_ChartOfAccounts,
            contaOrigem_GLAccount, centroCustoOrigem_ControllingArea, centroCustoOrigem_CostCenter, 
            ativa, validFrom, validTo, createdAt, createdBy
            ],
        LineItem: [
            {$Type: 'UI.DataField', Value: etapasProcesso_sequencia},
            {$Type: 'UI.DataField', Value: empresa_CompanyCode},
            {$Type: 'UI.DataField', Value: validFrom},
            {$Type: 'UI.DataField', Value: createdAt},
        ],
        HeaderInfo: {
            TypeName: 'Configuração', TypeNamePlural: 'Configurações',
            Title: { $Type: 'UI.DataField', Value: ID },
            Description: { Value: createdBy }
        },
        Identification: [ //Is the main field group
            {Value: etapasProcesso_sequencia, Label:'Etapa'},
            {Value: empresa_CompanyCode, Label:'Empresa'},
            {Value: contaOrigem_GLAccount, Label:'Conta'},
            {Value: centroCustoOrigem_CostCenter, Label:'Centro de Custo'},
	    ],
        HeaderFacets: [
			{$Type: 'UI.ReferenceFacet', Label: 'Validez', Target: '@UI.FieldGroup#Validez'},
			{$Type: 'UI.ReferenceFacet', Label: 'Criado', Target: '@UI.FieldGroup#Created'},
			{$Type: 'UI.ReferenceFacet', Label: 'Modificado', Target: '@UI.FieldGroup#Modified'},
		],
        Facets: [
			{$Type: 'UI.ReferenceFacet', Label: 'Detalhes', Target: '@UI.FieldGroup#Details'},
			{$Type: 'UI.ReferenceFacet', Label: 'Destinos', Target: 'destinos/@UI.LineItem'},
		],
		FieldGroup#Details: {
			Data: [
				{Value: descricao, Label:'Descrição'},
				{Value: ativa, Label:'Configuração ativa'},
			]
		},
		FieldGroup#Validez: {
			Data: [
				{Value: validFrom},
				{Value: validTo},
			]
		},
		FieldGroup#Created: {
			Data: [
				{Value: createdBy},
				{Value: createdAt},
			]
		},
		FieldGroup#Modified: {
			Data: [
				{Value: modifiedBy},
				{Value: modifiedAt},
			]
		},
    }
);
