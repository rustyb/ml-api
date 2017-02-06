# MapLesotho - Area of Interest API

This is the backend API to power the #MapLesotho area of interest OSM statistics. Uses a PostGIS db contained an exported OSM area (Lesotho) and runs a number of queries against the DB to construct a mini report for the chosen AOI.

Kind of inspired by what the was done with the Red Cross' [OSM Stats](https://github.com/AmericanRedCross/osm-stats) and it's stats workers.

## Using

```
npm install
npm run migrations
DATABASE_URL=postgres://USERNAME:@localhost:5432/DBNAME npm run serve
```

The app will be served by default on localhost:4000.


## Getting started

A running Postgres database with PostGIS enabled. If your on OSX I recommend [Postgres App](https://postgresapp.com/). This comes with PostGIS already installed so no more setup on that front.

You will also need osm2pgsql installed

```
brew install osm2pgsql
```

Create the DB

```
CREATE DATABASE lesotho16;

-- add in the postgis and hstore for later
CREATE EXTENSION postgis;
CREATE EXTENSION hstore;
```

Download a country level [osm.pbf](http://download.geofabrik.de/africa/lesotho-latest.osm.pbf) file from Geofabrik or define an area in the [HOT export tool](http://export.posm.io/). Run the following command to import the area into the db. This can take a few minutes.

```
osm2pgsql \
    --create \
    --hstore-all \
    --hstore-add-index \
    --extra-attributes \
    --slim \
    --database=lesotho16 \
    -C 6144 \
    --number-processes 4 lesotho-latest.osm.pbf
```


# On a POSM

Run the following commands to get set up:

carto_user="${carto_user:-${osm_carto_pg_owner:-gis}}"
osm_carto_pg_dbname="${osm_carto_pg_dbname:-lesotho16}"

See the contents of [ml-install.sh](./ml-install.sh)