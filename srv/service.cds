using { qintess.rateio as rateio } from '../db/schema';

service ConfigService @(requires_:'config') {
    // Serviços externos
    @readonly
    entity Empresas as projection on rateio.Empresas;
    @readonly
    entity Contas as projection on rateio.Contas;
    @readonly
    entity CentrosCusto as projection on rateio.CentrosCusto;

    entity EtapasProcesso as projection on rateio.EtapaProcesso;
    entity ConfigOrigens as projection on rateio.ConfigOrigens;
    entity ConfigDestinos as projection on rateio.ConfigDestinos;
}
