# Sử dụng Node.js phiên bản LTS (Long Term Support)
FROM node:18-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt các dependencies
# Sử dụng --production để không cài đặt devDependencies
# Sử dụng --no-cache để giảm kích thước image
RUN npm ci --production --no-cache

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Thiết lập biến môi trường
ENV NODE_ENV=production

# Khởi động ứng dụng
CMD ["node", "index.js"]