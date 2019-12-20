pipeline {
    agent any

    stages {
        stage('Dependencies') {
            steps {
                echo 'Installing Dependencies...'
                nodejs(nodeJSInstallationName: 'Node 12.x') {
                    sh 'yarn install'
                }
            }
        }
        stage('Stylecheck') {
            steps {
                echo 'Checking Style...'
                nodejs(nodeJSInstallationName: 'Node 12.x') {
                    sh 'tslint "src/**/*.ts"'
                }
            }
        }
        stage('Build') {
            steps {
                echo 'Building...'
                nodejs(nodeJSInstallationName: 'Node 12.x') {
                    sh 'gulp'
                }
            }
        }
    }
}