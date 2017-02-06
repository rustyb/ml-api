#!/bin/bash

carto_user="${carto_user:-${osm_carto_pg_owner:-gis}}"
osm_carto_pg_dbname="${osm_carto_pg_dbname:-lesotho16}"


su - postgres -c "createdb --owner='$carto_user' '$osm_carto_pg_dbname'"
su - postgres -c "psql --dbname='$osm_carto_pg_dbname' --command='CREATE EXTENSION postgis'"
su - postgres -c "psql --dbname='$osm_carto_pg_dbname' --command='CREATE EXTENSION hstore'"
su - postgres -c "psql --dbname='$osm_carto_pg_dbname' --command='CREATE EXTENSION pgcrypto'"

mkdir -p /opt/ml

nvm install 5
nvm use 5

cd /opt/ml/


# Downlaod our maplesotho area.

mkdir /opt/ml/temp && cd /opt/ml/temp
wget http://download.geofabrik.de/africa/lesotho-latest.osm.pbf

# import the lesotho area into the db
sudo -u osm osm2pgsql \
     --create \
     --hstore-all \
     --hstore-add-index \
     --extra-attributes \
     --slim \
     --database=lesotho16 \
     -C 6144 \
     --number-processes 4 lesotho-latest.osm.pbf

# Install and configure the API
# clone ml-api
cd /opt/ml
git clone https://github.com/rustyb/ml-api.git
cd ml-api
npm install

# setup the db of the app
DATABASE_URL=postgres://gis:openstreetmap@localhost/lesotho16 npm run migrations


cd /opt/ml
git clone https://github.com/rustyb/ml-analysis.git
cd ml-analysis

npm install
MAPBOX_TOKEN=pk.eyJ1IjoicnVzdHkiLCJhIjoib0FjUkJybyJ9.V9QoXck_1Z18MhpwyIE2Og API_URL=http://localhost:4000 npm run build

