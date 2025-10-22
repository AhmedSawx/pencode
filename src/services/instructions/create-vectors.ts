import { interpret } from "./interpreter.js";

function createVectors(instruction: string) {
    if (typeof instruction !== "string" || !Boolean(instruction))
        console.error("instruction is not String!");

    let vectores = interpret(instruction);

    return vectores;
}

export { createVectors };
