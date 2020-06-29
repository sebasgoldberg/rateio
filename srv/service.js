const {registerImpForInternalModels, registerImpForExternalModels} = require("./imp")
const Destination = require('./destination')

module.exports = cds.service.impl(async function () {

    let destination = new Destination();
    // TODO Utilizar nome do destination no app module
    destination.addThis('rateio_api');
    
    await registerImpForInternalModels.bind(this)();
    await registerImpForExternalModels.bind(this)();

})
  