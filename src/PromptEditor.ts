import * as vscode from "vscode";
import { Webview } from "vscode";
import { getNonce } from "./utilities/getNonce";
import { getUri } from "./utilities/getUri";

export class PromptEditor implements vscode.CustomTextEditorProvider {
    public static readonly viewType = "promptIde.editor";

    constructor(private readonly context: vscode.ExtensionContext) {}

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new PromptEditor(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            PromptEditor.viewType,
            provider,
            {
                /**
                 * see:
                 * https://code.visualstudio.com/api/extension-guides/webview
                 * https://github.com/microsoft/vscode/issues/109205
                 */
                webviewOptions: {
                    retainContextWhenHidden: true,
                },
            }
        );
        return providerRegistration;
    }

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
        };
        webviewPanel.webview.html = this._getWebviewContent(webviewPanel.webview);

        function updateWebview() {
            console.log("updating webview");
            webviewPanel.webview.postMessage({
                type: "update",
                text: document.getText(),
            });
        }

        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
            console.log("document changed", e.document.uri.toString(), document.uri.toString());
            if (e.document.uri.toString() === document.uri.toString()) {
                updateWebview();
            }
        });

        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });

        webviewPanel.webview.onDidReceiveMessage((e) => {
            console.log("--->", e);
            switch (e.type) {
                case "sync":
                    this.updateTextDocument(document, e.text);
                default:
                    break;
            }
        });

        updateWebview();
    }

    private _getWebviewContent(webview: Webview) {
        const stylesUri = getUri(webview, this.context.extensionUri, [
            "webview-ui",
            "build",
            "assets",
            "index.css",
        ]);
        const scriptUri = getUri(webview, this.context.extensionUri, [
            "webview-ui",
            "build",
            "assets",
            "index.js",
        ]);
        const codiconFontUri = getUri(webview, this.context.extensionUri, [
            "webview-ui",
            "build",
            "assets",
            "codicon.ttf",
        ]);
        const nonce = getNonce();

        return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src https://us-central1-aiplatform.googleapis.com; style-src ${webview.cspSource} 'nonce-${nonce}' ; font-src ${webview.cspSource}; script-src 'unsafe-eval' 'nonce-${nonce}';">
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
    private updateTextDocument(document: vscode.TextDocument, text: string) {
        const edit = new vscode.WorkspaceEdit();

        // Just replace the entire document every time for this example extension.
        // A more complete extension should compute minimal edits instead.
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), text);

        return vscode.workspace.applyEdit(edit);
    }
}
