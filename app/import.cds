using { qintess.rateio as rateio } from '../db/schema';

annotate ConfigService.OperacaoImportacao with {
    operacao @Common.Label: 'Operação';
}

annotate ConfigService.Importacoes with{

    descricao @Common.Label: 'Descrição';

    operacao @(
		Common: {
			Label: 'Operação',
			FieldControl: #Mandatory,
		},
        // TODO Deveria trazer as descrições.
        sap.value.list: 'fixed-values',
	);

    status_status @(
		Common: {
			Label: 'Status',
			FieldControl: #Mandatory,
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


annotate ConfigService.Importacoes with @(
    UI: {

        SelectionFields: [ 
            status_status,
            operacao_operacao,
            modifiedAt,
            modifiedBy,
            ],

        PresentationVariant:{
            SortOrder:[
                {Property: modifiedAt, Descending: true},
            ]
        },

        LineItem: [
            {$Type: 'UI.DataField', Value: status_status, Criticality: statusCriticality },
            {$Type: 'UI.DataField', Value: descricao},
            {$Type: 'UI.DataField', Value: operacao_operacao},
            {$Type: 'UI.DataField', Value: modifiedAt},
            {$Type: 'UI.DataField', Value: modifiedBy},
            {$Type: 'UI.DataFieldForAction', Label: 'Importar', Action: 'ConfigService/Importacoes_importar', Inline: true},
        ],

        Identification:[ //![@UI.Importance]: #High,
            {$Type: 'UI.DataFieldForAction', Label: 'Importar', Action: 'ConfigService/Importacoes_importar' },
        ],

        HeaderInfo: {
            TypeName: 'Importação', TypeNamePlural: 'Importações',
            // Title: { $Type: 'UI.DataField', Value: message },
            // Description: { Value: ID }
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
            {$Type: 'UI.ReferenceFacet', Label: 'Log Execução', Target: 'logs/@UI.LineItem'},
		],
		FieldGroup#Detalhes: {
			Data: [
                {Value: descricao },
                {Value: operacao_operacao },
			]
		},
    }
);

annotate ConfigService.ImportacoesLogs with {

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

annotate ConfigService.ImportacoesLogs with @(
    UI: {

        SelectionFields: [ 
            timestamp,
            message,
            ],

        PresentationVariant:{
            SortOrder:[
                {Property: timestamp, Descending: false}
            ]
        },

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
