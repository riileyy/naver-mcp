# Node.js 18 알파인 이미지 사용
FROM node:18-alpine

# 작업 디렉터리
WORKDIR /app

# package.json 및 package-lock.json 설치
COPY package*.json ./
RUN npm install

# 소스 전체 복사
COPY . .

# 서버 포트
EXPOSE 3000

# 서버 실행
CMD ["node", "index.js"]
