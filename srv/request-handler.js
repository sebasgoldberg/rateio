class RequestHandler{

    error(req, code, message, target){
        req.error(code, message, target)
    }

    getData(req){
        return req.data
    }

    getParams(req){
        return req.params
    }

}

module.exports = {
    RequestHandler,
}