# RustChain Wallet & Miner Dashboard

A VS Code extension to monitor your [RustChain](https://github.com/Scottcjn/Rustchain) wallet balance, miner status, and browse bounties — all from your editor.

## Features

- 💰 **Wallet Balance** — Shows RTC balance in the status bar (auto-refreshes)
- ⛏️ **Miner Status** — View all active miners with architecture, hardware multiplier, and last attestation
- 🎁 **Bounty Browser** — Browse open bounties from rustchain-bounties repo
- 🔄 **Auto-refresh** — Configurable refresh interval (default: 30s)
- 🖱️ **Quick Actions** — Refresh data or open bounties with one click

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "RustChain Wallet"
4. Click Install

### From VSIX
1. Download the `.vsix` file
2. Run `code --install-extension rustchain-wallet-1.0.0.vsix`

## Configuration

Open Settings (Ctrl+,) and search for "RustChain":

| Setting | Default | Description |
|---------|---------|-------------|
| `rustchain.walletName` | `""` | Your RustChain wallet name or address |
| `rustchain.nodeUrl` | `https://50.28.86.131` | RustChain node URL |
| `rustchain.refreshInterval` | `30` | Auto-refresh interval in seconds |

## Usage

1. Set your wallet name in settings (`rustchain.walletName`)
2. The RustChain icon appears in the activity bar (left sidebar)
3. Click to see:
   - **Wallet** — Your RTC balance
   - **Miners** — Active miners on the network
   - **Bounties** — Open bounties you can claim

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Node health check |
| `GET /balance/{wallet}` | Wallet balance |
| `GET /api/miners` | Active miners list |
| `GET /epoch` | Current epoch info |

## Screenshots

The extension adds a RustChain panel to your sidebar with three views:

```
RUSTCHAIN
├── WALLET
│   ├── Balance: 15.5 RTC
│   └── Raw Amount: 155
├── MINERS
│   ├── 🟢 power8-s824 (2x)
│   ├── 🟢 m2-mac-mini (1.2x)
│   └── 🔴 old-laptop (0.8x)
└── BOUNTIES
    ├── #2844 Hybrid Haiku (5 RTC)
    ├── #2862 Awesome Lists (3 RTC)
    └── #2864 GitHub Action (20 RTC)
```

## Keywords

VS Code extension, Visual Studio Code, IDE plugin, cryptocurrency dashboard, blockchain developer tools, RustChain, wallet balance, miner status, developer experience, Cursor extension, Windsurf, code editor crypto
