class Utils{

    /**
     * @returns {Date} timestamp em UTC.
     */
    timestamp(){
        return new Date()
    }

    /**
     * @returns {String} timestamp em UTC ISO string.
     */
    timestampISOString(){
        return this.timestamp().toISOString()
    }

}

const utils = new Utils()

module.exports = utils