import { type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
import { localCompletionSource } from "@codemirror/lang-javascript";
import p5 from "p5";

// Cache the completions so we don't generate them every time
let p5Completions: { label: string; type: "function" | "property" }[] | null = null;

function generateP5Completions(): { label: string; type: 'function' | 'property' }[] {
    if (p5Completions) {
        return p5Completions;
    }

    const completions: { label: string; type: 'function' | 'property' }[] = [];
    const seen = new Set<string>();

    const processPrototype = (proto: any) => {
        if (!proto) return;
        for (const key of Object.getOwnPropertyNames(proto)) {
            if (key.startsWith('_') || key === 'constructor' || seen.has(key)) {
                continue;
            }

            seen.add(key);

            try {
                const property = proto[key];
                if (typeof property === 'function') {
                    completions.push({ label: key, type: 'function' });
                } else {
                    completions.push({ label: key, type: 'property' });
                }
            } catch (e) {
                // Ignore errors on property access
            }
        }
    };

    // Process both the main p5 prototype and the graphics prototype
    processPrototype(p5.prototype);
    processPrototype((p5 as any).Graphics.prototype);

    p5Completions = completions.sort((a, b) => a.label.localeCompare(b.label));
    return p5Completions;
}

export const p5CompletionSource = (context: CompletionContext): CompletionResult | null => {
    console.log("p5CompletionSource called");
    const word = context.matchBefore(/_m\.\w*/)

    if (word) {
        console.log("match found", word);
        const completions = generateP5Completions();
        console.log("completions", completions);
        return {
            from: word.from + 3, // Start after "_m."
            options: completions
        };
    }

    console.log("no match, delegating to localCompletionSource");
    return localCompletionSource(context);
};