class Documento{

    constructor(srv){
        this.srv = srv
        this.itens = []
    }

    setDadosCabecalho(dados) {
        // TODO Implementar
        this.header = dados
    }

    addItem(dados){
        // TODO Implementar
        this.itens.push(dados)
    }

    async post(){
        // TODO Implementar
    }

}

module.exports = Documento