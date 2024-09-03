#!/bin/bash

# Set verbose mode based on the argument
VERBOSE=0
if [[ "$1" == "-v" ]]; then
    VERBOSE=1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install nvm
install_nvm() {
    if [ $VERBOSE -eq 1 ]; then
        echo -e "\033[1;34mInstalling nvm...\033[0m"
    fi
    curl --silent -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash >/dev/null 2>&1
    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install --lts >/dev/null 2>&1
    nvm use --lts
}

# Function to install mkcert
install_mkcert() {
    if command_exists brew; then
        if [ $VERBOSE -eq 1 ]; then
            echo -e "\033[1;34mInstalling mkcert using Homebrew...\033[0m"
        fi
        brew install mkcert >/dev/null 2>&1
    elif command_exists apt-get; then
        if [ $VERBOSE -eq 1 ]; then
            echo -e "\033[1;34mInstalling mkcert using apt-get...\033[0m"
        fi
        sudo apt-get update >/dev/null 2>&1
        sudo apt-get install -y libnss3-tools mkcert >/dev/null 2>&1
    else
        echo -e "\033[1;31mPackage manager not found. Please install mkcert manually.\033[0m"
        exit 1
    fi
}

# Function to display a step result
show_step_result() {
    local status=$1
    local step=$2
    if [ "$status" == "OK" ]; then
        echo -ne "\033[1;32m[ OK ]\033[0m $step\033[K\r"
    elif [ "$status" == "SKIP" ]; then
        echo -ne "\033[1;33m[ SKIP ]\033[0m $step\033[K\r"
    elif [ "$status" == "RUNNING" ]; then
        echo -ne "\033[1;34m[ RUNNING ]\033[0m $step...\033[K\r"
    else
        echo -e "\033[1;31m[FAILED]\033[0m $step"
        exit 1
    fi
}

# Main script execution
echo -e "\033[1;34mStarting Chariot UI Setup...\033[0m"

# Step 1: Check the operating system
show_step_result "RUNNING" "Operating system check"
OS="$(uname -s)"
case "$OS" in
    Darwin | Linux)
        show_step_result "OK" "Operating system check"
        ;;
    *)
        echo -e "\033[1;31mUnsupported OS: $OS. Exiting.\033[0m"
        exit 1
        ;;
esac

# Step 2: Check for nvm and install if not present
show_step_result "RUNNING" "nvm installation"
if ! command_exists nvm; then
    install_nvm
    show_step_result "OK" "nvm installation"
else
    show_step_result "SKIP" "nvm installation"
fi

# Step 3: Clone the repository
if [ -d "chariot-ui" ]; then
    show_step_result "SKIP" "Repository cloning"
else
    show_step_result "RUNNING" "Repository cloning"
    git clone https://github.com/praetorian-inc/chariot-ui.git >/dev/null 2>&1
    show_step_result "OK" "Repository cloning"
fi

# Step 4: Navigate to the directory
show_step_result "RUNNING" "Navigating to the repository directory"
cd chariot-ui || { echo -e "\033[1;31mFailed to enter directory chariot-ui. Exiting.\033[0m"; exit 1; }
show_step_result "OK" "Navigating to the repository directory"

# Step 5: Load nvm and use the Node.js version specified in .nvmrc
show_step_result "RUNNING" "Node.js setup using nvm"

if [ $? -eq 0 ]; then
    show_step_result "OK" "Node.js setup using nvm"
else
    show_step_result "SKIP" "Node.js setup using nvm"
fi

# Step 6: Check for mkcert and install if not present
show_step_result "RUNNING" "mkcert installation"
if ! command_exists mkcert; then
    install_mkcert
    show_step_result "OK" "mkcert installation"
else
    show_step_result "SKIP" "mkcert installation"
fi

# Step 7: Switch to the next-release branch
show_step_result "RUNNING" "Switching to the next-release branch"
git checkout next-release >/dev/null 2>&1
git pull origin next-release >/dev/null 2>&1
show_step_result "OK" "Switching to the next-release branch"

# Step 8: Install dependencies
show_step_result "RUNNING" "npm dependencies installation"
npm install >/dev/null 2>&1
show_step_result "OK" "npm dependencies installation"

# Step 9: Set up HTTPS certificates
show_step_result "RUNNING" "HTTPS certificates setup"
mkdir -p certs && cd certs
mkcert create-ca >/dev/null 2>&1
mkcert create-cert >/dev/null 2>&1
cd ..
show_step_result "OK" "HTTPS certificates setup"

# Step 10: Start the development server
show_step_result "RUNNING" "Development server start"
npm start 