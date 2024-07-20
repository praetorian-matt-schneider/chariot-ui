import React, { useMemo, useState } from 'react';
import { JSX } from 'react/jsx-runtime';
import { useNavigate } from 'react-router-dom';
import {
  DocumentIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { FolderIcon } from '@heroicons/react/24/solid';
import { useDebounce } from 'use-debounce';

import { Button } from '@/components/Button';
import FileViewer from '@/components/FileViewer';
import { AssetsIcon, RisksIcon } from '@/components/icons';
import { Modal } from '@/components/Modal';
import { Tooltip } from '@/components/Tooltip';
import { Body } from '@/components/ui/Body';
import { NoData } from '@/components/ui/NoData';
import { useDownloadFile, useMy } from '@/hooks';
import { getDrawerLink } from '@/sections/detailsDrawer/getDrawerLink';
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
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);

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

  const handleFolderClick = (folder: Folder) => {
    setCurrentFolder(folder);
  };

  return (
    <>
      {currentFolder ? (
        <Body className="bg-layer0 pb-4">
          <TreeLevel
            currentFolder={currentFolder}
            setCurrentFolder={setCurrentFolder}
            getAdditionalActions={getAdditionalActions}
            handleDownload={handleDownload}
          />
        </Body>
      ) : (
        <Body header={true}>
          <FolderList folders={TreeData} onFolderClick={handleFolderClick} />
          <div className="m-auto max-w-[1050px]">
            <UploadForm />
          </div>
        </Body>
      )}
    </>
  );
};

const UploadForm: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState(TreeData[0].query);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSection(e.target.value);
  };

  const handleUpload = () => {
    if (file) {
      // Implement the upload logic here
      console.log(`Uploading ${file.name} to ${selectedSection}`);
    }
  };

  return (
    <div className="mt-6 rounded-sm border border-gray-300 bg-white p-6">
      <h2 className="mb-4 text-lg font-medium text-gray-900">Upload File</h2>
      <div className="flex flex-col space-y-2">
        {TreeData.map(section => (
          <label
            key={section.query}
            className="flex cursor-pointer items-center rounded-md border border-gray-200 p-3 hover:bg-gray-100"
          >
            <input
              type="radio"
              name="section"
              value={section.query}
              checked={selectedSection === section.query}
              onChange={handleSectionChange}
              className="hidden"
            />
            <span className="mr-2 flex size-6 items-center justify-center rounded-full border-2 border-gray-300">
              {selectedSection === section.query && (
                <span className="block size-3 rounded-full bg-brand"></span>
              )}
            </span>
            <span className="text-gray-900">
              {section.label === 'Home' ? 'My Files' : section.label}
            </span>
          </label>
        ))}
        <input
          type="file"
          onChange={handleFileChange}
          className="rounded-md border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-brand-light"
        />
        <Button
          onClick={handleUpload}
          styleType="primary"
          className="rounded-md bg-brand px-6 py-2 text-xl text-white"
        >
          Upload
        </Button>
      </div>
    </div>
  );
};

interface FolderListProps {
  folders: Folder[];
  onFolderClick: (folder: Folder) => void;
}

export const FilesIcon = (
  props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>
) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    {/* SVG for My Files */}
    <path d="M12 2L2 12h3v8h14v-8h3L12 2zM10 16h4v2h-4v-2zm0-4h4v2h-4v-2zm0-4h4v2h-4v-2z" />
  </svg>
);

export const MalwareIcon = (
  props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>
) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    {/* Refined SVG for Malware */}
    <path d="M12 2a1 1 0 0 0-1 1v2H9a1 1 0 0 0-1 1v2H6a1 1 0 0 0-1 1v2H3a1 1 0 0 0-1 1v2H1a1 1 0 0 0 0 2h1v2a1 1 0 0 0 1 1h2v2a1 1 0 0 0 1 1h2v2a1 1 0 0 0 2 0v-2h2a1 1 0 0 0 1-1v-2h2a1 1 0 0 0 1-1v-2h2a1 1 0 0 0 1-1v-2h1a1 1 0 1 0 0-2h-1v-2a1 1 0 0 0-1-1h-2V9a1 1 0 0 0-1-1h-2V6a1 1 0 0 0-1-1h-2V3a1 1 0 0 0-1-1zm1 4h-2v2h2V6zm4 4h-2v2h2v-2zm-8 0H7v2h2v-2zm2 4h2v2h-2v-2zm-4 4h2v2H7v-2zm8 0h2v2h-2v-2zm4-4h-2v2h2v-2zm-8-8h2v2h-2V6zm-4 0h2v2H7V6zm8 8h2v2h-2v-2zm-4 4h2v2h-2v-2zm-4-4h2v2H7v-2zm12 0h2v2h-2v-2z" />
  </svg>
);

