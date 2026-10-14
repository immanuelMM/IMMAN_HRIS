cd ~/Documents/HRIS
docker compose up -d

docker build -t hris-app .

docker run --rm -p 8080:8080 \
  --network hris_default \
  -e DATABASE_URL="postgres://postgres:postgres@postgres:5432/hris" \
  hris-app
