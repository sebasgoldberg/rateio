
sap.ui.controller("qintess.rateio.rateio-config.ext.controller.ListReportExt", {
    onExportar: function(oEvent) {
        const url = '/rateio_api/v2/config/Exportacao(0)/csv/$value'
        window.open(url,'_blank');
    },
})