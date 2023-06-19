import { useEffect, useState } from "react";
import "./App.css";
import "./codicon.css";
import ChatEditor from "./components/ChatEditor";
import CompletionEditor from "./components/CompletionEditor";
import ModelSelection from "./components/ModelSelection";
import { Vendor } from "./config/models";
import { vscode } from "./utilities/vscode";
import { Chat, Completion, Model, Type, PromptToYaml, TestHelloWorld } from 'prompt-runtime';

function App() {
    const [vendor, setVendor] = useState(Vendor.Google);
    const [model, setModel] = useState("");

    const [prompt, setPrompt] = useState<Chat | Completion>(new Completion(new Model(model, vendor), "Hello world!"));

    console.log(typeof Completion);
    console.log(typeof Type);
    console.log(typeof PromptToYaml);
    console.log(typeof TestHelloWorld);
    const onPromptChanged = (new_prompt: Completion | Chat) => {
        setPrompt(new_prompt);

        vscode.postMessage({
            command: "text_edited",
            // text: serializer.serialize(new_prompt),
        });
    };

    const messageListener = (event: MessageEvent<any>) => {
        const message = event.data;

        console.log('Received event:', event);
        if (message.command === 'initialize' || message.command === 'text_updated') {
            const text = message.text;
            // const p = serializer.deserialize(text);
            // setPrompt(p);
        }
    };

    const onCreateTypeChange = (type: Type) => {
        let newPrompt = prompt;
        newPrompt.type = type;
        onPromptChanged(newPrompt);
    };

    useEffect(() => {
        window.addEventListener('message', messageListener);
        return () => {
            window.removeEventListener('message', messageListener);
        };
    }, []);

    return (
        <main>
            {prompt.type == Type.chat &&
                <ChatEditor />
            }
            {prompt.type == Type.completion &&
                <CompletionEditor data={prompt as Completion} onPromptChanged={onPromptChanged} />
            }
            <ModelSelection type={prompt.type} vendor={prompt.model.vendor as Vendor} model={prompt.model.model}
                onTypeSelected={onCreateTypeChange}
                onVendorSelected={v => setVendor(v)}
                onModelSelected={m => setModel(m)}
            />
        </main>
    );
}

export default App;
