<img src="https://github.com/praetorian-inc/chariot-ui/blob/main/public/icons/logo.png" alt="Praetorian Logo" width="200" height="200">

# Chariot Offensive Security Platform

[![Node Version](https://img.shields.io/badge/node-v20.15.1-339933)](https://nodejs.org/)
[![NPM Version](https://img.shields.io/badge/npm-v10.8.1-CB3837)](https://www.npmjs.com/)
[![License](https://img.shields.io/badge/license-MIT-007EC6.svg)](LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-007EC6.svg)](CODE_OF_CONDUCT.md)
[![Open Source Libraries](https://img.shields.io/badge/open--source-%F0%9F%92%9A-28a745)](https://opensource.org/)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/praetorian-inc/chariot-ui/issues)

:book: [Documentation](https://docs.praetorian.com)
:link: [Chariot Platform](https://chariot.praetorian.com)
:computer: [Praetorian CLI](https://github.com/praetorian-inc/praetorian-cli)

## Table of Contents

- [Description](#description)
- [Key Features](#key-features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Configuring Node Version](#configuring-node-version)
  - [Installation](#installation)
  - [Running the Development Server](#running-the-development-server)
  - [Building the Project](#building-the-project)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)
- [Terms of Service](https://www.praetorian.com/terms-of-service/)

## Description

Chariot is an expert-driven, all-in-one offensive security platform that helps organizations shift from a reactive "assume breach" mentality to a prevention-first strategy. By actively seeking out vulnerabilities and addressing potential weaknesses before attackers can exploit them, Chariot ensures a robust security posture through continuous offensive security testing.

⚠️ This repository mirrors the SaaS offering at preview.chariot.praetorian.com, enabling you to customize your full user experience.

## Key Features

- **Attack Surface Management**: Continuously monitor all attack vectors including external, internal, cloud, web app, secrets, phishing, rogue IT, and supplier/vendor risk.
- **Continuous Penetration Testing**: Perform strategic, adversarial-focused assessments to identify critical issues.
- **Continuous Red Teaming**: Test your cybersecurity program’s resilience over time.
- **Breach & Attack Simulation**: Simulate known exploitations to identify gaps in prevention and detection plans.

## Getting Started

### Prerequisites

- Node.js (LTS)
- npm (10.8.1)
- `mkcert` (for creating local HTTPS certificates)
- `nvm` (optional, for managing Node.js versions)

### Configuring Node Version

_Note: This step is optional. If you use other tools to manage Node.js versions, please refer to their documentation._

To ensure your Node.js version is on LTS when contributing or running the project locally using `nvm`, add the following script to your `~/.zshrc` file.

```sh
load-nvmrc() {
  [[ -a .nvmrc ]] || return
  local node_version="$(nvm version)"
  local nvmrc_path="$(nvm_find_nvmrc)"

  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$node_version" ]; then
      nvm use
    fi
  elif [ "$node_version" != "$(nvm version default)" ]; then
    echo "Reverting to nvm default version"
    nvm use default
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

When you change directories into the project, `nvm` will automatically detect the required Node.js version specified in the `.nvmrc` file and switch to it. Here is an example of what you might see:

```sh
[~]$ cd ./repos/chariot-ui
Found '/Users/username/repos/chariot-ui/.nvmrc' with version <lts/*>
Downloading and installing node v20.15.1...
Downloading https://nodejs.org/dist/v20.15.1/node-v20.15.1-darwin-x64.tar.xz...
######################################################################################## 100.0%
Computing checksum with sha256sum
Checksums matched!
Now using node v20.15.1 (npm v10.8.1)
```

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/praetorian-inc/chariot-ui.git
   cd chariot-ui
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Set up HTTPS certificates using `mkcert`:

   ```sh
   mkdir certs && cd certs
   npx mkcert create-ca
   npx mkcert create-cert
   cd ..
   ```

### Running the Development Server

Start the development server:

```sh
npm start
```

This will start the app on [https://localhost:3000](https://localhost:3000).

### Building the Project

To create a production build:

```sh
npm run build
```

This will generate optimized static files in the `build` directory.

## Contributing

We welcome contributions from the community. To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a pull request.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Support

If you have any questions or need support, please open an issue or reach out via [support@praetorian.com](mailto:support@praetorian.com).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
