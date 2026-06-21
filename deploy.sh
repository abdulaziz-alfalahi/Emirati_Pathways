#!/bin/bash
# ============================================================================
# Emirati Human Development Platform — Deployment Script
# ============================================================================
#
# Usage:
#   ./deploy.sh              # Pull latest & restart (default)
#   ./deploy.sh --pull-only  # Pull only, no restart
#   ./deploy.sh --test       # Pull, restart, and run API tests
#   ./deploy.sh --status     # Show current status
#
# Environment:
#   Automatically detects environment from hostname or DEPLOY_ENV variable.
#   Set DEPLOY_ENV=appdev|appqa|production to override.
#
# Workflow:
#   Laptop (dev) → push to GitHub
#   APPDEV → ./deploy.sh --test     (verification)
#   APPQA  → ./deploy.sh --test     (QA testing)
#   APP01  → ./deploy.sh            (production)
#   APP02  → ./deploy.sh            (production)
# ============================================================================

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
REPO_DIR="${REPO_DIR:-$HOME/Emirati_Pathways}"
BRANCH="${BRANCH:-main}"
BACKEND_PORT="${BACKEND_PORT:-5005}"
FRONTEND_PORT="${FRONTEND_PORT:-8089}"
LOG_DIR="${REPO_DIR}/logs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ── Detect Environment ──────────────────────────────────────────────────────
detect_env() {
    if [ -n "${DEPLOY_ENV:-}" ]; then
        echo "$DEPLOY_ENV"
        return
    fi

    local hostname=$(hostname)
    case "$hostname" in
        *appdev*|*APPDEV*) echo "appdev" ;;
        *appqa*|*APPQA*)   echo "appqa" ;;
        *app01*|*APP01*|*app02*|*APP02*) echo "production" ;;
        *) echo "unknown" ;;
    esac
}

ENV=$(detect_env)

# ── Logging ──────────────────────────────────────────────────────────────────
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp]${NC} $1"
}

log_ok() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[$timestamp] ✅ $1${NC}"
}

log_warn() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[$timestamp] ⚠️  $1${NC}"
}

log_err() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[$timestamp] ❌ $1${NC}"
}

# ── Banner ───────────────────────────────────────────────────────────────────
print_banner() {
    echo ""
    echo "============================================================"
    echo "  EMIRATI HUMAN DEVELOPMENT PLATFORM — DEPLOY"
    echo "  Environment: $ENV"
    echo "  Branch:      $BRANCH"
    echo "  Repo:        $REPO_DIR"
    echo "  Time:        $(date '+%Y-%m-%d %H:%M:%S')"
    echo "============================================================"
    echo ""
}

# ── Safety Check ─────────────────────────────────────────────────────────────
safety_check() {
    if [ "$ENV" = "production" ]; then
        log_warn "PRODUCTION DEPLOYMENT — Double-check before proceeding!"
        read -p "  Continue? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log "Aborted."
            exit 0
        fi
    fi
}

# ── Git Pull ─────────────────────────────────────────────────────────────────
git_pull() {
    log "Pulling latest from origin/$BRANCH..."

    if [ ! -d "$REPO_DIR/.git" ]; then
        log_err "Not a git repository: $REPO_DIR"
        exit 1
    fi

    cd "$REPO_DIR"

    # Stash any local changes
    local stash_output
    stash_output=$(git stash 2>&1) || true
    if echo "$stash_output" | grep -q "Saved working directory"; then
        log_warn "Local changes stashed — run 'git stash pop' to restore"
    fi

    # Pull
    git fetch origin "$BRANCH" 2>&1 | head -5
    git checkout "$BRANCH" 2>&1 | head -3
    git pull origin "$BRANCH" 2>&1 | head -10

    local commit=$(git log -1 --format='%h %s' 2>/dev/null)
    log_ok "Updated to: $commit"
}

# ── Install Dependencies ────────────────────────────────────────────────────
install_deps() {
    log "Checking backend dependencies..."
    cd "$REPO_DIR/backend"

    if [ -f requirements.txt ]; then
        pip install -q -r requirements.txt 2>&1 | tail -3
        log_ok "Backend dependencies up to date"
    fi

    log "Checking frontend dependencies..."
    cd "$REPO_DIR/frontend"

    if [ -f package.json ]; then
        npm install --silent 2>&1 | tail -3
        log_ok "Frontend dependencies up to date"
    fi
}

