# Node.js 공식 이미지 사용
FROM node:18-alpine

# 앱 디렉터리 생성
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 앱이 사용하는 포트
EXPOSE 3000

# 서버 실행
CMD ["npm", "start"]
