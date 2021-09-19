#!/bin/bash

# docker create --security-opt seccomp:unconfined --tty --mount type=bind,source="/opt/cuberite",target="/opt/cuberite" --name="cuberite" -p 8080:8080 -p 25565:25565 beevelop/cuberite

# old_id=$(ssh root@192.168.1.123 cat /opt/cuberite/devin-docker-id)
old_id=e0d847f35d4c37afb876b1708a432b7238c04dad99c74006f74c6857f1329455
new_id=d30ba20d5cb57b76cb8e3f8c73474ecb0869583e9bc4af8721b5080435fff865

echo '+++ dumping service state into checkpoint +++'

ssh root@192.168.1.123 'rm -rf /var/lib/docker/containers/$(cat /opt/cuberite/devin-docker-id)/checkpoints && docker -D checkpoint create --leave-running cuberite checkpoint' && \
    echo '+++ copying checkpoint +++' && \
    rsync -avz root@192.168.1.123:/var/lib/docker/containers/${old_id}/checkpoints \
    /var/lib/docker/containers/${new_id}/ && \
    rsync -avz --delete-after root@192.168.1.123:/opt/cuberite /opt/ 

echo '+++ starting service from checkpoint +++'

docker -D start --checkpoint=checkpoint cuberite && \
ssh root@192.168.1.123 'docker -D stop cuberite'