export const ThreatsIcon = (
  props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>
) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    {/* SVG for Threats */}
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z" />
  </svg>
);

const getIcon = (label: string) => {
  switch (label) {
    case 'My Files':
      return <FilesIcon className="size-6 text-gray-600" />;
    case 'Malware':
      return <MalwareIcon className="size-6 text-gray-600" />;
    case 'Threats':
      return <ThreatsIcon className="size-6 text-gray-600" />;
    case 'Assets':
      return <AssetsIcon className="size-6 text-gray-600" />;
    case 'Definitions':
      return <RisksIcon className="size-6 text-gray-600" />;
    case 'Exports':
      return <FilesIcon className="size-6 text-gray-600" />;
    default:
      return <FilesIcon className="size-6 text-gray-600" />; // Default icon
  }
};

const r = () => {
  return Math.floor(Math.random() * 10000);
};
const FolderList = ({ folders, onFolderClick }: FolderListProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      {folders.map(folder => (
        <div
          key={folder.label}
          className={cn(
            'p-4 cursor-pointer rounded-sm border border-gray-200 bg-white w-48',
            'transition duration-100 ease-in-out hover:shadow-md hover:border-gray-300'
          )}
          onClick={() => onFolderClick(folder)}
        >
          <h3 className="text-5xl font-medium text-gray-800">
            {r().toLocaleString()}
          </h3>
          <div className="mt-4 flex items-center">
            <div className="mr-1">{getIcon(folder.label)}</div>
            <span className="text-lg font-medium text-gray-800">
              {folder.label === 'Home' ? 'My Files' : folder.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

interface TreeLevelProps {
  currentFolder: Folder;
  setCurrentFolder: React.Dispatch<React.SetStateAction<Folder | null>>;
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

  const { data: files = [] } = useMy(
    {
      resource: 'file',
      query: query ? `#` : '',
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
          onClick={() => setCurrentFolder(null)}
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
      <div className="mx-12 flex items-center pt-6">
        <div className="relative grow">
          <input
            placeholder="Search for files"
            value={search}
            name="file_search"
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-full border border-gray-200 p-4 pl-16 focus:outline-none focus:ring-2 focus:ring-brand-light"
          />
          <MagnifyingGlassIcon className="absolute left-4 top-4 size-6 text-gray-400" />
        </div>
        <Button
          styleType="primary"
          className="ml-4 rounded-md bg-brand px-6 py-2 text-xl text-white"
          startIcon={<PlusIcon className="size-8" />}
        >
          Upload File
        </Button>
      </div>

      <div className="flex flex-row flex-wrap space-x-4 space-y-4">
        <div className="ml-4 mt-5 h-[100px] w-[130px]">
          <Tooltip title="Go Back">
            <div
              className="flex cursor-pointer flex-col rounded-sm border border-layer0 p-2 text-center hover:border hover:border-gray-200 hover:bg-gray-50"
              onClick={() => setCurrentFolder(null)}
            >
              <FolderIcon className="m-auto size-12 text-brand-light" />
              <span className="mt-2 text-sm font-medium">..</span>
            </div>
          </Tooltip>
        </div>
        {filteredFiles.map(file => (
          <div className="h-[100px] w-[130px]" key={file.name}>
            <Tooltip title={file.name}>
              <div
                className="flex cursor-pointer flex-col rounded-sm border border-layer0 p-2 text-center hover:border hover:border-gray-200 hover:bg-gray-50"
                onClick={() => {
                  setFilename(file.name);
                  setFiletype(
                    file.name.endsWith('png') || file.name.endsWith('jpg')
                      ? 'image'
                      : 'text'
                  );
                }}
              >
                {file.name.endsWith('png') || file.name.endsWith('jpg') ? (
                  <PhotoIcon className="m-auto size-12 text-brand-light" />
                ) : (
                  <DocumentIcon className="m-auto size-12 text-brand-light" />
                )}
                <span className="mt-2 w-32 truncate whitespace-nowrap text-center text-sm font-medium">
                  {file.name}
                </span>
              </div>
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
