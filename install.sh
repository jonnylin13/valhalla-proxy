docker build -t jonnylin13/valhalla-proxy .
# docker run -dt --name valhalla-proxy -p 8002:8002 -p 8003:8003 -v $PWD/custom_files:/custom_files jonnylin13/valhalla-proxy