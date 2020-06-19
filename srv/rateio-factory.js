const RateioProcess = require("./rateio")

function createRateioProcess(ID, srv, req){
    return new RateioProcess(ID, srv, req)
}

module.exports = createRateioProcess