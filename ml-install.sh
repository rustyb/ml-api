#!/bin/bash

carto_user="${carto_user:-${osm_carto_pg_owner:-gis}}"
osm_carto_pg_dbname="${osm_carto_pg_dbname:-lesotho16}"


su - postgres -c "createdb --owner='$carto_user' '$osm_carto_pg_dbname'"
su - postgres -c "psql --dbname='$osm_carto_pg_dbname' --command='CREATE EXTENSION postgis'"
su - postgres -c "psql --dbname='$osm_carto_pg_dbname' --command='CREATE EXTENSION hstore'"

mkdir -p /opt/ml

nvm install 5
nvm use 5

cd /opt/ml
# clone ml-api
git clone https://github.com/rustyb/ml-api.git
git clone https://github.com/rustyb/ml-analysis.git