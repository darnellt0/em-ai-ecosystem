# Elevated Movements AI Ecosystem - Development Makefile
# Phase 6 Growth Agents

.PHONY: help up down worker beat test launch build clean logs

help: ## Show this help message
	@echo "Elevated Movements AI Ecosystem - Makefile Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Start all services (docker compose up -d)
	docker compose up -d

down: ## Stop all services and remove volumes
	docker compose down -v

build: ## Build all services
	docker compose build
	cd packages/api && npm run build

worker: ## Tail worker logs
	docker compose logs -f worker

beat: ## Show Redis info (no beat service in BullMQ)
	docker compose exec redis redis-cli INFO

test: ## Run backend tests
	cd packages/api && npm test

test-watch: ## Run tests in watch mode
	cd packages/api && npm run test:watch

lint: ## Lint TypeScript code
	cd packages/api && npm run lint

format: ## Format code with prettier
	cd packages/api && npm run format

launch: ## Launch all growth agents via API
	@echo "Launching growth agents..."
	curl -X POST http://localhost:3000/api/orchestrator/launch

status: ## Check agent readiness status
	@echo "Checking agent readiness..."
	curl -s http://localhost:3000/api/orchestrator/readiness | json_pp || curl -s http://localhost:3000/api/orchestrator/readiness

health: ## Check orchestrator health
	@echo "Checking orchestrator health..."
	curl -s http://localhost:3000/api/orchestrator/health | json_pp || curl -s http://localhost:3000/api/orchestrator/health

monitor: ## View recent progress events
	@echo "Fetching recent progress..."
	curl -s http://localhost:3000/api/orchestrator/monitor | json_pp || curl -s http://localhost:3000/api/orchestrator/monitor

logs: ## Tail all service logs
	docker compose logs -f

logs-api: ## Tail API logs
	docker compose logs -f api

logs-worker: ## Tail worker logs
	docker compose logs -f worker

logs-redis: ## Tail Redis logs
	docker compose logs -f redis

clean: ## Clean build artifacts and node_modules
	rm -rf packages/api/dist
	rm -rf packages/api/node_modules
	rm -rf packages/orchestrator/dist
	rm -rf packages/orchestrator/node_modules

install: ## Install dependencies
	npm install
	cd packages/api && npm install
	cd packages/orchestrator && npm install

dev: ## Start in development mode
	cd packages/api && npm run dev

ui: ## Open monitoring UI in browser
	@echo "Opening http://localhost:3000/agents/agents.html"
	@command -v open >/dev/null 2>&1 && open http://localhost:3000/agents/agents.html || \
	 command -v xdg-open >/dev/null 2>&1 && xdg-open http://localhost:3000/agents/agents.html || \
	 echo "Please open http://localhost:3000/agents/agents.html in your browser"

verify: ## Full verification - launch agents and check readiness
	@echo "Starting full verification..."
	@make launch
	@echo "Waiting 30 seconds for agents to complete..."
	@sleep 30
	@make status
