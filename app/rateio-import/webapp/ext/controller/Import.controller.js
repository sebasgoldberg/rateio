sap.ui.define([
	"sap/ui/core/mvc/Controller",
], function(Controller, formatter) {
	"use strict";

	return Controller.extend("qintess.rateio.rateio-import.ext.controller.Import", {

		handleUploadComplete: function(oEvent) {
			var sResponse = oEvent.getParameter("response");
			if (sResponse) {
				var sMsg = "";
				var m = /^\[(\d\d\d)\]:(.*)$/.exec(sResponse);
				if (m[1] == "200") {
					sMsg = "Return Code: " + m[1] + "\n" + m[2] + "(Upload Success)";
					oEvent.getSource().setValue("");
				} else {
					sMsg = "Return Code: " + m[1] + "\n" + m[2] + "(Upload Error)";
				}

				MessageToast.show(sMsg);
			}
		},

		handleUploadPress: function() {

            var oFileUploader = this.byId("fileUploader");

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