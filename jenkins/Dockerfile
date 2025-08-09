FROM jenkins/jenkins:lts-jdk17

# Ganti ke user root untuk menginstal paket
USER root

# Install dependensi dan Docker CLI
RUN apt-get update && apt-get install -y lsb-release
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
RUN echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
RUN apt-get update && apt-get install -y docker-ce-cli

# Install Docker Compose v2 (plugin)
RUN DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
RUN mkdir -p $DOCKER_CONFIG/cli-plugins
RUN curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
RUN chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

# Ganti kembali ke user jenkins
USER jenkins
