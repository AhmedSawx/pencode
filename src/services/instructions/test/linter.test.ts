import { describe, it, expect } from "bun:test";
import { interpret } from "../interpreter";

describe("Linter (Interpreter in Lint Mode)", () => {

  it("should report a custom error for a trailing comma", () => {
    const input = "Rectangle(),";
    const { lexErrors, parseErrors, semanticErrors } = interpret(input, "lint");

    // We expect one semantic error for the trailing comma.
    expect(lexErrors.length).toBe(0);
    expect(parseErrors.length).toBe(0);
    expect(semanticErrors.length).toBe(1);

    const trailingCommaError = semanticErrors[0];
    expect(trailingCommaError.message).toBe("A trailing comma at the end of the statement is not allowed.");
    expect(trailingCommaError.token.image).toBe(",");
  });

  it("should report an error for an undefined object type", () => {
    const input = "Foo()";
    const { semanticErrors } = interpret(input, "lint");
    expect(semanticErrors.length).toBe(1);
    expect(semanticErrors[0].message).toBe('Object type "Foo" not found.');
  });

  it("should report an error for an undefined parameter name", () => {
    const input = "Rectangle(foo: 123)";
    const { semanticErrors } = interpret(input, "lint");
    expect(semanticErrors.length).toBe(1);
    expect(semanticErrors[0].message).toContain('Parameter "foo" is not a valid for a Rectangle');
  });

  it("should report an error for a duplicate object name", () => {
    const input = "Rectangle() as C, Line() as C";
    const { semanticErrors } = interpret(input, "lint");
    expect(semanticErrors.length).toBe(1);
    expect(semanticErrors[0].message).toBe('Name "C" is already taken.');
  });

  it("should report an error for cloning a non-existent object", () => {
    const input = "!Foo()";
    const { semanticErrors } = interpret(input, "lint");
    expect(semanticErrors.length).toBe(1);
    expect(semanticErrors[0].message).toBe('Cannot find named object "Foo" to clone.');
  });

  it("should report an error for an invalid parent object", () => {
    const input = "Rectangle() CHILD TO Foo";
    const { semanticErrors } = interpret(input, "lint");
    expect(semanticErrors.length).toBe(1);
    expect(semanticErrors[0].message).toBe('Parent object "Foo" is undefined.');
  });

  it("should not report a trailing comma error if there is no trailing comma", () => {
    const input = "Rectangle(), Line()";
    const { semanticErrors } = interpret(input, "lint");
    // No semantic errors are expected here.
    expect(semanticErrors.length).toBe(0);
  });

});