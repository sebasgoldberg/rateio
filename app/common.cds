using { qintess.rateio as rateio } from '../db/schema';

annotate ConfigService.A_CompanyCode with @cds.odata.valuelist;

annotate ConfigService.A_GLAccountInChartOfAccounts with @cds.odata.valuelist;

annotate ConfigService.A_CostCenter with @cds.odata.valuelist;


annotate ConfigService.ConfigOrigens with{

    descricao @Common.Label: 'Descricao';

    etapaProcesso_sequencia @(
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
                        LocalDataProperty: 'etapaProcesso_sequencia',
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
		}
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

annotate ConfigService.ConfigOrigens with @(
    UI: {

        SelectionFields: [ 
            etapaProcesso_sequencia, empresa_CompanyCode, contaOrigem_ChartOfAccounts,
            contaOrigem_GLAccount, centroCustoOrigem_ControllingArea, centroCustoOrigem_CostCenter, 
            validFrom, validTo, ativa
            ],

        LineItem: [
            {$Type: 'UI.DataField', Value: etapaProcesso_sequencia},
            {$Type: 'UI.DataField', Value: empresa_CompanyCode},
            {$Type: 'UI.DataField', Value: contaOrigem_ChartOfAccounts},
            {$Type: 'UI.DataField', Value: contaOrigem_GLAccount},
            {$Type: 'UI.DataField', Value: centroCustoOrigem_ControllingArea},
            {$Type: 'UI.DataField', Value: centroCustoOrigem_CostCenter},
            {$Type: 'UI.DataField', Value: validFrom},
            {$Type: 'UI.DataField', Value: validTo},
            {$Type: 'UI.DataField', Value: ativa, Criticality: ativaCriticality },
            {$Type: 'UI.DataFieldForAction', Label: 'Ativar', Action: 'ConfigService/ConfigOrigens_ativar', Determining: true },
            {$Type: 'UI.DataFieldForAction', Label: 'Desativar', Action: 'ConfigService/ConfigOrigens_desativar', Determining: true },
            {$Type: 'UI.DataFieldForAction', Label: 'Sincronizar', Action: 'ConfigService/sync', Determining: true },
        ],

        Identification:[ //![@UI.Importance]: #High,
            {$Type: 'UI.DataFieldForAction', Label: 'Ativar', Action: 'ConfigService/ConfigOrigens_ativar'},
            {$Type: 'UI.DataFieldForAction', Label: 'Desativar', Action: 'ConfigService/ConfigOrigens_desativar'}

        ],

        HeaderInfo: {
            TypeName: 'Configuração', TypeNamePlural: 'Configurações',
            Title: { $Type: 'UI.DataField', Value: descricao },
            Description: { Value: ID }
        },


        HeaderFacets: [
			{$Type: 'UI.ReferenceFacet', Label: 'Validez', Target: '@UI.FieldGroup#Validez'},
			{$Type: 'UI.ReferenceFacet', Label: 'Criado', Target: '@UI.FieldGroup#Created'},
			{$Type: 'UI.ReferenceFacet', Label: 'Modificado', Target: '@UI.FieldGroup#Modified'},
		],
		FieldGroup#Validez: {
			Data: [
                {Value: ativa, Criticality: ativaCriticality},
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

        Facets: [
			{$Type: 'UI.ReferenceFacet', Label: 'Origem', Target: '@UI.FieldGroup#Origem'},
			{$Type: 'UI.ReferenceFacet', Label: 'Destinos', Target: 'destinos/@UI.LineItem'},
		],
		FieldGroup#Origem: {
			Data: [
                {Value: descricao, Label:'Descrição'},
                {Value: etapaProcesso_sequencia},
                {Value: empresa_CompanyCode},
                {Value: contaOrigem_ChartOfAccounts},
                {Value: contaOrigem_GLAccount},
                {Value: centroCustoOrigem_ControllingArea},
                {Value: centroCustoOrigem_CostCenter},
				{Value: validFrom},
				{Value: validTo},
			]
		},
    }
);

annotate ConfigService.ConfigDestinos with{

    tipoOperacao_operacao @(
		Common: {
			Label: 'Tipo de operação',
			FieldControl: #Mandatory,
            ValueList: {
                Label: 'Tipos de operações',
                CollectionPath: 'TiposOperacoes',
                SearchSupported: true,
                Parameters: [
                    {
                        $Type: 'Common.ValueListParameterInOut',
                        LocalDataProperty: 'tipoOperacao_operacao',
                        ValueListProperty: 'operacao'
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

    contaDestino_ChartOfAccounts @(
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
                            LocalDataProperty: 'contaDestino_ChartOfAccounts',
                            ValueListProperty: 'ChartOfAccounts'
                        },
                        {
                            $Type: 'Common.ValueListParameterOut',
                            LocalDataProperty: 'contaDestino_GLAccount',
                            ValueListProperty: 'GLAccount'
                        }
                    ]
                },
            },
	    );

    contaDestino_GLAccount @(
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
                            LocalDataProperty: 'contaDestino_ChartOfAccounts',
                            ValueListProperty: 'ChartOfAccounts'
                        },
                        {
                            $Type: 'Common.ValueListParameterInOut',
                            LocalDataProperty: 'contaDestino_GLAccount',
                            ValueListProperty: 'GLAccount'
                        }
                    ]
                },
            },
	    );

    centroCustoDestino_ControllingArea @(
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
                            LocalDataProperty: 'centroCustoDestino_ControllingArea',
                            ValueListProperty: 'ControllingArea'
                        },
                        {
                            $Type: 'Common.ValueListParameterOut',
                            LocalDataProperty: 'centroCustoDestino_CostCenter',
                            ValueListProperty: 'CostCenter'
                        }
                    ]
                },
            },
	    );

    centroCustoDestino_CostCenter @(
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
                            LocalDataProperty: 'centroCustoDestino_ControllingArea',
                            ValueListProperty: 'ControllingArea'
                        },
                        {
                            $Type: 'Common.ValueListParameterOut',
                            LocalDataProperty: 'centroCustoDestino_CostCenter',
                            ValueListProperty: 'CostCenter'
                        }
                    ]
                },
            },
	    );

    atribuicao @Common.Label: 'Atribuição';

    porcentagemRateio @Common.Label: 'Porcentagem do rateio';

}

