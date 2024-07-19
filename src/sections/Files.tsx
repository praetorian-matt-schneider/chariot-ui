import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownCircleIcon,
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { FolderIcon } from '@heroicons/react/24/solid';

import { Accordian } from '@/components/Accordian';
import { Button } from '@/components/Button';
import FileViewer from '@/components/FileViewer';
import { RisksIcon } from '@/components/icons';
import { Modal } from '@/components/Modal';
import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import { Tooltip } from '@/components/Tooltip';
import { Body } from '@/components/ui/Body';
import { NoData } from '@/components/ui/NoData';
import { useDownloadFile, useMy } from '@/hooks';
import { RenderHeaderExtraContentSection } from '@/sections/AuthenticatedApp';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { useGlobalState } from '@/state/global.state';
import { MyFile } from '@/types';
import { cn } from '@/utils/classname';

const TreeData: Folder[] = [
  { label: 'home', query: 'home' },
  {
    label: 'malware',
    query: 'malware',
    children: (files: MyFile[], parentQuery: string): Folder[] => {
      const labelsWithDuplicates = files.map(
        ({ name }) => name.split(parentQuery)[1].split('/')[1]
      );
      const labels = [...new Set(labelsWithDuplicates)];

      return labels.map(label => {
        return {
          label,
          data: files.filter(({ name }) =>
            name.includes(`${parentQuery}/${label}`)
          ),
        };
      });
    },
  },
];

const Files: React.FC = () => {
  const navigate = useNavigate();
  const { getRiskDrawerLink, getProofOfExploitLink } = getDrawerLink();
  const [filename, setFilename] = React.useState('');
  const [filetype, setFiletype] = React.useState('');

  const {
    modal: {
      file: { onOpenChange: setIsUploadFileDialogOpen },
    },
  } = useGlobalState();

  const { mutate: downloadFile } = useDownloadFile();

  function handleDownload(item: MyFile) {
    downloadFile({ name: item.name });
  }

  const getAdditionalActions = (item: MyFile) => {
    if (item.class === 'proof') {
      const parts = item.name.split('/');
      const dns = parts.shift() ?? '';
      const name = parts.join('/') ?? '';
      const riskDrawerLink = getRiskDrawerLink({ dns, name });
      const OthersLink = getProofOfExploitLink({ dns, name });

      return (
        <div className="flex flex-row justify-end space-x-1">
          <Tooltip title="View Risk">
            <button
              onClick={() => navigate(riskDrawerLink)}
              className="m-0 p-0"
            >
              <RisksIcon className="size-5" />
            </button>
          </Tooltip>
          <Tooltip title="View Proof">
            <button onClick={() => navigate(OthersLink)}>
              <DocumentTextIcon className="size-5" />
            </button>
          </Tooltip>
        </div>
      );
    } else if (item.name.endsWith('png') || item.name.endsWith('jpg')) {
      return (
        <div className="flex flex-row justify-end">
          <Tooltip title="Preview Image">
            <button
              onClick={() => {
                setFiletype('image');
                setFilename(item.name);
              }}
            >
              <PhotoIcon className="size-5" />
            </button>
          </Tooltip>
        </div>
      );
    } else {
      return (
        <div className="flex flex-row justify-end">
          <Tooltip title="View File">
            <button
              onClick={() => {
                setFiletype('text');
                setFilename(item.name);
              }}
            >
              <DocumentIcon className="size-5" />
            </button>
          </Tooltip>
        </div>
      );
    }
  };

  const columns: Columns<MyFile> = [
    {
      label: 'Preview',
      id: 'name',
      className: 'w-20',
      cell: (item: MyFile) => getAdditionalActions(item),
    },
    {
      label: 'Document Name',
      id: 'name',
      className: 'w-full',
    },
    {
      label: 'Added',
      id: 'updated',
      cell: 'date',
    },
    {
      label: 'Actions',
      id: '',
      cell: (item: MyFile) => (
        <div className="flex w-full flex-row justify-center">
          <Tooltip title={'Download'}>
            <button
              onClick={() => handleDownload(item)}
              className="block cursor-pointer"
            >
              <ArrowDownCircleIcon className="m-1 size-5 stroke-2" />
            </button>
          </Tooltip>
        </div>
      ),
      fixedWidth: 120,
      align: 'center',
    },
  ];

  return (
    <Body>
      <div className="flex w-full flex-col">
        <RenderHeaderExtraContentSection>
          <div className="flex justify-between">
            <Button
              startIcon={<PlusIcon className="size-5" />}
              label={'Add Document'}
              onClick={() => {
                setIsUploadFileDialogOpen(true);
              }}
              styleType="header"
              className="ml-auto rounded-none rounded-l-[2px]"
            />
          </div>
        </RenderHeaderExtraContentSection>
        <Tree tree={TreeData} columns={columns} />
        <Modal
          open={filename.length > 0 && filetype.length > 0}
          onClose={() => setFilename('')}
          title="File Content"
        >
          <FileViewer fileName={filename} fileType={filetype} />
        </Modal>
      </div>
    </Body>
  );
};

