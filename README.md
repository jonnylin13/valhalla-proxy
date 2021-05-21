[![ci tests](https://github.com/gis-ops/docker-valhalla/actions/workflows/tests.yml/badge.svg)](https://github.com/gis-ops/docker-valhalla/actions/workflows/tests.yml)

# Valhalla Docker image by GIS • OPS & Near (UM)

A hyper-flexible Docker image for the excellent [Valhalla](https://github.com/valhalla/valhalla) routing framework.

```bash
docker build . -t jonnylin13/valhalla-proxy # Or specify your own image name
docker run -dt --name valhalla-proxy -p 8002:8002 -p 8003:8003 -v $PWD/custom_files:/custom_files jonnylin13/valhalla-proxy
```

This image aims at being user-friendly and most efficient with your time and resources. Once built, you can easily change Valhalla's configuration, the underlying OSM data graphs are built from, accompanying data (like Admin Areas, elevation tiles) or even pre-built graph tiles. Upon `docker restart <container>` those changes are taken into account via **hashed files**, and, if necessary, new graph tiles will be built automatically.

It also provides a proxy API layer using Fastify and Node.js that sits concurrent with Valhalla, mainly for batching multiple requests or performing logic separate from the Valhalla service.

## Features

-   Easily switch graphs by mapping different volumes to containers.
-   Stores all relevant data (tiles, config, admin & timezone DBs, elevation) in the mapped volume.
-   Load and build from **multiple URLs** pointing to valid pbf files.
-   Load local data through volume mapping.
-   **Supports auto rebuild** on OSM file changes through hash mapping.

## Environment variables

This image respects the following custom environment variables to be passed during container startup. Note, all variables have a default:

- `tile_urls`: Add as many (space-separated) URLs as you like, e.g. https://download.geofabrik.de/europe/andorra-latest.osm.pbf http://download.geofabrik.de/europe/faroe-islands-latest.osm.pbf. Default `""`.
- `min_x`: Minimum longitude for elevation tiles, in decimal WGS84, e.g. 18.5
- `min_y`: Minimum latitude for elevation tiles, in decimal WGS84, e.g. 18.5
- `max_x`: Maximum longitude for elevation tiles, in decimal WGS84, e.g. 18.5
- `max_y`: Maximum latitude for elevation tiles, in decimal WGS84, e.g. 18.5
- `use_tiles_ignore_pbf`: `True` uses a local tile.tar file and skips building. Default `False`.
- `force_rebuild`: `True` forces a rebuild of the routing tiles. Default `False`.
- `build_elevation`: `True` builds elevation for the set coordinates. `Force` will do the same, but first delete any existing elevation tiles. Default `False`.
- `build_admins`: `True` builds the admin db. `Force` will do the same, but first delete the existing db. Default `False`.
- `build_time_zones`: `True` builds the timezone db. `Force` will do the same, but first delete the existing db. Default `False`.
- `server_threads`: How many threads `valhalla_service` will run with. Default is 1 thread less than the value of `nproc`.

## Container recipes

For the following instructions to work, you'll need to have the image locally available already, either from [Docker Hub](https://hub.docker.com/repository/docker/gisops/valhalla) or from [local](#build-the-image).

Start a background container from that image:

```bash
docker run -dt -v $PWD/custom_files:/custom_files -p 8002:8002 --name valhalla gisops/valhalla:latest
```

The important part here is, that you map a volume from your host machine to the container's **`/custom_files`**. The container will dump all relevant Valhalla files to that directory.

At this point Valhalla is running, but there is no graph tiles yet. Follow the steps below to customize your Valhalla instance in a heartbeat.

> Note, alternatively you could create `custom_files` on your host before starting the container with all necessary files you want to be respected, e.g. the OSM PBF files.

#### Build Valhalla with arbitrary OSM data

Just dump **single or multiple** OSM PBF files to your mapped `custom_files` directory, restart the container and Valhalla will start building the graphs:

```bash
cd custom_files
# Download Andorra & Faroe Islands
wget http://download.geofabrik.de/europe/faroe-islands-latest.osm.pbf http://download.geofabrik.de/europe/andorra-latest.osm.pbf
docker restart valhalla
```

If you change the PBF files by either adding new ones or deleting any, Valhalla will build new tiles on the next restart unless told not to (e.g. setting `use_tiles_ignore_pbf=True`).

#### Customize Valhalla configuration

If you need to customize Valhalla's configuration to e.g. increase the allowed maximum distance for the `/route` POST endpoint, just edit `custom_files/valhalla.json` and restart the container. It won't rebuild the tiles in this case, unless you tell it to do so via environment variables.

#### Run Valhalla with pre-built tiles

In the case where you have a pre-built `valhalla_tiles.tar` package from another Valhalla instance, you can also dump that to `custom_files/` and they're loaded upon container restart if you set the following environment variables: `use_tiles_ignore_pbf=True`, `force_rebuild=False`. Also, don't forget to set the md5 sum for your `valhalla_tiles.tar` in `.file_hashes.txt`.

## Tests

If you want to verify that the image is working correctly, there's a small test script in `./tests`. **Note**, it requires `sudo` since it touches a few things generated by the container's `root` user (no worries, it won't break your system):

```shell script
sudo ./tests/test.sh
```

## Acknowledgements

This project was first introduced by [MichaelsJP](https://github.com/MichaelsJP).
The second version was created by [GISOPS](https://github.com/gis-ops).
The third version which introduced a proxy API layer was created by [jonnylin13](https://github.com/jonnylin13).
