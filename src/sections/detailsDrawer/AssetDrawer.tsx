import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  Background,
  ControlButton,
  Controls,
  type Edge,
  Handle,
  type Node,
  PanOnScrollMode,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';

import { Button } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import { getRiskSeverityIcon } from '@/components/icons/RiskSeverity.icon';
import { Loader } from '@/components/Loader';
import { useMy } from '@/hooks';
import { PartialAsset } from '@/hooks/useAssets';
import { useGenericSearch } from '@/hooks/useGenericSearch';
import { useReRunJob } from '@/hooks/useJobs';
import { buildOpenRiskDataset, RiskSummary } from '@/sections/Assets';
import { AddAttribute } from '@/sections/detailsDrawer/AddAttribute';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { Asset, Attribute, Risk, RiskStatus, RiskStatusLabel } from '@/types';
import { cn } from '@/utils/classname';
import { formatDate } from '@/utils/date.util';
import { getSeverityClass } from '@/utils/getSeverityClass.util';
import { useGetScreenSize } from '@/utils/misc.util';
import { createVerticalContainer } from '@/utils/reactFlor.util';
import { Regex } from '@/utils/regex.util';
import { getRiskSeverity, getRiskStatus } from '@/utils/riskStatus.util';
import { StorageKey } from '@/utils/storage/useStorage.util';
import { useSearchParams } from '@/utils/url.util';

interface Props {
  compositeKey: string;
  open: boolean;
}

const { getAssetDrawerLink, getRiskDrawerLink } = getDrawerLink();

