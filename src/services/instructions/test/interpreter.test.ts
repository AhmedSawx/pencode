import { describe, it, expect } from "bun:test";
import { interpret } from "../interpreter";
import * as vectorClasses from "../../classes/vectors";

describe("Interpreter Automation Tests", () => {
  const testCases = Object.entries(vectorClasses)
    .filter(
      ([name, klass]) =>
        name !== "VectorObject" && typeof klass === "function",
    )
    .map(([name, klass]) => {
      const instance = new klass();
      const params = instance.getParams().filter(p => !p.name.startsWith("ANY")).map((p) => {
        let value;
        switch (p.type) {
          case "string":
            value = `'${Math.random().toString(36).substring(7)}'`;
            break;
          case "number":
            value = Math.floor(Math.random() * 100);
            break;
          case "any":
            value = `'p.rect(${Math.floor(Math.random() * 10)},${Math.floor(
              Math.random() * 10,
            )},${Math.floor(Math.random() * 10)},${Math.floor(
              Math.random() * 10,
            )})'`;
            break;
          default:
            value = null;
        }
        return { ...p, value };
      });
      return { name, klass, params };
    });

  for (const { name, klass, params } of testCases) {
    describe(name, () => {
      // Test with all parameters
      it("should create an object with all parameters", () => {
        const paramString = params
          .map((p) => `${p.name.replace("ANY", "")}: ${p.value}`)
          .join(", ");
        const input = `${name}(${paramString})`;
        const result = interpret(input);

        expect(result.objects).toHaveLength(1);
        const obj = result.objects[0].object;
        expect(obj).toBeInstanceOf(klass);

        for (const p of params) {
          const propName = p.actualName;
          const expectedValue =
            typeof p.value === "string" && p.value.startsWith("'")
              ? p.value.slice(1, -1)
              : p.value;
          expect((obj as any)[propName]).toBe(expectedValue);
        }
      });

      // Test with a subset of parameters
      if (params.length > 1) {
        it("should create an object with a subset of parameters", () => {
          const subsetParams = params.slice(0, params.length - 1);
          const paramString = subsetParams
            .map((p) => `${p.name.replace("ANY", "")}: ${p.value}`)
            .join(", ");
          const input = `${name}(${paramString})`;
          const result = interpret(input);

          expect(result.objects).toHaveLength(1);
          const obj = result.objects[0].object;
          expect(obj).toBeInstanceOf(klass);

          for (const p of subsetParams) {
            const propName = p.actualName;
            const expectedValue =
              typeof p.value === "string" && p.value.startsWith("'")
                ? p.value.slice(1, -1)
                : p.value;
            expect((obj as any)[propName]).toBe(expectedValue);
          }
        });
      }

      // Test with positional parameters
      it("should create an object with positional parameters", () => {
        const paramString = params.map((p) => p.value).join(", ");
        const input = `${name}(${paramString})`;
        const result = interpret(input);

        expect(result.objects).toHaveLength(1);
        const obj = result.objects[0].object;
        expect(obj).toBeInstanceOf(klass);

        const constructorParams = new klass().getParams();

        for (let i = 0; i < params.length; i++) {
          const p = params[i];
          const propName = constructorParams[i].actualName;
          const expectedValue =
            typeof p.value === "string" && p.value.startsWith("'")
              ? p.value.slice(1, -1)
              : p.value;

          if (propName) {
            //@ts-ignore
            expect((obj as any)[propName]).toBe(expectedValue);
          }
        }
      });

      // Test cloning
      it("should clone an object", () => {
        const paramString = params.map((p) => p.value).join(", ");
        const input = `${name}(${paramString}) as MyObject, !MyObject()`;
        const result = interpret(input);

        expect(result.objects).toHaveLength(2);
        const original = result.objects[0].object;
        const clone = result.objects[1].object;

        expect(clone).toBeInstanceOf(klass);
        expect(clone).not.toBe(original); // Ensure it's a different instance
        for (const p of params) {
          const propName = p.actualName;
          expect((clone as any)[propName]).toEqual((original as any)[propName]);
        }
      });

      // Test child to
      it("should create a child object", () => {
        const paramString = params.map((p) => p.value).join(", ");
        const input = `${name}(${paramString}) as ParentObject, ${name}(${paramString}) CHILD TO ParentObject`;
        const result = interpret(input);

        expect(result.objects).toHaveLength(2);
        const parent = result.objects[0].object;
        const child = result.objects[1].object;

        expect(child.parent).toBe(parent);
      });

      // Test modifiers
      if (name === "Rectangle") {
        it("should apply the color modifier", () => {
          const input = `${name}(color: 'red') SET Color('blue')`;
          const result = interpret(input);
          const obj = result.objects[0].object;
          expect((obj as any).color.image).toBe("blue");
        });
      }

      it("should apply the layer modifier", () => {
        const input = `${name}() SET Layer('myLayer')`;
        const result = interpret(input);
        const obj = result.objects[0].object;
        expect(obj.layer.name).toBe("myLayer");
      });
    });
  }
});