annotate ConfigService.ConfigDestinos with @(
    UI: {
        LineItem: [
            {$Type: 'UI.DataField', Value: tipoOperacao_operacao},
            {$Type: 'UI.DataField', Value: contaDestino_ChartOfAccounts},
            {$Type: 'UI.DataField', Value: contaDestino_GLAccount},
            {$Type: 'UI.DataField', Value: centroCustoDestino_ControllingArea},
            {$Type: 'UI.DataField', Value: centroCustoDestino_CostCenter},
            {$Type: 'UI.DataField', Value: atribuicao},
            {$Type: 'UI.DataField', Value: porcentagemRateio},
        ],
        
        HeaderInfo: {
            TypeName: 'Destino', TypeNamePlural: 'Destinos',
            Title: { $Type: 'UI.DataField', Value: origem.descricao },
            Description: { Value: tipoOperacao_operacao }
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
			{$Type: 'UI.ReferenceFacet', Label: 'Detalhes', Target: '@UI.FieldGroup#Details'},
		],
		FieldGroup#Details: {
			Data: [
                {Value: tipoOperacao_operacao},
                {Value: contaDestino_ChartOfAccounts},
                {Value: contaDestino_GLAccount},
                {Value: centroCustoDestino_ControllingArea},
                {Value: centroCustoDestino_CostCenter},
                {Value: atribuicao},
                {Value: porcentagemRateio},
			]
		},
    }
);

annotate ConfigService.EtapasProcesso with @(
    UI: {
        LineItem: [
            {$Type: 'UI.DataField', Value: sequencia},
            {$Type: 'UI.DataField', Value: name},
            {$Type: 'UI.DataField', Value: descr},
            {$Type: 'UI.DataField', Value: createdAt},
            {$Type: 'UI.DataField', Value: createdBy},
            {$Type: 'UI.DataField', Value: modifiedAt},
            {$Type: 'UI.DataField', Value: modifiedBy},
        ],
        
        HeaderInfo: {
            TypeName: 'Etapa Processo', TypeNamePlural: 'Etapas Processo',
            Title: { $Type: 'UI.DataField', Value: sequencia },
            Description: { Value: name }
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
			{$Type: 'UI.ReferenceFacet', Label: 'Detalhes', Target: '@UI.FieldGroup#Details'},
		],
		FieldGroup#Details: {
			Data: [
                {Value: sequencia},
                {Value: name},
                {Value: descr},
			]
		},
    }
);