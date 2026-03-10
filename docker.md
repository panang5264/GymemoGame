docker compose -f build-compose.yml build

docker tag gymemogame-backend:latest pasitkku/gymemo-backend:v8
docker tag gymemogame-backend:latest pasitkku/gymemo-backend:latest
docker tag gymemogame-frontend:latest pasitkku/gymemo-frontend:v10
docker tag gymemogame-frontend:latest pasitkku/gymemo-frontend:latest

docker push pasitkku/gymemo-backend:v8
docker push pasitkku/gymemo-backend:latest
docker push pasitkku/gymemo-frontend:v10
docker push pasitkku/gymemo-frontend:latest
