export const languageModel = {
  objects: {
    'Rectangle': {
      params: [
        { name: 'x', type: 'Number' },
        { name: 'y', type: 'Number' },
        { name: 'width', type: 'Number' },
        { name: 'height', type: 'Number' },
        { name: 'color', type: 'any' },
      ]
    },
    'Line': {
      params: [
        { name: 'x', type: 'Number' },
        { name: 'y', type: 'Number' },
        { name: 'x2', type: 'Number' },
        { name: 'y2', type: 'Number' },
      ]
    },
    'Layer': {
        params: [
            { name: 'colorMode', type: 'string' },
        ]
    },
    'Custom': {
        params: [
            { name: 'ANYdraw', type: 'string' },
        ]
    },
    'Brush': {
        params: [
            { name: 'type', type: 'string' },
            { name: 'color', type: 'string' },
            { name: 'size', type: 'Number' },
        ]
    },
    'Field': {
        params: [
            { name: 'type', type: 'string' },
        ]
    },
    'Mirror': {
        params: [
            { name: 'x', type: 'Number' },
            { name: 'y', type: 'Number' },
            { name: 'axis', type: 'string' },
        ]
    }
  },
  keywords: ['AS', 'CHILD TO', 'SET'],
  modifiers: ['Color', 'Layer', 'Flip', 'Mirror']
};
