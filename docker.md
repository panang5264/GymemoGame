docker compose -f build-compose.yml build

docker tag gymemogame-backend:latest pasitkku/gymemo-backend:v15
docker tag gymemogame-backend:latest pasitkku/gymemo-backend:latest
docker tag gymemogame-frontend:latest pasitkku/gymemo-frontend:v16
docker tag gymemogame-frontend:latest pasitkku/gymemo-frontend:latest

docker push pasitkku/gymemo-backend:v15
docker push pasitkku/gymemo-backend:latest
docker push pasitkku/gymemo-frontend:v16
docker push pasitkku/gymemo-frontend:latest
