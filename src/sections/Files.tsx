import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownCircleIcon,
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/Button';
import FileViewer from '@/components/FileViewer';
import { RisksIcon } from '@/components/icons';
import { Modal } from '@/components/Modal';
import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import { Tooltip } from '@/components/Tooltip';
import { useDownloadFile, useMy } from '@/hooks';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { useGlobalState } from '@/state/global.state';
import { MyFile } from '@/types';

const Files: React.FC = () => {
  const navigate = useNavigate();
  const { getRiskDrawerLink, getProofOfExploitLink } = getDrawerLink();
  const [filename, setFilename] = React.useState('');
  const [filetype, setFiletype] = React.useState('');
  const {
    status,
    data: files = [],
    error,
    isFetchingNextPage,
    fetchNextPage,
  } = useMy({
    resource: 'file',
    filterByGlobalSearch: true,
  });

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

  const types = getFileTypes(files);

  return (
    <div className="flex w-full flex-col">
      <Table
        columns={columns}
        data={files}
        resize={true}
        error={error}
        status={status}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        primaryAction={() => {
          return {
            startIcon: <PlusIcon className="size-5" />,
            label: 'Add Document',
            onClick: () => {
              setIsUploadFileDialogOpen(true);
            },
          };
        }}
        name="documents"
        noData={{
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
        }}
        groupBy={types.map(type => ({
          label: type,
          filter: (data: MyFile) => {
            if (type === 'Others') {
              return !FileStartWith.find(prefix =>
                data.name.startsWith(prefix)
              );
            }

            const prefixMatch = data.name.startsWith(type);
            if (type === 'definitions') {
              return prefixMatch && !data.name.startsWith('definitions/files');
            }

            return prefixMatch;
          },
        }))}
      />
      <Modal
        open={filename.length > 0 && filetype.length > 0}
        onClose={() => setFilename('')}
        title="File Content"
      >
        <FileViewer fileName={filename} fileType={filetype} />
      </Modal>
    </div>
  );
};

/**
 * There are 2 conditions left (for now adding them to Others):
 * - If someone manually uploads
 * - If there is Proof of exploit with dns/name
 */
const FileStartWith = [
  'cti/kev',
  'definitions/files',
  'definitions',
  'export-',
  '#profile',
  'proof-of-exploit/files',
];

const getFileTypes = (files: MyFile[]) => {
  const types = files.reduce((acc, file) => {
    const prefix = FileStartWith.find(prefix => file.name.startsWith(prefix));
    if (prefix) {
      acc.add(prefix);
    } else {
      acc.add('Others');
    }
    return acc;
  }, new Set<string>());

  return Array.from(types);
};

export default Files;
