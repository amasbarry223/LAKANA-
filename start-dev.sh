#!/bin/bash
# Dev server keep-alive wrapper
cd /home/z/my-project
while true; do
  /home/z/my-project/node_modules/.bin/next dev -p 3000 > /home/z/my-project/dev.log 2>&1
  echo "[wrapper] next dev exited with code $?, restarting in 3s..." >> /home/z/my-project/dev.log
  sleep 3
done
