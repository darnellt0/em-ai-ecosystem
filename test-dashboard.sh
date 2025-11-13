#!/bin/bash

echo "=== Dashboard & Health Endpoints ==="

echo ""
echo "1. Health Check"
curl -s http://localhost:3000/health

echo ""
echo ""
echo "2. Dashboard"
curl -s http://localhost:3000/api/dashboard

echo ""
echo ""
echo "3. Agents List"
curl -s http://localhost:3000/api/agents

echo ""
echo ""
echo "4. Config"
curl -s http://localhost:3000/api/config

echo ""
echo ""
echo "5. 404 Test - Non-existent endpoint"
curl -s http://localhost:3000/api/nonexistent
