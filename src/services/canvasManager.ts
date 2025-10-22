import { ondraw } from '@/services/instructions/draw';
import { createVectors } from '@/services/instructions/create-vectors';
import { lint } from '@/services/linter';
import { state } from '@/services/state';
import { toast } from 'vue-sonner';
import type { Project } from '@/mocks/types';

export function redrawCanvas(code: string, canvasSize: Project['canvasSize']): boolean {
    console.log("[canvasManager.ts] redrawCanvas called");
    const { lexErrors, parseErrors, semanticErrors } = lint(code);
    const totalErrors = lexErrors.length + parseErrors.length + semanticErrors.length;

    if (totalErrors > 0) {
        toast.error('Canvas creation failed', {
            description: `Please fix the ${totalErrors} error${totalErrors > 1 ? 's' : ''} before proceeding.`,
        });
        return false;
    }

    try {
        const result = createVectors(code);
        if (result && result.objects) {
            state.vectorsArray = result;
            ondraw(canvasSize);
            return true;
        }
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            toast.error('Canvas creation failed', {
                description: err.message || 'An unexpected error occurred.',
            });
        } else {
            toast.error('Canvas creation failed', {
                description: 'An unexpected error occurred.',
            });
        }
    }
    return false;
}
