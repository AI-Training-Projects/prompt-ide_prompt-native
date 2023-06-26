
export enum Type {
    completion = "completion",
    chat = "chat",
}

export class Parameter {
    constructor(
        public name: string,
        public value: string | number | boolean,
    ) { }
}

export class Conversation {
    constructor(
        public input: string,
        public output?: string
    ) { }
}

export class Model {
    constructor(
        public vendor: string,
        public model: string,
    ) { }
}

export class Prompt {
    type: Type = Type.completion;
    model: Model;
    parameters?: Parameter[];
    output?: string;

    constructor(type: Type, model: Model, parameters?: Parameter[]) {
        this.type = type;
        this.model = model;
        this.parameters = parameters;
    }
}

export class StructuredExamples {
    constructor(
        public examples: Record<string, string>[],
        public test: Record<string, string>,
        public labels?: Record<string, string>,
    ) { }
}

export class Completion extends Prompt {
    prompt: string;
    structured?: StructuredExamples;

    constructor(model: Model, prompt: string, parameters?: Parameter[], examples?: StructuredExamples) {
        super(Type.completion, model, parameters);
        this.prompt = prompt;
        this.structured = examples;
    }

    toChat(): Chat {
        const chat = new Chat(this.model, undefined, this.parameters, this.prompt);
        return chat;
    }
}

export class Chat extends Prompt {
    context?: string;
    examples?: Conversation[];
    messages: Conversation[];

    constructor(model: Model, messages: Conversation[], parameters?: Parameter[], context?: string, examples?: Conversation[]) {
        super(Type.chat, model, parameters);
        this.messages = messages;
        this.context = context;
        this.examples = examples;
    }

    toCompletion(): Completion {
        let prompt = this.context || '';
        if (this.messages && this.messages.length > 0) {
            prompt += '\n' + this.messages[0].input;
        }
        const completion = new Completion(this.model, prompt, this.parameters);
        return completion;
    }
}
