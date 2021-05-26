# Take the official Valhalla runner image
# * Remove a few superfluous things and
# * Create a new runner image from ubuntu:20.04 with the previous runner's artifacts

FROM jonnylin13/node-valhalla:run-3.1.1 as builder
LABEL Nils Nolde <nils@gis-ops.com>
LABEL Jonny Lin <jonnylin@um.co>

# Remove some stuff from the original image
RUN cd /usr/local/bin && \
  preserve="valhalla_service valhalla_build_tiles valhalla_build_config valhalla_build_admins valhalla_build_timezones valhalla_build_elevation valhalla_ways_to_edges" && \
  mv $preserve .. && \
  for f in valhalla*; do rm $f; done && \
  cd .. && mv $preserve ./bin

FROM ubuntu:20.04 as runner
LABEL Nils Nolde <nils@gis-ops.com>
LABEL Jonny Lin <jonnylin@um.co>

RUN apt-get update > /dev/null && \
    export DEBIAN_FRONTEND=noninteractive && \
    apt-get install -y libboost-program-options1.71.0 libluajit-5.1-2 \
      libzmq5 libczmq4 spatialite-bin libprotobuf-lite17 \
      libsqlite3-0 libsqlite3-mod-spatialite libgeos-3.8.0 libcurl4 \
      python3.8-minimal curl unzip parallel jq spatialite-bin nodejs npm > /dev/null && \
    ln -s /usr/bin/python3.8 /usr/bin/python && \
    ln -s /usr/bin/python3.8 /usr/bin/python3

# Install nvm
# Replace shell with bash so we can source files

RUN mkdir -p /usr/local/nvm

ENV NVM_DIR      /usr/local/nvm
ENV NODE_VERSION 10.22.0
ENV NODE_PATH    $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH         $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

RUN rm /bin/sh && ln -s /bin/bash /bin/sh && \
    curl https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash && \
    . $NVM_DIR/nvm.sh && \
    nvm install $NODE_VERSION && \
    nvm use alias default $NODE_VERSION && \
    nvm use default

COPY --from=builder /usr/local /usr/local
COPY --from=builder /usr/bin/prime_* /usr/bin/
COPY --from=builder /usr/lib/x86_64-linux-gnu/libprime* /usr/lib/x86_64-linux-gnu/

ENV LD_LIBRARY_PATH="/usr/local/lib:${LD_LIBRARY_PATH}"

COPY scripts/runtime/. /valhalla/scripts

# Install app
RUN mkdir -p /valhalla-proxy
COPY . ./valhalla-proxy
RUN cd /valhalla-proxy && npm install && cd ..

# Remove unnecessary scripts
# RUN rm -rf /valhalla-proxy/custom_files && rm -rf /valhalla-proxy/scripts

# Expose the necessary ports
EXPOSE 8002
EXPOSE 8003
CMD /valhalla/scripts/run.sh