# ── Set Environment Variables ────────────────────────────────────────────────
set_env_vars() {
    case "$ENV" in
        appdev)
            export FLASK_ENV=development
            if [ -f "${REPO_DIR}/backend/.env" ] && grep -q "^FRONTEND_URL=" "${REPO_DIR}/backend/.env"; then
                local env_val=$(grep "^FRONTEND_URL=" "${REPO_DIR}/backend/.env" | cut -d'=' -f2- | tr -d '\r')
                export FRONTEND_URL="$env_val"
            else
                export FRONTEND_URL="http://$(hostname -I | awk '{print $1}'):${FRONTEND_PORT}"
            fi
            log "FLASK_ENV=development, FRONTEND_URL=$FRONTEND_URL"
            ;;
        appqa)
            export FLASK_ENV=development
            if [ -f "${REPO_DIR}/backend/.env" ] && grep -q "^FRONTEND_URL=" "${REPO_DIR}/backend/.env"; then
                local env_val=$(grep "^FRONTEND_URL=" "${REPO_DIR}/backend/.env" | cut -d'=' -f2- | tr -d '\r')
                export FRONTEND_URL="$env_val"
            else
                export FRONTEND_URL="http://$(hostname -I | awk '{print $1}'):${FRONTEND_PORT}"
            fi
            log "FLASK_ENV=development (QA), FRONTEND_URL=$FRONTEND_URL"
            ;;
        production)
            export FLASK_ENV=production
            export FRONTEND_URL="${FRONTEND_URL:-https://emiratipathways.ae}"
            log "FLASK_ENV=production, FRONTEND_URL=$FRONTEND_URL"
            ;;
        *)
            export FLASK_ENV=development
            log_warn "Unknown environment — defaulting to FLASK_ENV=development"
            ;;
    esac
}

# ── Restart Services ────────────────────────────────────────────────────────
restart_services() {
    log "Restarting backend..."

    # Create log directory
    mkdir -p "$LOG_DIR"

    # Kill existing backend process
    pkill -f "python.*app.py" 2>/dev/null || true
    sleep 2

    # Start backend
    cd "$REPO_DIR/backend"
    nohup python app.py > "$LOG_DIR/backend.log" 2>&1 &
    local backend_pid=$!
    log "Backend started (PID: $backend_pid)"

    # Wait for backend to be ready
    log "Waiting for backend to be ready..."
    local retries=15
    while [ $retries -gt 0 ]; do
        if curl -s "http://localhost:${BACKEND_PORT}/health" > /dev/null 2>&1; then
            log_ok "Backend is ready on port $BACKEND_PORT"
            break
        fi
        retries=$((retries - 1))
        sleep 2
    done

    if [ $retries -eq 0 ]; then
        log_err "Backend failed to start — check $LOG_DIR/backend.log"
        tail -20 "$LOG_DIR/backend.log" 2>/dev/null
        return 1
    fi
}

# ── Run API Tests ────────────────────────────────────────────────────────────
run_tests() {
    log "Running API tests..."
    cd "$REPO_DIR/backend"

    export API_BASE_URL="http://localhost:${BACKEND_PORT}"

    python tests/run_all_api_tests.py 2>&1 | tee "$LOG_DIR/test_results.log"
    local exit_code=${PIPESTATUS[0]}

    if [ $exit_code -eq 0 ]; then
        log_ok "All API tests passed!"
    else
        log_err "Some tests failed — see $LOG_DIR/test_results.log"
    fi

    return $exit_code
}

# ── Show Status ──────────────────────────────────────────────────────────────
show_status() {
    echo ""
    echo "  Environment:  $ENV"
    echo "  FLASK_ENV:    ${FLASK_ENV:-not set}"
    echo "  FRONTEND_URL: ${FRONTEND_URL:-not set}"
    echo ""

    # Git status
    cd "$REPO_DIR" 2>/dev/null && {
        echo "  Git branch:   $(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
        echo "  Last commit:  $(git log -1 --format='%h %s (%cr)' 2>/dev/null)"
        echo ""
    }

    # Process status
    local backend_pid=$(pgrep -f "python.*app.py" | head -1)
    if [ -n "$backend_pid" ]; then
        echo "  Backend:      ✅ Running (PID: $backend_pid, port $BACKEND_PORT)"
    else
        echo "  Backend:      ❌ Not running"
    fi

    # Health check
    if curl -s "http://localhost:${BACKEND_PORT}/health" > /dev/null 2>&1; then
        echo "  Health:       ✅ Responding"
    else
        echo "  Health:       ❌ Not responding"
    fi

    echo ""
}

# ── Main ─────────────────────────────────────────────────────────────────────
main() {
    local mode="${1:-deploy}"

    print_banner

    case "$mode" in
        --status|-s)
            show_status
            ;;
        --pull-only|-p)
            safety_check
            git_pull
            ;;
        --test|-t)
            safety_check
            git_pull
            install_deps
            set_env_vars
            restart_services
            run_tests
            ;;
        --help|-h)
            echo "Usage: $0 [--pull-only | --test | --status | --help]"
            echo ""
            echo "  (default)    Pull latest, install deps, restart services"
            echo "  --pull-only  Pull latest code only, no restart"
            echo "  --test       Pull, restart, and run API tests"
            echo "  --status     Show current deployment status"
            echo "  --help       Show this help"
            ;;
        *)
            safety_check
            git_pull
            install_deps
            set_env_vars
            restart_services
            log_ok "Deployment complete!"
            show_status
            ;;
    esac
}

main "$@"
