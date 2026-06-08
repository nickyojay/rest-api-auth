#!/bin/bash

BASE_URL="http://localhost:3000"
EMAIL="test2@example.com"
PASSWORD="password123"

echo ""
echo "========================================"
echo " REST API Auth - Test Suite"
echo "========================================"

# ── Register ─────────────────────────────────
echo ""
echo "[ 1 ] Register"
REGISTER=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo "$REGISTER"

# ── Login ─────────────────────────────────────
echo ""
echo "[ 2 ] Login"
LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo "$LOGIN"

ACCESS_TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo "$LOGIN" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "ERROR: Could not extract access token. Exiting."
  exit 1
fi

echo "Access token extracted ✓"
echo "Refresh token extracted ✓"

# ── Create Post ───────────────────────────────
echo ""
echo "[ 3 ] Create post"
CREATE=$(curl -s -X POST "$BASE_URL/posts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"title":"My first post","body":"Hello world!"}')
echo "$CREATE"

POST_ID=$(echo "$CREATE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# ── Get All Posts ─────────────────────────────
echo ""
echo "[ 4 ] Get all posts"
curl -s "$BASE_URL/posts" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# ── Get Single Post ───────────────────────────
echo ""
echo ""
echo "[ 5 ] Get single post"
curl -s "$BASE_URL/posts/$POST_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# ── Update Post ───────────────────────────────
echo ""
echo ""
echo "[ 6 ] Update post"
curl -s -X PUT "$BASE_URL/posts/$POST_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"title":"Updated title","body":"Updated body!"}'

# ── Refresh Token ─────────────────────────────
echo ""
echo ""
echo "[ 7 ] Refresh access token"
curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"

# ── No Token (expect 401) ─────────────────────
echo ""
echo ""
echo "[ 8 ] Access posts without token (expect 401)"
curl -s "$BASE_URL/posts"

# ── Delete as regular user (expect 403) ───────
echo ""
echo ""
echo "[ 9 ] Delete post as regular user (expect 403)"
curl -s -X DELETE "$BASE_URL/posts/$POST_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# ── Logout ────────────────────────────────────
echo ""
echo ""
echo "[ 10 ] Logout"
curl -s -X POST "$BASE_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"

# ── Use refresh token after logout (expect 401) ──
echo ""
echo ""
echo "[ 11 ] Use refresh token after logout (expect 401)"
curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"

echo ""
echo ""
echo "========================================"
echo " Tests complete"
echo "========================================"
echo ""
EOF