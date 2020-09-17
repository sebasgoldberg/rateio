using { qintess.rateio as rateio } from '../db/schema';

annotate ConfigService.ConfigOrigensDocumentos with{

    CompanyCode @(
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
                        LocalDataProperty: 'CompanyCode',
                        ValueListProperty: 'CompanyCode'
                    },
                    {
                        $Type: 'Common.ValueListParameterDisplayOnly',
                        // LocalDataProperty: 'contaOrigem_GLAccount',
                        ValueListProperty: 'CompanyCodeName'
                    }
                ]
            },
		}
	);

    AccountingDocument @Common.Label: 'Núm. doc.';

    FiscalYear @Common.Label: 'Exercicio';

    moeda @(
		Common: {
			Label: 'Moeda',
        }
    );

    cancelado @(
		Common: {
			Label: 'Cancelado',
        }
    );

    EstornadoCom @Common.Label: 'Estornado com';

    configuracaoOrigem_ID @Common.Label: 'ID origem';

    sequencia @(
		Common: {
			Label: 'Etapa',
			FieldControl: #Mandatory,
            ValueList: {
                Label: 'Etapas',
                CollectionPath: 'EtapasProcesso',
                SearchSupported: true,
                Parameters: [
                    {
                        $Type: 'Common.ValueListParameterInOut',
                        LocalDataProperty: 'sequencia',
                        ValueListProperty: 'sequencia'
                    },
                    {
                        $Type: 'Common.ValueListParameterDisplayOnly',
                        ValueListProperty: 'name'
                    }
                ]
            },
		},
        // TODO Deveria trazer as descrições.
        sap.value.list: 'fixed-values',
	);

    ChartOfAccounts @(
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
                            LocalDataProperty: 'ChartOfAccounts',
                            ValueListProperty: 'ChartOfAccounts'
                        },
                        {
                            $Type: 'Common.ValueListParameterOut',
                            LocalDataProperty: 'GLAccount',
                            ValueListProperty: 'GLAccount'
                        }
                    ]
                },
            },
	    );

    GLAccount @(
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
                            LocalDataProperty: 'ChartOfAccounts',
                            ValueListProperty: 'ChartOfAccounts'
                        },
                        {
                            $Type: 'Common.ValueListParameterInOut',
                            LocalDataProperty: 'GLAccount',
                            ValueListProperty: 'GLAccount'
                        }
                    ]
                },
            },
	    );

    ControllingArea @(
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
                            LocalDataProperty: 'ControllingArea',
                            ValueListProperty: 'ControllingArea'
                        },
                        {
                            $Type: 'Common.ValueListParameterOut',
                            LocalDataProperty: 'CostCenter',
                            ValueListProperty: 'CostCenter'
                        }
                    ]
                },
            },
	    );

    CostCenter @(
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
                            LocalDataProperty: 'ControllingArea',
                            ValueListProperty: 'ControllingArea'
                        },
                        {
                            $Type: 'Common.ValueListParameterOut',
                            LocalDataProperty: 'CostCenter',
                            ValueListProperty: 'CostCenter'
                        }
                    ]
                },
            },
	    );
    
    validFrom @Common.Label: 'Valido de';

    validTo @Common.Label: 'Valido até';

    execucao_ID @Common.Label: 'ID execução';

    ano @Common.Label: 'Ano execução';

    periodo @Common.Label: 'Periodo execução';

}


annotate ConfigService.ConfigOrigensDocumentos with @(
    UI: {

        SelectionFields: [ 
            CompanyCode,
            AccountingDocument,
            FiscalYear,
            moeda,
            cancelado,
            EstornadoCom,
            sequencia,
            ChartOfAccounts,
            GLAccount,
            ControllingArea,
            CostCenter,
            ano,
            periodo,
            ],

        PresentationVariant:{
            SortOrder:[
                {Property: createdAt, Descending: true},
            ]
        },

        LineItem: [
            {$Type: 'UI.DataField', Value: CompanyCode},
            {$Type: 'UI.DataField', Value: AccountingDocument},
            {$Type: 'UI.DataField', Value: FiscalYear},
            {$Type: 'UI.DataField', Value: moeda},
            {$Type: 'UI.DataField', Value: cancelado, Criticality: canceladoCriticality },
            {$Type: 'UI.DataField', Value: EstornadoCom},
            {$Type: 'UI.DataField', Value: sequencia},
            {$Type: 'UI.DataField', Value: ChartOfAccounts},
            {$Type: 'UI.DataField', Value: GLAccount},
            {$Type: 'UI.DataField', Value: ControllingArea},
            {$Type: 'UI.DataField', Value: CostCenter},
            {$Type: 'UI.DataField', Value: ano},
            {$Type: 'UI.DataField', Value: periodo},
            {$Type: 'UI.DataField', Value: createdAt},
            {$Type: 'UI.DataFieldForAction', Label: 'Estornar', Action: 'ConfigService/Documentos_cancelar', Determining: true },
        ],

        Identification:[ //![@UI.Importance]: #High,
            {$Type: 'UI.DataFieldForAction', Label: 'Estornar', Action: 'ConfigService/Documentos_cancelar' },
        ],


        HeaderInfo: {
            TypeName: 'Documento', TypeNamePlural: 'Documentos',
            // Title: { $Type: 'UI.DataField', Value: message },
            // Description: { Value: ID }
        },

        HeaderFacets: [
			{$Type: 'UI.ReferenceFacet', Label: 'Criado', Target: '@UI.FieldGroup#Created'},
			{$Type: 'UI.ReferenceFacet', Label: 'Modificado', Target: '@UI.FieldGroup#Modified'},
		],
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
        Facets: [
			{$Type: 'UI.ReferenceFacet', Label: 'Detalhes', Target: '@UI.FieldGroup#Detalhes'},
            {$Type: 'UI.ReferenceFacet', Label: 'Configuração Origem', Target: '@UI.FieldGroup#Origem'},
            {$Type: 'UI.ReferenceFacet', Label: 'Execucão', Target: '@UI.FieldGroup#Execucao'},
		],
		FieldGroup#Detalhes: {
			Data: [
                {Value: CompanyCode },
                {Value: AccountingDocument },
                {Value: FiscalYear },
                {Value: moeda },
                {Value: cancelado, Criticality: canceladoCriticality },
                {Value: EstornadoCom },
			]
		},
		FieldGroup#Origem: {
			Data: [
                {Value: configuracaoOrigem_ID},
                {Value: itemExecutado.configuracaoOrigem.descricao},
                {Value: sequencia},
                {Value: CompanyCode},
                {Value: ChartOfAccounts},
                {Value: GLAccount},
                {Value: ControllingArea},
                {Value: CostCenter},
				{Value: validFrom},
				{Value: validTo},
			]
		},
		FieldGroup#Execucao: {
			Data: [
                {Value: execucao_ID},
                {Value: itemExecutado.execucao.etapasProcesso_sequencia},
                {Value: ano},
                {Value: periodo},
                {Value: itemExecutado.execucao.dataConfiguracoes},
			]
		},
    }
);

