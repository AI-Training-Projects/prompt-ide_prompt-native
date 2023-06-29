import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn, LogOutputChannel } from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import * as vscode from 'vscode';

/**
 * This class manages the state and behavior of HelloWorld webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering HelloWorld webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('terminal.integrated');
const supportsColor = config.get<boolean>('supportANSIColors', false);

export class PromptEditorPanel {
    public static panels: Map<vscode.TextDocument, PromptEditorPanel> = new Map();
    private readonly _panel: WebviewPanel;

    private static outputChannel: LogOutputChannel = window.createOutputChannel("Prompt Editor", { log: true }) as LogOutputChannel;
    private _disposables: Disposable[] = [];
    private document: vscode.TextDocument;

    private constructor(panel: WebviewPanel, extensionUri: Uri, document: vscode.TextDocument) {
        this.document = document;
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
        this._setWebviewMessageListener(this._panel.webview);
        this._loadDocument();
    }

    public static open(extensionUri: Uri, document: vscode.TextDocument) {
        if (PromptEditorPanel.panels.has(document)) {
            PromptEditorPanel.panels.get(document)?._panel.reveal(ViewColumn.Two);
        } else {
            const panel = window.createWebviewPanel(
                "prompt-studio.editor",
                document.fileName,
                ViewColumn.Two,
                {
                    enableScripts: true,
                    localResourceRoots: [Uri.joinPath(extensionUri, "out"), Uri.joinPath(extensionUri, "webview-ui/build")],
                }
            );

            PromptEditorPanel.panels.set(document, new PromptEditorPanel(panel, extensionUri, document));
        }
    }

    public dispose() {
        PromptEditorPanel.panels.clear();

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private _getWebviewContent(webview: Webview, extensionUri: Uri) {
        const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.css"]);
        const scriptUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.js"]);
        const codiconFontUri = getUri(webview, extensionUri, [
            "webview-ui",
            "build",
            "assets",
            "codicon.ttf",
        ]);
        const nonce = getNonce();

        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src https://us-central1-aiplatform.googleapis.com; style-src ${webview.cspSource} 'nonce-${nonce}'; font-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
            <link rel="stylesheet" type="text/css" href="${stylesUri}">
            <title>Prompt Editor</title>
            <style nonce="${nonce}">
                @font-face {
                font-family: "codicon";
                font-display: block;
                src: url("${codiconFontUri}") format("truetype");
                }
            </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
    }

    private _loadDocument() {
        this._panel.webview.postMessage({
            command: "initialize",
            text: this.document.getText()
        });
        const disposable = vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document === this.document) {
                this._panel.webview.postMessage({
                    command: "text_updated",
                    text: this.document.getText()
                });
            }
        });
        this._disposables.push(disposable);
    }

    private _showLog(log: any) {
        const level = log.level || "info";
        switch (level) {
            case "debug":
                PromptEditorPanel.outputChannel.debug(log.data);
                return;
            case "info":
                PromptEditorPanel.outputChannel.info(log.data);
                return;
            case "error":
                PromptEditorPanel.outputChannel.error(log.data);
                return;
        }
    }

    private _setWebviewMessageListener(webview: Webview) {
        webview.onDidReceiveMessage(
            (message: any) => {
                const command = message.command;
                const text = message.text;
                // PromptEditorPanel.outputChannel.appendLine(`Incoming message:${command} -> ${JSON.stringify(text)}`);
                switch (command) {
                    case "initialize":
                        window.showInformationMessage("loading data!");
                        return;
                    case "text_edited":
                        const fullRange = new vscode.Range(
                            this.document.positionAt(0),
                            this.document.positionAt(this.document.getText().length)
                        );
                        const replaceEdit = new vscode.TextEdit(fullRange, text);
                        const edit = new vscode.WorkspaceEdit();
                        edit.set(this.document.uri, [replaceEdit]);
                        vscode.workspace.applyEdit(edit);
                        return;
                    case "log_event":
                        this._showLog(text);
                        return;
                    case "error":
                        window.showErrorMessage(text);
                        return;
                    // Add more switch case statements here as more webview message commands
                    // are created within the webview context (i.e. inside media/main.js)
                }
            },
            undefined,
            this._disposables
        );
    }
}
