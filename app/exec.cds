// using { qintess.rateio as rateio } from '../db/schema';
using { ConfigService } from '../srv/service';

annotate ConfigService.Execucoes with {


    descricao @(
		Common: {
			Label: 'Descrição',
        }
    );

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

    periodo @(
		Common: {
			Label: 'Periodo',
        }
    );

    ano @(
		Common: {
			Label: 'Ano',
        }
    );

    dataConfiguracoes @(
		Common: {
			Label: 'Data configurações',
        }
    );

    status_status @(
		Common: {
			Label: 'Status',
            ValueList: {
                Label: 'Status',
                CollectionPath: 'StatusExecucoes',
                SearchSupported: true,
                Parameters: [
                    {
                        $Type: 'Common.ValueListParameterInOut',
                        LocalDataProperty: 'status_status',
                        ValueListProperty: 'status'
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
}

annotate ConfigService.Execucoes with @(
    UI: {

        SelectionFields: [ 
            descricao,
            etapaProcesso_sequencia,
            periodo,
            ano,
            dataConfiguracoes,
            status_status,
            ],

        LineItem: [
            {$Type: 'UI.DataField', Value: descricao,},
            {$Type: 'UI.DataField', Value: etapaProcesso_sequencia,},
            {$Type: 'UI.DataField', Value: periodo,},
            {$Type: 'UI.DataField', Value: ano,},
            {$Type: 'UI.DataField', Value: dataConfiguracoes,},
            {$Type: 'UI.DataField', Value: status_status, Criticality: statusCriticality },
            {$Type: 'UI.DataField', Value: createdAt},
            {$Type: 'UI.DataField', Value: createdBy},
            {$Type: 'UI.DataField', Value: modifiedAt},
            {$Type: 'UI.DataField', Value: modifiedBy},
            {$Type: 'UI.DataFieldForAction', Label: 'Executar', Action: 'ConfigService/Execucoes_executar', Determining: true },
        ],

        Identification:[ //![@UI.Importance]: #High,
            {$Type: 'UI.DataFieldForAction', Label: 'Executar', Action: 'ConfigService/Execucoes_executar' },
        ],

        HeaderInfo: {
            TypeName: 'Execução', TypeNamePlural: 'Execuções',
            Title: { $Type: 'UI.DataField', Value: descricao },
            Description: { Value: ID }
        },


        HeaderFacets: [
			{$Type: 'UI.ReferenceFacet', Label: 'Criado', Target: '@UI.FieldGroup#Created'},
			{$Type: 'UI.ReferenceFacet', Label: 'Modificado', Target: '@UI.FieldGroup#Modified'},
			{$Type: 'UI.ReferenceFacet', Label: 'Status', Target: '@UI.FieldGroup#Status'},
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
		FieldGroup#Status: {
			Data: [
                {Value: status_status, Criticality: statusCriticality},
			]
		},
        Facets: [
			{$Type: 'UI.ReferenceFacet', Label: 'Detalhes', Target: '@UI.FieldGroup#Detalhes'},
			{$Type: 'UI.ReferenceFacet', Label: 'Itens', Target: 'itensExecucoes/@UI.LineItem'},
			{$Type: 'UI.ReferenceFacet', Label: 'Log Execução', Target: 'logs/@UI.LineItem'},
		],
		FieldGroup#Detalhes: {
			Data: [
                {Value: descricao,},
                {Value: etapaProcesso_sequencia,},
                {Value: periodo,},
                {Value: ano,},
                {Value: dataConfiguracoes,},
                {Value: status_status,},
			]
		},
    }
);

annotate ConfigService.ExecucoesLogs with {

    timestamp @(
		Common: {
			Label: 'Data',
        }
    );

    message @(
		Common: {
			Label: 'Mensagem',
        }
    );

}

annotate ConfigService.ExecucoesLogs with @(
    UI: {

        SelectionFields: [ 
            timestamp,
            message,
            ],

        LineItem: [
            {$Type: 'UI.DataField', Value: timestamp,},
            {$Type: 'UI.DataField', Value: message, Criticality: messageType },
        ],

        HeaderInfo: {
            TypeName: 'Log Execução', TypeNamePlural: 'Logs Execuções',
            Title: { $Type: 'UI.DataField', Value: message },
            Description: { Value: ID }
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
		],
		FieldGroup#Detalhes: {
			Data: [
                {Value: timestamp,},
                {Value: message, Criticality: messageType },
			]
		},
    }
);

annotate ConfigService.ItensExecucoesLogs with {

    timestamp @(
		Common: {
			Label: 'Data',
        }
    );

    message @(
		Common: {
			Label: 'Mensagem',
        }
    );

}

annotate ConfigService.ItensExecucoesLogs with @(
    UI: {

        SelectionFields: [ 
            timestamp,
            message,
            ],

        LineItem: [
            {$Type: 'UI.DataField', Value: timestamp,},
            {$Type: 'UI.DataField', Value: message, Criticality: messageType },
        ],

        HeaderInfo: {
            TypeName: 'Log Execução', TypeNamePlural: 'Logs Execuções',
            Title: { $Type: 'UI.DataField', Value: message },
            Description: { Value: ID }
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
		],
		FieldGroup#Detalhes: {
			Data: [
                {Value: timestamp,},
                {Value: message, Criticality: messageType },
			]
		},
    }
);

annotate ConfigService.Documentos with {

    CompanyCode @(
		Common: {
			Label: 'Empresa',
        }
    );

    AccountingDocument @(
		Common: {
			Label: 'Num. Documento',
        }
    );

    FiscalYear @(
		Common: {
			Label: 'Exercicio',
        }
    );

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

}

annotate ConfigService.Documentos with @(
    UI: {

        SelectionFields: [ 
            CompanyCode,
            AccountingDocument,
            FiscalYear,
            moeda,
            cancelado
            ],

        LineItem: [
            {$Type: 'UI.DataField', Value: CompanyCode },
            {$Type: 'UI.DataField', Value: AccountingDocument },
            {$Type: 'UI.DataField', Value: FiscalYear },
            {$Type: 'UI.DataField', Value: moeda },
            {$Type: 'UI.DataField', Value: cancelado, Criticality: canceladoCriticality  },
            {$Type: 'UI.DataFieldForAction', Label: 'Cancelar', Action: 'ConfigService/Documentos_cancelar', Inline: true},
            {$Type: 'UI.DataFieldForAction', Label: 'Anular Cancelamento', Action: 'ConfigService/Documentos_anularCancelamento', Inline: true},
        ],

        // Identification:[ //![@UI.Importance]: #High,
        //     {$Type: 'UI.DataFieldForAction', Label: 'Cancelar', Action: 'ConfigService/Documentos_cancelar'},
        //     {$Type: 'UI.DataFieldForAction', Label: 'Anular Cancelamento', Action: 'ConfigService/Documentos_anularCancelamento'},
        // ],

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
            {$Type: 'UI.ReferenceFacet', Label: 'Configuração Origem', Target: 'itemExecutado/configuracaoOrigem/@UI.FieldGroup#Origem'},
		],
		FieldGroup#Detalhes: {
			Data: [
                {Value: CompanyCode },
                {Value: AccountingDocument },
                {Value: FiscalYear },
                {Value: moeda },
                {Value: cancelado, Criticality: canceladoCriticality },
			]
		},
    }
);