export const AssetDrawer: React.FC<Props> = ({ compositeKey, open }) => {
  const [, dns, name] = compositeKey.split('#');
  const riskFilter = `#${dns}`;
  const attributeFilter = `source:#asset#${dns}#${name}`;
  const childAssetsFilter = `#source##asset#${dns}#${name}`;

  const { removeSearchParams } = useSearchParams();
  const navigate = useNavigate();

  const { data: assets = [], status: assetsStatus } = useMy(
    {
      resource: 'asset',
      query: compositeKey,
    },
    { enabled: open }
  );
  const { data: attributesGenericSearch, status: attributesStatus } =
    useGenericSearch(
      {
        query: attributeFilter,
        exact: true,
      },
      { enabled: open }
    );

  const { data: childAssetsAttributes, status: childAssetsStatus } = useMy(
    {
      resource: 'attribute',
      query: childAssetsFilter,
    },
    { enabled: open }
  );

  const { data: risks = [], status: risksStatus } = useMy(
    {
      resource: 'risk',
      query: riskFilter,
    },
    { enabled: open }
  );
  const { data: allRisks = [] } = useMy(
    {
      resource: 'risk',
    },
    { enabled: open }
  );

  const { mutateAsync: runJob } = useReRunJob();

  const openRiskDataset = useMemo(
    () => buildOpenRiskDataset(risks as Risk[]),
    [JSON.stringify(risks)]
  );

  const openAllRiskDataset = useMemo(
    () => buildOpenRiskDataset(allRisks as Risk[]),
    [JSON.stringify(allRisks)]
  );

  const asset: Asset = assets[0] || {};

  const assetWithRisk = { ...asset, riskSummary: openRiskDataset[asset.dns] };

  const isInitialLoading =
    assetsStatus === 'pending' ||
    risksStatus === 'pending' ||
    attributesStatus === 'pending' ||
    childAssetsStatus === 'pending';

  const openRisks = useMemo(() => {
    const sortOrder = ['C', 'H', 'M', 'L', 'I'];
    return risks
      .filter(({ status }) => getRiskStatus(status) === RiskStatus.Opened)
      .sort((a, b) => {
        return (
          sortOrder.indexOf(a.status[1]) - sortOrder.indexOf(b.status[1]) ||
          new Date(b.updated).getTime() - new Date(a.updated).getTime()
        );
      });
  }, [JSON.stringify(risks)]);

  const assetGraphProps = useMemo((): Pick<
    AssetGraphProps,
    'child' | 'parent'
  > => {
    return {
      child: childAssetsAttributes.map(attribute => {
        const [, assetdns, assetname] =
          attribute.source.match(Regex.ASSET_KEY) || [];
        const riskSummary = openAllRiskDataset[assetdns];

        return {
          key: attribute.source,
          name: assetname,
          dns: assetdns,
          updated: attribute.updated,
          riskSummary,
        };
      }),
      parent:
        attributesGenericSearch?.attributes
          ?.filter?.(attribute => {
            return (
              attribute.name === 'source' &&
              attribute.value.match(Regex.ASSET_KEY) &&
              attribute.value !== asset.key
            );
          })
          .map(attribute => {
            const [, assetdns, assetname] =
              attribute.value.match(Regex.ASSET_KEY) || [];
            const riskSummary = openAllRiskDataset[assetdns];

            return {
              key: attribute.value,
              name: assetname,
              dns: assetdns,
              updated: attribute.updated,
              riskSummary,
            };
          }) || [],
    };
  }, [
    JSON.stringify({
      childAssetsAttributes,
      parentAttributes: attributesGenericSearch?.attributes,
      openAllRiskDataset,
      asset,
    }),
  ]);

  return (
    <Drawer
      open={open}
      onClose={() => removeSearchParams(StorageKey.DRAWER_COMPOSITE_KEY)}
      onBack={() => navigate(-1)}
      className={cn('w-full rounded-t-lg pb-0 shadow-lg overflow-hidden')}
      contentClassName="flex"
    >
      <Loader isLoading={isInitialLoading} type="spinner">
        <ResponsiveGrid
          section1={<RiskList risks={openRisks} />}
          section2={
            <>
              <div className="flex flex-wrap justify-between gap-4 px-9 pt-6">
                <div className="max-w-1/2 flex flex-col gap-2">
                  <h1 className="text-2xl font-bold">{asset.name}</h1>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      styleType="secondary"
                      className="text-nowrap px-3 py-2"
                      endIcon={<ArrowPathIcon className="size-4" />}
                      onClick={() => {
                        runJob({
                          capability: 'nuclei',
                          jobKey: `#asset#${asset.name}#${asset.dns}`,
                        });
                      }}
                    >
                      Scan now
                    </Button>
                  </div>
                </div>
                <div className="max-w-1/2 flex flex-col gap-2">
                  <div className="flex items-start text-nowrap text-slate-600">
                    DNS:
                    <p
                      className="-mt-0.5 ml-1 text-wrap font-bold text-slate-950"
                      style={{ wordBreak: 'break-word' }}
                    >
                      {asset.dns}
                    </p>
                  </div>
                  <div className="flex items-center text-nowrap text-slate-600">
                    Last Seen:
                    <p className="ml-1 font-bold text-slate-950">
                      {formatDate(asset.updated)}
                    </p>
                  </div>
                  <div className="flex items-center text-nowrap text-slate-600">
                    First Seen:
                    <p className="ml-1 font-bold text-slate-950">
                      {formatDate(asset.created)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="size-full">
                <AssetsGraph {...assetGraphProps} asset={assetWithRisk} />
              </div>
            </>
          }
          section3={
            <AttributeList
              attributes={attributesGenericSearch?.attributes || []}
              resourceKey={asset.key}
            />
          }
        />
      </Loader>
    </Drawer>
  );
};

interface RiskListProps {
  risks: Risk[];
}
function RiskList(props: RiskListProps) {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <h1 className="sticky top-0 border-b border-gray-300 bg-white px-9 py-5 text-2xl font-bold">
        Risks
      </h1>
      <div className="size-full overflow-auto">
        {props.risks.length === 0 && (
          <div className="px-10 py-3">
            {`No risks have been detected for this asset. However, it's always a good practice to regularly monitor and scan for any new potential threats.`}
          </div>
        )}
        {props.risks.map((risk, index) => {
          const riskStatusKey = getRiskStatus(risk.status);

          return (
            <div
              key={index}
              className={cn(
                'gap-3 px-10 py-3',
                getSeverityClass(getRiskSeverity(risk.status)),
                'border-b border-gray-300'
              )}
            >
              <div className="flex w-full items-center gap-2">
                {getRiskSeverityIcon(getRiskSeverity(risk.status), 'size-5')}
                <p className="text-sm font-medium text-slate-900">
                  {RiskStatusLabel[riskStatusKey]}
                </p>
                <p className="ml-auto text-base font-medium text-slate-600">
                  {formatDate(risk.updated)}
                </p>
              </div>
              <div
                className="cursor-pointer text-indigo-500 hover:underline"
                style={{ wordBreak: 'break-word' }}
                onClick={() => {
                  navigate(getRiskDrawerLink(risk));
                }}
              >
                {risk.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AttributeListProps {
  attributes: Attribute[];
  resourceKey: string;
}
function AttributeList(props: AttributeListProps) {
  return (
    <div className="flex h-full flex-col">
      <h1 className="sticky top-0 border-b border-gray-300 bg-white px-9 py-5 text-2xl font-bold">
        <p>Attributes</p>
        <AddAttribute resourceKey={props.resourceKey} />
      </h1>
      <div className="size-full overflow-auto">
        {props.attributes.map((attribute, index) => {
          return (
            <div
              key={index}
              className={cn('gap-3 px-10 py-3', 'border-b border-gray-300')}
            >
              <div className="flex w-full items-center gap-2">
                <p className="text-sm font-medium text-slate-600">
                  {attribute.name}
                </p>
                <p className="ml-auto text-base font-medium text-slate-600">
                  {formatDate(attribute.updated)}
                </p>
              </div>
              <div
                className="text-base font-semibold"
                style={{ wordBreak: 'break-word' }}
              >
                {attribute.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AssetGraphProps {
  child: PartialAsset[];
  parent: PartialAsset[];
  asset: PartialAsset;
}

function ReactNodeElComponent({
  data,
}: {
  data: {
    children: ReactNode;
    className?: string;
    showHandles?: boolean;
    nodeStyle?: boolean;
  };
}) {
  return (
    <div
      className={cn(
        data.nodeStyle && 'h-full rounded border border-gray-800 bg-white',
        data.className
      )}
    >
      {data.showHandles && <Handle type="target" position={Position.Left} />}
      {data.children}
      {data.showHandles && <Handle type="source" position={Position.Right} />}
    </div>
  );
}

const ReactNodeEl = memo(ReactNodeElComponent);

function AssetNodeComponent({
  data,
}: {
  data: { asset: PartialAsset; className?: string; isSelected?: boolean };
}) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'rounded bg-white flex justify-start overflow-hidden hover:cursor-pointer px-2 py-1 group',
        data.isSelected
          ? 'border-[3px] border-indigo-500'
          : 'border border-gray-800',
        data.className
      )}
      onClick={() => {
        navigate(getAssetDrawerLink(data.asset));
      }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="shrink-0">
        <RiskSummary riskSummary={data.asset.riskSummary} />
      </div>
      <div className="flex flex-col overflow-hidden">
        <div className="w-full truncate text-indigo-500 group-hover:underline">
          {data.asset.name}
        </div>
        <div className="w-full truncate">{data.asset.dns}</div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const AssetNode = memo(AssetNodeComponent);

const nodeTypes = {
  react: ReactNodeEl,
  asset: AssetNode,
};

const dimensions = {
  nodeWidth: 350,
  nodeHeight: 60,
  nodeMarginBottom: 20,

  moreNodeHeight: 40,
  labelMarginBottom: 10,

  xGapBetweenNodes: 50,

  containerPaddingX: 20,
  containerLabelHeight: 20,
};
const defaultNodeShowCount = 3;

export function AssetsGraph(props: AssetGraphProps) {
  const { fitView } = useReactFlow();
  const [parentNMore, setParentNMore] = useState(0);
  const [childNMore, setChildNMore] = useState(0);

  const getNodeAndLinks = useCallback((): { nodes: Node[]; edges: Edge[] } => {
    const assetNode: Node = {
      id: props.asset.key,
      type: 'asset',
      position: {
        x: 0,
        y: 0,
      },
      data: {
        asset: props.asset,
        isSelected: true,
      },
      connectable: false,
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      width: dimensions.nodeWidth,
      height: dimensions.nodeHeight,
      selectable: true,
    };

    const nodes: Node[] = [assetNode];
    const links: Edge[] = [];

    const showNChild = defaultNodeShowCount + childNMore;
    const showNParent = defaultNodeShowCount + childNMore;

    if (props.parent.length > 0) {
      const parentNodes: Node[] = [];

      parentNodes.push({
        id: 'parentAssetsLabel',
        type: 'react',
        draggable: false,
        selectable: false,
        data: {
          children: 'Parent Assets',
        },
        position: {
          x: 0,
          y: 0,
        },
        height: dimensions.containerLabelHeight,
        width: dimensions.nodeWidth,
        style: {
          display: 'flex',
          justifyContent: 'center',
          marginBottom: dimensions.labelMarginBottom,
        },
      });

      parentNodes.push(
        ...props.parent.slice(0, showNParent).map((asset): Node => {
          return {
            id: asset.key,
            position: {
              x: 0,
              y: 0,
            },
            type: 'asset',
            data: { asset },
            targetPosition: Position.Left,
            sourcePosition: Position.Right,
            height: dimensions.nodeHeight,
            width: dimensions.nodeWidth,
            selectable: true,
            style: {
              marginBottom: dimensions.nodeMarginBottom,
            },
          };
        })
      );

      if (props.parent.length > showNParent) {
        parentNodes.push({
          id: 'more-parent',
          position: {
            x: 0,
            y: 0,
          },
          type: 'react',
          data: {
            children: (
              <div
                className="flex size-full items-center justify-center"
                onClick={() => {
                  setParentNMore(prevNMore => prevNMore + 5);
                }}
              >{`+${props.parent.length - showNParent} more`}</div>
            ),
            showHandles: true,
            nodeStyle: true,
          },
          targetPosition: Position.Left,
          sourcePosition: Position.Right,
          height: dimensions.moreNodeHeight,
          width: dimensions.nodeWidth,
          selectable: true,
          style: {
            marginBottom: dimensions.nodeMarginBottom,
          },
        });
      }

      nodes.push(
        ...createVerticalContainer({
          nodes: parentNodes,
          containerPaddingX: dimensions.containerPaddingX,
          containerMargin: dimensions.xGapBetweenNodes,
          parentId: 'parentGroup',
          direction: 'left',
        })
      );

      links.push(
        ...parentNodes.map((node): Edge => {
          return {
            id: `${assetNode.id}-${node.id}`,
            source: node.id,
            target: assetNode.id,
            type: 'smoothstep',
            animated: true,
          };
        })
      );
    }

    if (props.child.length > 0) {
      const childNodes: Node[] = [];

      childNodes.push({
        id: 'childAssetsLabel',
        type: 'react',
        draggable: false,
        selectable: false,
        data: {
          children: 'Child Assets',
        },
        position: {
          x: 0,
          y: 0,
        },
        height: dimensions.containerLabelHeight,
        width: dimensions.nodeWidth,
        style: {
          display: 'flex',
          justifyContent: 'center',
          marginBottom: dimensions.labelMarginBottom,
        },
      });

      childNodes.push(
        ...props.child.slice(0, showNChild).map((asset): Node => {
          return {
            id: asset.key,
            position: {
              x: 0,
              y: 0,
            },
            type: 'asset',
            data: { asset },
            targetPosition: Position.Left,
            sourcePosition: Position.Right,
            height: dimensions.nodeHeight,
            width: dimensions.nodeWidth,
            selectable: true,
            style: {
              marginBottom: dimensions.nodeMarginBottom,
            },
          };
        })
      );

      if (props.child.length > showNChild) {
        childNodes.push({
          id: 'more-child',
          position: {
            x: 0,
            y: 0,
          },
          type: 'react',
          data: {
            children: (
              <div
                className="flex size-full items-center justify-center"
                onClick={() => {
                  setChildNMore(prevNMore => prevNMore + 5);
                }}
              >{`+${props.child.length - showNChild} more`}</div>
            ),
            showHandles: true,
            nodeStyle: true,
          },
          targetPosition: Position.Left,
          sourcePosition: Position.Right,
          height: dimensions.moreNodeHeight,
          width: dimensions.nodeWidth,
          selectable: true,
          style: {
            marginBottom: dimensions.nodeMarginBottom,
          },
        });
      }

      nodes.push(
        ...createVerticalContainer({
          nodes: childNodes,
          containerPaddingX: dimensions.containerPaddingX,
          containerMargin: dimensions.xGapBetweenNodes,
          parentId: 'childGroup',
          direction: 'right',
        })
      );

      links.push(
        ...childNodes.map((node): Edge => {
          return {
            id: `${assetNode.id}-${node.id}`,
            source: assetNode.id,
            target: node.id,
            type: 'smoothstep',
            animated: true,
          };
        })
      );
    }

    return {
      nodes: nodes,
      edges: links,
    };
  }, [
    JSON.stringify({
      parent: props.parent,
      child: props.child,
      asset: props.asset,
    }),
    parentNMore,
    childNMore,
  ]);

  const { nodes: initialNodes, edges: initialEdges } = getNodeAndLinks();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  function reCenter() {
    fitView({
      duration: 400,
      nodes: [{ id: props.asset.key }],
      padding: 3,
    });
  }

  useEffect(() => {
    const { nodes, edges } = getNodeAndLinks();

    setNodes(nodes);
    setEdges(edges);

    setTimeout(() => {
      window.requestAnimationFrame(() => {
        reCenter();
      });
    }, 0);
  }, [getNodeAndLinks]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      panOnScroll
      fitView
      elementsSelectable={false}
      nodesConnectable={false}
      nodesDraggable={false}
      zoomOnScroll={false}
      panOnScrollMode={PanOnScrollMode.Vertical}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
    >
      <Controls
        fitViewOptions={{
          duration: 400,
        }}
        showInteractive={false}
      >
        <ControlButton onClick={reCenter}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="30"
            viewBox="0 0 32 30"
            fill="none"
          >
            <g clipPath="url(#clip0_2_2)">
              <path
                d="M3.692 4.63005C3.692 4.10005 4.092 3.69205 4.631 3.69205H9.846V5.23661e-05H4.708C2.13 5.23661e-05 0 2.05405 0 4.63005V9.84605H3.692V4.63005ZM27.354 5.23661e-05H22.154V3.69205H27.324C27.854 3.69205 28.308 4.09205 28.308 4.63105V9.84605H32V4.63105C32.0009 4.02138 31.8813 3.41753 31.6479 2.85428C31.4146 2.29102 31.0722 1.77947 30.6404 1.34906C30.2086 0.918646 29.6959 0.577878 29.1319 0.346362C28.5679 0.114845 27.9637 -0.00284906 27.354 5.23661e-05ZM28.308 24.8301C28.308 25.3621 27.908 25.7701 27.369 25.7701H22.154V29.5381H27.369C29.946 29.5381 32 27.4081 32 24.8311V19.6921H28.308V24.8301ZM4.631 25.7701C4.1 25.7701 3.692 25.3701 3.692 24.8301V19.6921H0V24.8311C0 27.4081 2.13 29.5381 4.708 29.5381H9.846V25.7701H4.631Z"
                fill="black"
              />
              <circle cx="16" cy="15" r="5" fill="black" />
            </g>
            <defs>
              <clipPath id="clip0_2_2">
                <rect width="32" height="30" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </ControlButton>
      </Controls>
      <Background color="#eee" size={3} />
    </ReactFlow>
  );
}

interface ResponsiveGridProps {
  section1: ReactNode;
  section2: ReactNode;
  section3: ReactNode;
}

export function ResponsiveGrid(props: ResponsiveGridProps) {
  const sideSectionMinWidth = '300px';
  const screenSize = useGetScreenSize();

  return (
    <div
      className="grid w-full"
      style={
        screenSize.maxMd
          ? {
              gridTemplateAreas: `'section2' 'section1' 'section3'`,
              gridTemplateColumns: `auto`,
              gridTemplateRows: '75% auto auto',
            }
          : screenSize.maxLg
            ? {
                gridTemplateAreas: `'section2 section3' 'section2 section1'`,
                gridTemplateColumns: `auto ${sideSectionMinWidth}`,
                gridTemplateRows: '50% 50%',
              }
            : {
                display: 'grid',
                gridTemplateAreas: `'section1 section2 section3'`,
                gridTemplateColumns: `minmax(${sideSectionMinWidth}, 25%) auto minmax(${sideSectionMinWidth}, 25%)`,
                gridTemplateRows: '100%',
              }
      }
    >
      <div
        className={cn(
          'border-gray-300',
          screenSize.maxMd
            ? 'border-t border-b'
            : screenSize.maxLg
              ? 'border-l border-t'
              : 'border-r'
        )}
        style={{ gridArea: 'section1' }}
      >
        {props.section1}
      </div>
      <div
        className="flex w-full flex-col gap-4"
        style={{ gridArea: 'section2' }}
      >
        {props.section2}
      </div>
      <div
        className={cn('border-l border-gray-300')}
        style={{ gridArea: 'section3' }}
      >
        {props.section3}
      </div>
    </div>
  );
}
