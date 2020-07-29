sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
], function(Controller, MessageToast, MessageBox) {
	"use strict";

	return Controller.extend("qintess.rateio.rateio-import.ext.controller.Import", {

		handleUploadComplete: function(oEvent) {
			var status = oEvent.getParameter("status");
            if (status == 204) {
                MessageToast.show("Upload do arquivo realizado com sucesso");                
            } else {
                var responseRaw = oEvent.getParameter("responseRaw");
                MessageBox.show(
                    responseRaw, {
                        icon: MessageBox.Icon.ERROR,
                        title: "Erro ao fazer o upload",
                    }
                );
            }

		},

		handleUploadPress: function() {

            var oFileUploader = this.byId("fileUploader");

            if (!oFileUploader.getEnabled())
                return;

            oFileUploader.destroyHeaderParameters();
    
            var csrfToken = this.getView().getModel().getHeaders()['x-csrf-token'];

            var headerParma = new sap.ui.unified.FileUploaderParameter();
            headerParma.setName('x-csrf-token');
            headerParma.setValue(csrfToken)
            oFileUploader.addHeaderParameter(headerParma);

            var headerParma2 = new sap.ui.unified.FileUploaderParameter();
            headerParma2.setName('Content-Type');
            headerParma2.setValue('text/csv')
            oFileUploader.addHeaderParameter(headerParma2);

            oFileUploader.setSendXHR(true);
            oFileUploader.setUseMultipart(false);

            oFileUploader.upload();

		}

    });
});