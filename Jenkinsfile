pipeline {
    agent {
        dockerfile {
            dir 'jenkins'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        DOCKER_GROUP_ID = '988'
        COMPOSE_PROJECT_NAME = 'capstone-project'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build and Run Retraining') {
            steps {
                echo "Workspace is at: ${env.WORKSPACE}"
                echo "Running docker compose for project '${env.COMPOSE_PROJECT_NAME}'..."
                echo "Building the model trainer image..."
                sh 'docker compose build model_trainer'
                
                echo "Running the model training..."
                sh 'docker compose run --rm model_trainer'
            }
        }

    }

    post {
        always {
            echo 'Pipeline retraining selesai.'
        }
    }
}