interface TreeProps {
  tree: Folder[];
  columns: Columns<MyFile>;
}

const Tree = ({ tree, columns }: TreeProps) => {
  return (
    <>
      {tree.map(item => (
        <TreeLevel key={item.label} columns={columns} {...item} />
      ))}
    </>
  );
};

interface Folder {
  label: string;
  query?: string; // Add query string if we need to fetch the data from /my?key=#files endpoint
  /**
   * children can be of the following:
   * Folder[] : when we know the children queries and labels
   * () => Folder[] : when the children queries and labels are dynamically generated
   */
  children?: Folder[] | ((files: MyFile[], parentQuery: string) => Folder[]);
  level?: number;
  // if data is available, pass it directly to display the files in the table
  data?: MyFile[];
}

const TreeLevel = ({
  columns = [],
  query = '',
  label = '',
  children,
  data,
  level = 0,
}: Folder & { columns: Columns<MyFile> }) => {
  const {
    status,
    data: files = [],
    error,
  } = useMy(
    {
      resource: 'file',
      query: query ? `#${query}` : '',
    },
    { enabled: Boolean(query) }
  );
  const {
    modal: {
      file: { onOpenChange: setIsUploadFileDialogOpen },
    },
  } = useGlobalState();

  const noData = {
    title: 'No Documents Found',
    description: (
      <p>
        No documents have been attached to your account yet.
        <br />
        Remedy that by{' '}
        <Button
          className="inline p-0 text-base"
          onClick={() => {
            setIsUploadFileDialogOpen(true);
          }}
          styleType="textPrimary"
        >
          Uploading a file now
        </Button>
      </p>
    ),
  };
  const childFolders = useMemo(
    () =>
      children && typeof children === 'function'
        ? children(files, query)
        : undefined,
    [children, files, query]
  );
  console.log(label, data || files, !children);

  return (
    <Accordian
      className={cn('bg-layer0 z-10', level > 0 && '-ml-4 -mr-4')}
      defaultOpen={false}
      title={label}
      icon={<FolderIcon className="size-5 text-brand-light" />}
    >
      {children &&
        typeof children === 'object' &&
        Array.isArray(children) &&
        children.map(item => (
          <TreeLevel
            {...item}
            key={item.label}
            level={level + 1}
            columns={columns}
          />
        ))}
      {childFolders && childFolders.length === 0 && (
        <NoData title={noData?.title} description={noData?.description} />
      )}
      {childFolders &&
        childFolders.map(group => (
          <>
            <TreeLevel
              {...group}
              key={group.label}
              level={level + 1}
              columns={columns}
            />
          </>
        ))}
      {!children && (
        <Table
          name={label}
          loadingRowCount={5}
          isTableView={false}
          columns={columns}
          data={data || files}
          error={data ? null : error}
          status={data ? 'success' : status}
          skipHeader={true}
          noData={noData}
        />
      )}
    </Accordian>
  );
};

export default Files;
