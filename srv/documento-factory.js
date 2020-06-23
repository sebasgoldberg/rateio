const { Documento } = require("./documento")

function createDocumento(srv){
    return new Documento(srv)
}

module.exports = createDocumento