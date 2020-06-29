soap = require('soap')

const Destination = require('./destination')

class JournalEntry{
    
    constructor(client){
        this.client = client
    }

    async post(args){
        return this.client.JournalEntryCreateRequestConfirmation_InAsync(args)
    }

}

/**
 * @returns {JournalEntry}
 */
async function createJournalEntry(){

    const url = `${ __dirname }/external/JOURNALENTRYCREATEREQUESTCONFI.wsdl`
    const destination = await (new Destination()).getDestination("soapJournalEntry")

    const client = await soap.createClientAsync(url,{endpoint: destination.url})
    client.setSecurity(new soap.BasicAuthSecurity(destination.username, destination.password));

    return new JournalEntry(client)

}

module.exports = createJournalEntry