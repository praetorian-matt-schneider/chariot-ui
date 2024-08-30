import { type Node } from '@xyflow/react';

export function positionVerticalNodes(
  nodes: Node[],
  x: number,
  parentId: string
): Node[] {
  return nodes.reduce((acc, node) => {
    if (acc.length === 0) {
      const nodeMarginTop = Number(node.style?.marginTop || 0);

      return [
        {
          ...node,
          position: { x, y: nodeMarginTop },
          parentId,
          extent: 'parent',
        },
      ];
    }
    const prevNode = acc[acc.length - 1];
    const nodeMarginTop = Number(node.style?.marginTop || 0);

    const y =
      prevNode.position.y +
      (prevNode.height || 0) +
      Number(prevNode?.style?.marginBottom || 0) +
      nodeMarginTop;

    return [
      ...acc,
      {
        ...node,
        position: { x, y },
        parentId,
        extent: 'parent',
      },
    ];
  }, [] as Node[]);
}

export function createVerticalContainer(props: {
  nodes: Node[];
  containerPaddingX: number;
  containerMargin: number;
  parentId: string;
  direction: 'left' | 'right';
}): Node[] {
  const { nodes, containerPaddingX, parentId, containerMargin, direction } =
    props;

  const nodesMaxWidth = nodes.reduce((acc, node) => {
    return (node.width || 0) > acc ? node.width || 0 : acc;
  }, 0);

  const positionedNodes = positionVerticalNodes(
    nodes,
    containerPaddingX,
    parentId
  );

  const lastNode = positionedNodes[positionedNodes.length - 1];
  const firstNode = positionedNodes[0];

  const totalHeight =
    lastNode.position.y +
    (lastNode.height || 0) +
    Number(lastNode.style?.marginBottom || 0);

  const containerWidth = nodesMaxWidth + containerPaddingX * 2;
  const x =
    direction === 'left'
      ? -(containerMargin + containerWidth)
      : containerMargin + nodesMaxWidth;

  return [
    {
      id: parentId,
      type: 'group',
      data: { label: 'test' },
      position: {
        x,
        y: -(
          (firstNode.height || 0) + Number(firstNode.style?.marginBottom || 0)
        ),
      },
      width: nodesMaxWidth + containerPaddingX * 2,
      height: totalHeight,
      style: {
        backgroundColor: 'transparent',
        border: 'none',
      },
    },
    ...positionedNodes,
  ];
}
