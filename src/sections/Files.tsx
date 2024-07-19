import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { FolderIcon } from '@heroicons/react/24/solid';

import { Button } from '@/components/Button';
import FileViewer from '@/components/FileViewer';
import { RisksIcon } from '@/components/icons';
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

  const handleFolderClick = (folder: Folder) => {
    setCurrentFolder(folder);
  };

  return (
    <Body className="bg-layer0 pb-4">
      {currentFolder ? (
        <TreeLevel
          currentFolder={currentFolder}
          setCurrentFolder={setCurrentFolder}
          getAdditionalActions={getAdditionalActions}
          handleDownload={handleDownload}
        />
      ) : (
        <FolderList folders={TreeData} onFolderClick={handleFolderClick} />
      )}
    </Body>
  );
};

interface FolderListProps {
  folders: Folder[];
  onFolderClick: (folder: Folder) => void;
}

const FolderList = ({ folders, onFolderClick }: FolderListProps) => {
  return (
    <div className="flex flex-row flex-wrap space-x-4 space-y-4">
      {folders.map(folder => (
        <div
          key={folder.label}
          className={cn(
            'ml-4 mt-4 h-[100px] w-[130px] text-center',
            'flex cursor-pointer flex-col rounded-sm border border-layer0 p-2 text-center hover:border hover:border-gray-200 hover:bg-gray-50'
          )}
          onClick={() => onFolderClick(folder)}
        >
          <FolderIcon className="m-auto size-12 text-brand-light" />
          <span className="mt-2 w-full text-center text-sm font-medium">
            {folder.label}
          </span>
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
        {files.map(file => (
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
