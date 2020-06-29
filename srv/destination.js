'use strict';
const xsenv = require('@sap/xsenv');
const cfenv = require('cfenv')
var rp = require('request-promise');

const appEnv = cfenv.getAppEnv();

module.exports = class {

    constructor(){

        if (appEnv.isLocal)
            return

        this.destination = xsenv.getServices({
            destination: {
                tag: 'destination'
            }
        }).destination;                

    }

    async createToken() {

        let body = await rp({

            url: `${this.destination.url}/oauth/token`,
            method: 'POST',
            json: true,
            form: {
                grant_type: 'client_credentials',
                client_id: this.destination.clientid
            },
            auth: {
                user: this.destination.clientid,
                pass: this.destination.clientsecret
            }
        });

        return body.access_token;
    }

    async getDestination(destinationName) {

        // First we try at environment level.
        if (process.env.destinations)
            try {
                const destinations = JSON.parse(process.env.destinations)
                for (const destination of destinations)
                    if (destination.name == destinationName)
                        return destination
            } catch (error) {
                console.error(error.toString());
            }

        // If fails, we try at service level.

        if (appEnv.isLocal)
            return

        let token = await this.createToken(this.destination.url, this.destination.clientid, this.destination.clientsecret);

        return await rp({
            url: `${this.destination.uri}/destination-configuration/v1/instanceDestinations/${destinationName}`,
            method: 'GET',
            auth: {
                bearer: token
            },
            json: true
        });
    }
     
    async deleteDestination(destinationName) {

        if (appEnv.isLocal)
            return

        let token = await this.createToken(this.destination.url, this.destination.clientid, this.destination.clientsecret);

        var options = {
            method: 'DELETE',
            uri: `${this.destination.uri}/destination-configuration/v1/instanceDestinations/${destinationName}`,
            auth: {
                bearer: token
            },
            json: true
        };
    
        await rp(options);
        
    }

    async createDestination(body) {

        if (appEnv.isLocal)
            return

        let token = await this.createToken(this.destination.url, this.destination.clientid, this.destination.clientsecret);

        var options = {
            method: 'POST',
            uri: `${this.destination.uri}/destination-configuration/v1/instanceDestinations`,
            body: body,
            auth: {
                bearer: token
            },
            json: true
        };
    
        await rp(options);
    
        
    }
    
    async addThis(destinationName){

        if (appEnv.isLocal)
            return

        try {
            await this.deleteDestination(destinationName);
            log.debug(`Destination ${destinationName} eliminada com sucesso.`);
        } catch (e) {
            log.error(`Erro ao tentar eliminar o destination ${destinationName}: ${JSON.stringify(e)}`);
        }
    
        try {

            await this.createDestination({
                Name: destinationName,
                Type: "HTTP",
                URL: appEnv.url,
                Authentication: "NoAuthentication",
                ProxyType: "Internet",
                ForwardAuthToken: true,
            });    

            log.debug(`Destination ${destinationName} criada com sucesso.`);
    
        } catch (e) {
            log.error(`Erro ao tentar criar o destination ${destinationName}: ${JSON.stringify(e)}`);
        }
    
    }
}