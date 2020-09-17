const { Documento, DocumentoEstorno } = require("./documento")

function createDocumento(srv){
    return new Documento(srv)
}

function createDocumentoEstorno(srv){
    return new DocumentoEstorno(srv)
}

module.exports = { 
    createDocumento,
    createDocumentoEstorno,
}