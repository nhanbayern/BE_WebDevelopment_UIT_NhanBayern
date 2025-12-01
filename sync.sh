#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # no color

echo -e "${BLUE}🚀 REAL-TIME SYNC STARTED — Watching for file changes...${NC}"
echo -e "${BLUE}📂 Local folder: $(pwd)${NC}"
echo ""

while true; do
  # Bắt sự kiện thay đổi — lưu OUTPUT vào biến
  CHANGES=$(inotifywait -r -e modify,create,delete,move --exclude 'node_modules|.git' ./ 2>/dev/null)

  # In ra file thay đổi
  echo -e "${YELLOW}📌 Detected change:${NC} ${CHANGES}"

  # Thực thi rsync
  echo -e "${GREEN}🔄 Syncing to EC2...${NC}"
  
  rsync -avz --delete \
    --exclude node_modules \
    --exclude .git \
    -e "ssh -i /mnt/c/Users/ADMIN/.ssh/nhanbayern.pem" \
    ./ ubuntu@54.179.33.148:/home/ubuntu/backend

  echo -e "${GREEN}✅ Sync completed at $(date +"%H:%M:%S")${NC}"
  echo "----------------------------------------------"
done
