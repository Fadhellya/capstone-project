// Jenkinsfile (Declarative Pipeline)

pipeline {
    // Jalankan pipeline ini di dalam sebuah kontainer Docker sementara.
    agent {
        docker {
            // Gunakan image yang sudah memiliki 'docker compose'
            image 'docker/compose:latest'
            
            // Ini adalah bagian paling penting:
            // 1. Mount docker.sock agar bisa menjalankan perintah docker.
            // 2. Mount workspace Jenkins dari host ke dalam kontainer agent
            //    di path yang SAMA. Ini menyelesaikan masalah path.
            args '-v /var/run/docker.sock:/var/run/docker.sock -v ${WORKSPACE}:${WORKSPACE}'
        }
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        // Ganti '988' dengan ID grup Docker Anda jika berbeda.
        DOCKER_GROUP_ID = '988'
        COMPOSE_PROJECT_NAME = 'capstone-project'
    }

    stages {
        stage('Checkout Code') {
            steps {
                // Langkah ini sekarang berjalan di dalam kontainer agent
                checkout scm
            }
        }

        stage('Build and Run Retraining') {
            steps {
                echo "Workspace is at: ${env.WORKSPACE}"
                echo "Running docker compose from inside a docker agent..."
                
                // Perintah ini sekarang akan bekerja karena path './data' di docker-compose.yaml
                // akan diresolusi dengan benar relatif terhadap workspace,
                // yang mana path-nya sama di host dan di agent.
                sh 'docker compose --project-name ${COMPOSE_PROJECT_NAME} run --build --rm model_trainer'
            }
        }
    }

    post {
        always {
            echo 'Pipeline retraining selesai.'
        }
    }
}
