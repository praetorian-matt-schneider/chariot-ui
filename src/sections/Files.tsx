import React, { useMemo, useState } from 'react';
import { JSX } from 'react/jsx-runtime';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDownIcon,
  DocumentIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { ArrowDownTrayIcon, FolderIcon } from '@heroicons/react/24/solid';
import { useDebounce } from 'use-debounce';

import { Button } from '@/components/Button';
import { Dropdown } from '@/components/Dropdown';
import FileViewer from '@/components/FileViewer';
import { RisksIcon } from '@/components/icons';
import { Modal } from '@/components/Modal';
import { Tooltip } from '@/components/Tooltip';
import { Body } from '@/components/ui/Body';
import { NoData } from '@/components/ui/NoData';
import { useDownloadFile, useMy } from '@/hooks';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
import { useGlobalState } from '@/state/global.state';
import { MyFile } from '@/types';
import { cn } from '@/utils/classname';

interface Folder {
  label: string;
  query?: string;
  children?: Folder[] | ((files: MyFile[], parentQuery: string) => Folder[]);
  level?: number;
  data?: MyFile[];
}

const TreeData: Folder[] = [
  { label: 'Home', query: 'home' },
  {
    label: 'Malware',
    query: 'malware',
  },
  {
    label: 'Threats',
    query: 'threats',
  },
  {
    label: 'Assets',
    query: 'assets',
  },
  {
    label: 'Definitions',
    query: 'definitions',
  },
];

const Files: React.FC = () => {
  const navigate = useNavigate();
  const { getRiskDrawerLink, getProofOfExploitLink } = getDrawerLink();
  const [currentFolder, setCurrentFolder] = useState<Folder>({
    label: 'Home',
    query: 'home',
  });

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
      const othersLink = getProofOfExploitLink({ dns, name });

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
            <button onClick={() => navigate(othersLink)}>
              <DocumentTextIcon className="size-5" />
            </button>
          </Tooltip>
        </div>
      );
    } else if (item.name.endsWith('png') || item.name.endsWith('jpg')) {
      return (
        <div className="flex flex-row justify-end">
          <Tooltip title="Preview Image">
            <button onClick={() => {}}>
              <PhotoIcon className="size-5" />
            </button>
          </Tooltip>
        </div>
      );
    } else {
      return (
        <div className="flex flex-row justify-end">
          <Tooltip title="View File">
            <button onClick={() => {}}>
              <DocumentIcon className="size-5" />
            </button>
          </Tooltip>
        </div>
      );
    }
  };

  return (
    <>
      <Body className="bg-layer0 pb-4">
        <TreeLevel
          currentFolder={currentFolder}
          setCurrentFolder={setCurrentFolder}
          getAdditionalActions={getAdditionalActions}
          handleDownload={handleDownload}
        />
      </Body>
    </>
  );
};

export const FilesIcon = (
  props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>
) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    {/* SVG for My Files */}
    <path d="M12 2L2 12h3v8h14v-8h3L12 2zM10 16h4v2h-4v-2zm0-4h4v2h-4v-2zm0-4h4v2h-4v-2z" />
  </svg>
);

interface TreeLevelProps {
  currentFolder: Folder;
  setCurrentFolder: React.Dispatch<React.SetStateAction<Folder>>;
  getAdditionalActions: (item: MyFile) => React.ReactNode;
  handleDownload: (item: MyFile) => void;
}

const TreeLevel: React.FC<TreeLevelProps> = ({
  currentFolder,
  setCurrentFolder,
}) => {
  const { query = '', children } = currentFolder;
  const [filename, setFilename] = useState('');
  const [filetype, setFiletype] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const {
    modal: {
      file: { onOpenChange: setIsUploadFileDialogOpen },
    },
  } = useGlobalState();

  const { data: files = [] } = useMy(
    {
      resource: 'file',
      query: query ? `#${query}` : '',
    },
    { enabled: Boolean(query) }
  );

  const noData = {
    title: 'No Documents Found',
    description: (
      <p>
        No documents have been attached to your account yet.
        <br />
        Remedy that by{' '}
        <Button
          className="inline p-0 text-base"
          styleType="textPrimary"
          onClick={() => setIsUploadFileDialogOpen(true)}
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

  const filteredFiles = useMemo(
    () =>
      files.filter(file =>
        file.name.toLowerCase().includes(search.toLowerCase())
      ),
    [files, debouncedSearch]
  );

  return (
    <div className="">
      {childFolders && childFolders.length > 0 && (
        <div className="flex flex-row flex-wrap space-x-6">
          {childFolders.map(folder => (
            <div
              key={folder.label}
              className="flex cursor-pointer flex-col text-center"
              onClick={() => setCurrentFolder(folder)}
            >
              <FolderIcon className="size-12 text-brand-light" />
              <span className="mt-2 w-32 truncate whitespace-nowrap text-center text-sm font-medium">
                {folder.label}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center space-x-12 border-b border-gray-200 bg-gray-50 px-12 py-6">
        <div className="flex items-center space-x-2">
          <Dropdown
            menu={{
              items: TreeData.map(folder => ({
                label: folder.label,
                value: folder.query,
              })),
              onClick: value => {
                console.log('value', value);
                if (value) {
                  const label = value[0].toUpperCase() + value.slice(1);
                  setCurrentFolder({
                    label,
                    query: value,
                  });
                }
              },
            }}
            className="border border-gray-300 capitalize"
            startIcon={<FolderIcon className="size-6 text-brand-light" />}
            endIcon={<ChevronDownIcon className="size-4 text-gray-400" />}
          >
            {currentFolder.label}
          </Dropdown>
        </div>
        <div className="relative grow">
          <input
            placeholder="Search for files"
            value={search}
            name="file_search"
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-sm border border-gray-300 p-2.5 pl-12 "
          />
          <MagnifyingGlassIcon className="absolute left-4 top-3 size-5 text-gray-400" />
        </div>
        <Button
          className="rounded-sm border border-gray-300 px-6 py-3 text-sm"
          startIcon={<PlusIcon className="size-5" />}
          onClick={() => setIsUploadFileDialogOpen(true)}
        >
          Upload File
        </Button>
      </div>
      <div className="flex flex-row flex-wrap justify-center space-x-5 space-y-5">
        {filteredFiles.map((file, index) => (
          <div
            className={cn(
              'relative p-4 w-[230px] border border-gray-200 rounded-md hover:bg-gray-100',
              index === 0 && 'ml-4 mt-5'
            )}
            key={file.name}
          >
            <div className="flex flex-col items-center text-center">
              {file.name.endsWith('png') || file.name.endsWith('jpg') ? (
                <PhotoIcon className="size-20 text-gray-500" />
              ) : (
                <DocumentIcon className="size-20 text-gray-500" />
              )}
              <Tooltip title={file.name}>
                <button
                  onClick={() => {
                    setFilename(file.name);
                    setFiletype(
                      file.name.endsWith('png') || file.name.endsWith('jpg')
                        ? 'image'
                        : 'text'
                    );
                  }}
                  className="mt-2 w-full truncate whitespace-nowrap text-center text-sm font-medium text-brand hover:underline"
                >
                  {file.name}
                </button>
              </Tooltip>
            </div>
            <a
              href={`/download/${file.name}`}
              download
              className="absolute right-2 top-2 rounded-full border border-gray-300 bg-white p-1 shadow-sm hover:bg-gray-200"
            >
              <ArrowDownTrayIcon className="size-5 text-blue-600" />
            </a>
          </div>
        ))}
        {files.length === 0 && !childFolders && (
          <NoData title={noData.title} description={noData.description} />
        )}
      </div>
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

export default Files;
