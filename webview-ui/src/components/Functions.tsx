import { VSCodeLink } from "@vscode/webview-ui-toolkit/react";
import { Function, Message } from "prompt-schema";
import FunctionItem from "./FunctionItem";

interface FunctionsProps {
    items: Function[];
    onMessageChanged: (index: number, message: Message) => void;
    onMessageDeleted: (index: number) => void;
    onFunctionInserted: (index: number) => void;
}

function Functions({
    items,
    onMessageChanged,
    onMessageDeleted,
    onFunctionInserted,
}: FunctionsProps) {
    if (items.length == 0)
        return (
            <div>
                <p>
                    Function calling allows you to more reliably get structured data back from the
                    model.
                </p>
                <strong>
                    Note: function editing is currently not implemented, please edit the source file
                    manually.
                </strong>

                <VSCodeLink href="#" onClick={() => onFunctionInserted(0)}>
                    Add function example
                </VSCodeLink>
            </div>
        );
    return (
        <>
            {items.map((f, index) => {
                return (
                    <FunctionItem
                        key={index}
                        index={index}
                        functionDefination={f}
                        onMessageChanged={onMessageChanged}
                        onMessageDeleted={onMessageDeleted}
                        onMessageInserted={onFunctionInserted}
                    />
                );
            })}
        </>
    );
}

export default Functions;
