const cds = require('@sap/cds')
const {registerImpForInternalModels, registerImpForExternalModels} = require("./imp")

module.exports = cds.service.impl(async function () {

    await registerImpForInternalModels.bind(this)();
    await registerImpForExternalModels.bind(this)();

})
  