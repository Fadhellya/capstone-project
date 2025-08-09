// Jenkinsfile (Declarative Pipeline)

pipeline {
    // Menentukan di mana pipeline ini akan berjalan. 'any' berarti di agent Jenkins manapun.
    agent any

    // Opsi untuk pipeline
    options {
        // Menetapkan batas waktu eksekusi pipeline selama 30 menit.
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        // Tahap 1: Mengambil kode terbaru dari Git
        stage('Checkout Code') {
            steps {
                // 'checkout scm' adalah langkah standar Jenkins untuk melakukan git clone/pull.
                checkout scm
            }
        }

        // Tahap 2: Membangun ulang image Docker untuk trainer
        // Ini memastikan jika ada perubahan pada Dockerfile atau skrip,
        // image yang digunakan selalu yang terbaru.
        stage('Build Trainer Image') {
            steps {
                echo 'Membangun ulang image untuk model_trainer...'
                // Menjalankan perintah build dari docker-compose
                sh 'docker-compose build model_trainer'
            }
        }

        // Tahap 3: Menjalankan proses training
        stage('Run Model Retraining') {
            steps {
                echo 'Memulai proses training ulang model...'
                // Menjalankan service model_trainer sebagai one-off task.
                // Output dari training akan muncul di log Jenkins.
                sh 'docker-compose run --rm model_trainer'
            }
        }
    }

    // Bagian 'post' akan selalu dijalankan setelah semua tahap selesai
    post {
        // 'always' berarti akan selalu dijalankan, baik pipeline berhasil maupun gagal.
        always {
            echo 'Pipeline retraining selesai.'
            // Anda bisa menambahkan langkah notifikasi di sini,
            // misalnya mengirim email atau pesan ke Slack.
        }
    }
}