annotate ConfigService.ItensExecucoes with {

    status_status @(
		Common: {
			Label: 'Status',
            ValueList: {
                Label: 'Status',
                CollectionPath: 'StatusExecucoes',
                SearchSupported: true,
                Parameters: [
                    {
                        $Type: 'Common.ValueListParameterInOut',
                        LocalDataProperty: 'status_status',
                        ValueListProperty: 'status'
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

};


annotate ConfigService.ItensExecucoes with @(
    UI: {

        SelectionFields: [
            status_status,
            configuracaoOrigem.etapaProcesso_sequencia,
            configuracaoOrigem.empresa_CompanyCode,
            configuracaoOrigem.contaOrigem_ChartOfAccounts,
            configuracaoOrigem.contaOrigem_GLAccount,
            configuracaoOrigem.centroCustoOrigem_ControllingArea,
            configuracaoOrigem.centroCustoOrigem_CostCenter
            ],

        LineItem: [
            {$Type: 'UI.DataField', Value: status_status, Criticality: statusCriticality },
            {$Type: 'UI.DataField', Value: configuracaoOrigem.descricao},
            {$Type: 'UI.DataField', Value: configuracaoOrigem.etapaProcesso_sequencia},
            {$Type: 'UI.DataField', Value: configuracaoOrigem.empresa_CompanyCode},
            {$Type: 'UI.DataField', Value: configuracaoOrigem.contaOrigem_ChartOfAccounts},
            {$Type: 'UI.DataField', Value: configuracaoOrigem.contaOrigem_GLAccount},
            {$Type: 'UI.DataField', Value: configuracaoOrigem.centroCustoOrigem_ControllingArea},
            {$Type: 'UI.DataField', Value: configuracaoOrigem.centroCustoOrigem_CostCente},
        ],

        HeaderInfo: {
            TypeName: 'Item Execução', TypeNamePlural: 'Itens Execuções',
            Title: { $Type: 'UI.DataField', Value: configuracaoOrigem.descricao },
            Description: { Value: configuracaoOrigem.ID }
        },

        HeaderFacets: [
			{$Type: 'UI.ReferenceFacet', Label: 'Criado', Target: '@UI.FieldGroup#Created'},
			{$Type: 'UI.ReferenceFacet', Label: 'Modificado', Target: '@UI.FieldGroup#Modified'},
            {$Type: 'UI.ReferenceFacet', Label: 'Status', Target: '@UI.FieldGroup#Status'},
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
        FieldGroup#Status: {
			Data: [
                {Value: status_status, Criticality: statusCriticality},
			]
		},
        Facets: [
			{$Type: 'UI.ReferenceFacet', Label: 'Configuração Origem', Target: 'configuracaoOrigem/@UI.FieldGroup#Origem'},
            {$Type: 'UI.ReferenceFacet', Label: 'Documentos', Target: 'documentosGerados/@UI.LineItem'},
            {$Type: 'UI.ReferenceFacet', Label: 'Logs', Target: 'logs/@UI.LineItem'},
		],
    }
);
