import * as vscode from 'vscode';
import * as https from 'https';

const NODE_URL_DEFAULT = 'https://50.28.86.131';

interface WalletBalance {
  balance_rtc: number;
  miner_pk: string;
  amount_i64: number;
}

interface MinerInfo {
  miner_id: string;
  architecture: string;
  hardware: string;
  multiplier: number;
  status: string;
  last_attest: string;
}

interface BountyInfo {
  number: number;
  title: string;
  labels: string[];
  state: string;
}

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.substring(0, 100)}`));
        }
      });
    }).on('error', reject);
  });
}

class WalletProvider implements vscode.TreeDataProvider<WalletItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<WalletItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private getConfig: () => { wallet: string; nodeUrl: string }) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: WalletItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<WalletItem[]> {
    const { wallet, nodeUrl } = this.getConfig();
    if (!wallet) {
      return [new WalletItem('Set wallet in Settings', '', vscode.TreeItemCollapsibleState.None, 'wallet')];
    }

    try {
      const balance = await fetchJson(`${nodeUrl}/balance/${wallet}`);
      return [
        new WalletItem(`Balance: ${balance.balance_rtc} RTC`, `Wallet: ${balance.miner_pk}`, vscode.TreeItemCollapsibleState.None, 'coin'),
        new WalletItem(`Raw Amount: ${balance.amount_i64}`, '', vscode.TreeItemCollapsibleState.None, 'info')
      ];
    } catch (e) {
      return [new WalletItem('Failed to fetch balance', `${e}`, vscode.TreeItemCollapsibleState.None, 'error')];
    }
  }
}

class MinerProvider implements vscode.TreeDataProvider<WalletItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<WalletItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private getConfig: () => { wallet: string; nodeUrl: string }) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: WalletItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<WalletItem[]> {
    const { nodeUrl } = this.getConfig();

    try {
      const miners = await fetchJson(`${nodeUrl}/api/miners`);
      if (!Array.isArray(miners) || miners.length === 0) {
        return [new WalletItem('No miners found', '', vscode.TreeItemCollapsibleState.None, 'info')];
      }

      return miners.map((m: MinerInfo) => {
        const statusIcon = m.status === 'online' ? '🟢' : '🔴';
        return new WalletItem(
          `${statusIcon} ${m.miner_id}`,
          `${m.hardware} | ${m.multiplier}x | ${m.last_attest}`,
          vscode.TreeItemCollapsibleState.None,
          'server'
        );
      });
    } catch (e) {
      return [new WalletItem('Failed to fetch miners', `${e}`, vscode.TreeItemCollapsibleState.None, 'error')];
    }
  }
}

class BountyProvider implements vscode.TreeDataProvider<WalletItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<WalletItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: WalletItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<WalletItem[]> {
    try {
      const url = 'https://api.github.com/repos/Scottcjn/rustchain-bounties/issues?labels=bounty&state=open&per_page=10';
      const issues = await fetchJson(url);

      return issues.map((issue: any) => {
        const labels = issue.labels.map((l: any) => l.name).join(', ');
        const bountyMatch = issue.title.match(/(\d+)\s*RTC/);
        const amount = bountyMatch ? `${bountyMatch[1]} RTC` : 'RTC';
        return new WalletItem(
          `#${issue.number} ${issue.title.substring(0, 50)}`,
          `${amount} | ${labels}`,
          vscode.TreeItemCollapsibleState.None,
          'gift',
          {
            command: 'vscode.open',
            title: 'Open Bounty',
            arguments: [vscode.Uri.parse(issue.html_url)]
          }
        );
      });
    } catch (e) {
      return [new WalletItem('Failed to fetch bounties', `${e}`, vscode.TreeItemCollapsibleState.None, 'error')];
    }
  }
}

class WalletItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly iconName?: string,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.description = description;
    this.tooltip = `${this.label}: ${this.description}`;
    if (iconName) {
      this.iconPath = new vscode.ThemeIcon(iconName);
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  const getConfig = () => {
    const config = vscode.workspace.getConfiguration('rustchain');
    return {
      wallet: config.get<string>('walletName', ''),
      nodeUrl: config.get<string>('nodeUrl', NODE_URL_DEFAULT)
    };
  };

  const walletProvider = new WalletProvider(getConfig);
  const minerProvider = new MinerProvider(getConfig);
  const bountyProvider = new BountyProvider(getConfig);

  vscode.window.registerTreeDataProvider('rustchain.wallet', walletProvider);
  vscode.window.registerTreeDataProvider('rustchain.miners', minerProvider);
  vscode.window.registerTreeDataProvider('rustchain.bounties', bountyProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand('rustchain.refresh', () => {
      walletProvider.refresh();
      minerProvider.refresh();
      bountyProvider.refresh();
      vscode.window.showInformationMessage('RustChain data refreshed');
    }),
    vscode.commands.registerCommand('rustchain.claimBounty', () => {
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/Scottcjn/rustchain-bounties/issues'));
    })
  );

  // Status bar item for wallet balance
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'rustchain.refresh';

  const updateStatusBar = async () => {
    const { wallet, nodeUrl } = getConfig();
    if (!wallet) {
      statusBarItem.text = '$(wallet) RustChain: No wallet set';
      statusBarItem.tooltip = 'Set rustchain.walletName in settings';
    } else {
      try {
        const balance = await fetchJson(`${nodeUrl}/balance/${wallet}`);
        statusBarItem.text = `$(coin) ${balance.balance_rtc} RTC`;
        statusBarItem.tooltip = `Wallet: ${balance.miner_pk}\nClick to refresh`;
      } catch {
        statusBarItem.text = '$(wallet) RustChain: Error';
        statusBarItem.tooltip = 'Failed to fetch balance';
      }
    }
    statusBarItem.show();
  };

  updateStatusBar();

  // Auto-refresh
  const refreshInterval = vscode.workspace.getConfiguration('rustchain').get<number>('refreshInterval', 30);
  setInterval(() => {
    updateStatusBar();
    walletProvider.refresh();
    minerProvider.refresh();
  }, refreshInterval * 1000);
}

export function deactivate() {}
