import React, { useMemo, useState } from 'react';
import { JSX } from 'react/jsx-runtime';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  DocumentIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  CodeBracketSquareIcon,
  DocumentTextIcon,
  FolderIcon,
  HomeIcon,
  MapPinIcon,
  ServerIcon,
} from '@heroicons/react/24/solid';
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
import { formatDate } from '@/utils/date.util';

interface Folder {
  label: string;
  query?: string;
  children?: Folder[] | ((files: MyFile[], parentQuery: string) => Folder[]);
  level?: number;
  data?: MyFile[];
  icon?: JSX.Element;
}

const TreeData: Folder[] = [
  {
    label: 'Home',
    query: 'home',
    icon: <HomeIcon className="size-6" />,
  },
  {
    label: 'Malware',
    query: 'malware',
    icon: <CodeBracketSquareIcon className="size-6" />,
  },
  {
    label: 'Threats',
    query: 'threats',
    icon: <MapPinIcon className="size-6" />,
  },
  {
    label: 'Assets',
    query: 'assets',
    icon: <ServerIcon className="size-6" />,
  },
  {
    label: 'Definitions',
    query: 'definitions',
    icon: <DocumentTextIcon className="size-6" />,
  },
];

const Files: React.FC = () => {
  const navigate = useNavigate();
  const { getRiskDrawerLink, getProofOfExploitLink } = getDrawerLink();
  const [currentFolder, setCurrentFolder] = useState<Folder>(TreeData[0]);

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
  handleDownload,
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
        No documents have been uploaded to this folder yet.
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
      <div className="flex items-center space-x-6 border-b border-gray-200 bg-gray-50 px-8 py-6">
        <Dropdown
          menu={{
            items: TreeData.map(folder => ({
              label: folder.label,
              value: folder.query,
              icon: folder.icon,
            })),
            onClick: value => {
              if (value) {
                const label = value[0].toUpperCase() + value.slice(1);
                setCurrentFolder({
                  label,
                  query: value,
                  icon: TreeData.find(folder => folder.query === value)?.icon,
                });
              }
            },
          }}
          className="h-12 w-[160px] border border-gray-300 text-left capitalize"
          startIcon={currentFolder.icon}
          endIcon={<ChevronDownIcon className="size-4 text-gray-400" />}
        >
          <div className="w-full">{currentFolder.label}</div>
        </Dropdown>
        <div className="relative grow">
          <input
            placeholder="Search for files"
            value={search}
            name="file_search"
            onChange={e => setSearch(e.target.value)}
            className="h-12 w-full rounded-sm border border-gray-300 p-2.5 pl-12 "
          />
          <MagnifyingGlassIcon className="absolute left-4 top-3 size-5 text-gray-400" />
        </div>
        <Button
          className="h-12 rounded-sm border border-gray-300 px-6 py-3 text-sm"
          startIcon={<PlusIcon className="size-5" />}
          onClick={() => setIsUploadFileDialogOpen(true)}
        >
          Upload File
        </Button>
      </div>
      <div className="flex w-full flex-row flex-wrap p-6 transition-all">
        {filteredFiles.map(file => (
          <div
            className={cn(
              ' relative py-4 pl-2 w-[290px] rounded-sm border border-gray-100 m-2'
            )}
            key={file.name}
          >
            <div className="mr-[35px] flex flex-row items-center overflow-hidden break-all text-center">
              <div className="mr-2">
                {file.name.endsWith('png') || file.name.endsWith('jpg') ? (
                  <PhotoIcon className="size-10 text-gray-500" />
                ) : (
                  <DocumentIcon className="size-10 text-gray-500" />
                )}
              </div>
              <div className="flex flex-col text-left">
                <button
                  onClick={() => {
                    setFilename(file.name);
                    setFiletype(
                      file.name.endsWith('png') || file.name.endsWith('jpg')
                        ? 'image'
                        : 'text'
                    );
                  }}
                  className="w-full text-ellipsis text-left text-sm font-medium hover:underline"
                >
                  <Tooltip title={'Preview File'}>
                    {file.name.replace(`${currentFolder.query}/` ?? '/', '')}
                  </Tooltip>
                </button>
                <p className="mt-2 text-xs text-gray-400">
                  Added {formatDate(file.updated)}
                </p>
              </div>
            </div>
            <Tooltip title="Download File">
              <button
                onClick={() => handleDownload(file)}
                className="absolute right-2 top-3 rounded-full p-1.5 transition-colors hover:bg-gray-100"
              >
                <ArrowDownTrayIcon className="size-4 stroke-2 text-default" />
              </button>
            </Tooltip>
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
