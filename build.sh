#!/usr/bin/env bash
CDS_ENV=production cds build/all && mkdir gen/srv/external && cp srv/external/JOURNALENTRYCREATEREQUESTCONFI.wsdl gen/srv/external/ && cd app && npm run build