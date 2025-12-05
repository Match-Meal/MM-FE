#!/bin/bash
exec > >(tee /home/ec2-user/deploy.log) 2>&1

echo ">>> 배포 시작: $(date)"

# 1. Docker Compose 설치 확인
if ! type docker-compose > /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 2. ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 026012384026.dkr.ecr.ap-northeast-2.amazonaws.com

# 3. 배포 폴더로 이동 (CodeDeploy가 파일을 복사해둔 위치)
cd /home/ec2-user/app

# 4. 실행
echo ">>> Docker Compose Pull & Up"
docker-compose pull
docker-compose up -d --force-recreate
docker image prune -f

echo ">>> 배포 완료"
