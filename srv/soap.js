soap = require('soap')

// TODO Modificar obtenção do destination
destination = require('../destinations.json')[1]

class JournalEntry{
    
    constructor(client){
        this.client = client
        client.setSecurity(new soap.BasicAuthSecurity(destination.username, destination.password));
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
    const client = await soap.createClientAsync(url,{endpoint: destination.url})
    return new JournalEntry(client)
}

module.exports = createJournalEntry