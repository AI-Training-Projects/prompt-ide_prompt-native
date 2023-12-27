export enum InterfaceType {
    CHAT = "chat",
    COMPLETION = "completion",
}

export interface ModelType {
    name: string;
    description?: string;
    interfaceType: InterfaceType;
    parameters: ParameterType[] | (() => ParameterType[]);
}

export interface ParameterType {
    name: string;
    displayName: string;
    type: "number" | "string" | "boolean" | "array";
    defaultValue?: string | number | boolean;
    isRequired?: boolean;
    description?: string;
    minValue?: number;
    maxValue?: number;
    isMinValueExclusive?: boolean;
    isMaxValueExclusive?: boolean;
    maxLength?: number;
}
