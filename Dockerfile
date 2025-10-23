# 1. Node.js 기반 이미지 사용
FROM node:18-alpine

# 2. 앱 디렉터리 설정
WORKDIR /app

# 3. 종속성 복사 및 설치
COPY package*.json ./
RUN npm install

# 4. 소스 복사
COPY . .

# 5. MCP 서버 포트 지정 (Smithery에서 자동 감지 가능)
EXPOSE 3000

# 6. 서버 실행 명령
CMD ["node", "naver-mcp.js"]
