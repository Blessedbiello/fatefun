#!/bin/bash
# FATE Protocol - Setup Verification Script
# Verifies that all dependencies and configurations are correct

set -e

echo "🎮 FATE Protocol - Setup Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track errors
ERRORS=0

# Function to check command exists
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅${NC} $1 is installed"
        if [ ! -z "$2" ]; then
            VERSION=$($1 $2 2>&1 | head -n1)
            echo "   Version: $VERSION"
        fi
    else
        echo -e "${RED}❌${NC} $1 is NOT installed"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 exists"
    else
        echo -e "${RED}❌${NC} $1 is missing"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $1/ exists"
    else
        echo -e "${RED}❌${NC} $1/ is missing"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "1. Checking Required Tools"
echo "-------------------------"
check_command "node" "--version"
check_command "npm" "--version"
check_command "solana" "--version"
check_command "anchor" "--version"
check_command "cargo" "--version"
check_command "rustc" "--version"
echo ""

echo "2. Checking Project Structure"
echo "----------------------------"
check_dir "programs/fate_arena"
check_dir "programs/fate_council"
check_dir "app"
check_dir "scripts"
check_dir "tests"
check_file "package.json"
check_file "Anchor.toml"
check_file "tsconfig.json"
echo ""

echo "3. Checking Test Files"
echo "---------------------"
check_file "programs/fate_arena/tests/fate-arena.ts"
check_file "programs/fate_council/tests/fate-council.ts"
check_file "tests/integration.test.ts"
echo ""

echo "4. Checking Scripts"
echo "------------------"
check_file "scripts/deploy.ts"
check_file "scripts/setup-devnet.ts"
check_file "scripts/monitor.ts"
echo ""

echo "5. Checking Documentation"
echo "------------------------"
check_file "TESTING.md"
check_file "QUICK_START.md"
check_file "README.md"
check_file ".env.devnet.example"
check_file ".env.mainnet.example"
echo ""

echo "6. Checking Node Modules"
echo "-----------------------"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅${NC} node_modules installed"

    # Check key dependencies
    if [ -d "node_modules/@coral-xyz/anchor" ]; then
        echo -e "${GREEN}✅${NC} @coral-xyz/anchor"
    else
        echo -e "${YELLOW}⚠️${NC}  @coral-xyz/anchor not found (run npm install)"
    fi

    if [ -d "node_modules/@solana/web3.js" ]; then
        echo -e "${GREEN}✅${NC} @solana/web3.js"
    else
        echo -e "${YELLOW}⚠️${NC}  @solana/web3.js not found (run npm install)"
    fi

    if [ -d "node_modules/typescript" ]; then
        echo -e "${GREEN}✅${NC} typescript"
    else
        echo -e "${YELLOW}⚠️${NC}  typescript not found (run npm install)"
    fi
else
    echo -e "${YELLOW}⚠️${NC}  node_modules not found - run npm install"
fi
echo ""

echo "7. Checking Solana Configuration"
echo "--------------------------------"
if solana config get &> /dev/null; then
    CLUSTER=$(solana config get | grep "RPC URL" | awk '{print $3}')
    WALLET=$(solana config get | grep "Keypair Path" | awk '{print $3}')

    echo -e "${GREEN}✅${NC} Solana CLI configured"
    echo "   RPC URL: $CLUSTER"
    echo "   Wallet: $WALLET"

    if [ -f "$WALLET" ]; then
        echo -e "${GREEN}✅${NC} Wallet keypair exists"

        # Try to get balance
        if BALANCE=$(solana balance 2>&1); then
            echo "   Balance: $BALANCE"

            # Check if balance is > 0
            BALANCE_NUM=$(echo $BALANCE | awk '{print $1}')
            if (( $(echo "$BALANCE_NUM > 0" | bc -l) )); then
                echo -e "${GREEN}✅${NC} Wallet has SOL"
            else
                echo -e "${YELLOW}⚠️${NC}  Wallet has 0 SOL - run 'solana airdrop 2' (devnet)"
            fi
        else
            echo -e "${YELLOW}⚠️${NC}  Could not check balance"
        fi
    else
        echo -e "${RED}❌${NC} Wallet keypair not found at $WALLET"
        echo "   Run: solana-keygen new"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌${NC} Solana CLI not configured"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "8. Checking Anchor Build"
echo "-----------------------"
if [ -d "target/deploy" ]; then
    echo -e "${GREEN}✅${NC} target/deploy exists"

    if [ -f "target/deploy/fate_arena.so" ]; then
        echo -e "${GREEN}✅${NC} fate_arena.so built"
    else
        echo -e "${YELLOW}⚠️${NC}  fate_arena.so not found - run 'anchor build'"
    fi

    if [ -f "target/deploy/fate_council.so" ]; then
        echo -e "${GREEN}✅${NC} fate_council.so built"
    else
        echo -e "${YELLOW}⚠️${NC}  fate_council.so not found - run 'anchor build'"
    fi
else
    echo -e "${YELLOW}⚠️${NC}  Programs not built - run 'anchor build'"
fi
echo ""

echo "9. Checking Package.json Scripts"
echo "--------------------------------"
SCRIPTS=("test:arena" "test:council" "test:integration" "deploy:devnet" "monitor:devnet" "setup:devnet")
for script in "${SCRIPTS[@]}"; do
    if grep -q "\"$script\"" package.json; then
        echo -e "${GREEN}✅${NC} npm run $script"
    else
        echo -e "${RED}❌${NC} npm run $script not found"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

echo "======================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Setup verification complete! No errors found.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run tests: npm run test:all"
    echo "2. Deploy to devnet: npm run deploy:devnet"
    echo "3. Setup test data: npm run setup:devnet"
    echo "4. Start frontend: npm run dev"
    echo ""
    echo "See QUICK_START.md for detailed instructions."
    exit 0
else
    echo -e "${RED}❌ Setup verification found $ERRORS error(s).${NC}"
    echo ""
    echo "Please fix the errors above and run this script again."
    echo "See QUICK_START.md for installation instructions."
    exit 1
fi
