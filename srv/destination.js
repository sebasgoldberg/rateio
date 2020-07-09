'use strict';
const xsenv = require('@sap/xsenv');
const cfenv = require('cfenv')
var rp = require('request-promise');

const appEnv = cfenv.getAppEnv();

const log = console

module.exports = class {

    constructor(){

        try {

            this.destination = xsenv.getServices({
                destination: {
                    tag: 'destination'
                }
            }).destination;                
    
        } catch (error) {
            console.error(`Erro ao tentar obter o serviço destination: ${String(console.error())}`);
        }

    }

    async createToken() {

        const options = {
            url: `${this.destination.url}/oauth/token`,
            method: 'POST',
            json: true,
            qs:{
                grant_type: 'client_credentials'
            },
            auth: {
                user: this.destination.clientid,
                pass: this.destination.clientsecret
            }
        }

        const body = await rp(options);

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

        let token = await this.createToken(this.destination.url, this.destination.clientid, this.destination.clientsecret);


        const result = await rp({
            url: `${this.destination.uri}/destination-configuration/v1/instanceDestinations/${destinationName}`,
            method: 'GET',
            auth: {
                bearer: token
            },
            json: true
        });

        const { URL, User, Password } = result

        return {
            url: URL,
            username: User,
            password: Password
        }
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
                Timeout: 900000, // 15 minutos
            });    

            log.debug(`Destination ${destinationName} criada com sucesso.`);
    
        } catch (e) {
            log.error(`Erro ao tentar criar o destination ${destinationName}: ${JSON.stringify(e)}`);
        }
    
    }
}