import React, { useMemo, useState } from 'react';
import { JSX } from 'react/jsx-runtime';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownOnSquareIcon,
  BookmarkIcon,
  ChevronDownIcon,
  DocumentIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import {
  BookOpenIcon,
  ClipboardDocumentListIcon,
  EllipsisVerticalIcon,
  FolderIcon,
  GlobeAltIcon,
  HomeIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { Divider } from '@tremor/react';
import { useDebounce } from 'use-debounce';

import { Button } from '@/components/Button';
import { Dropdown } from '@/components/Dropdown';
import FileViewer from '@/components/FileViewer';
import { RisksIcon } from '@/components/icons';
import { Modal } from '@/components/Modal';
import { Snackbar } from '@/components/Snackbar';
import { Tooltip } from '@/components/Tooltip';
import { Body } from '@/components/ui/Body';
import { NoData } from '@/components/ui/NoData';
import { useDownloadFile, useMy, useUploadFile } from '@/hooks';
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
    label: 'My Files',
    query: 'home',
    icon: <HomeIcon className="size-6" />,
  },
  {
    label: 'Procedures',
    query: 'malware',
    icon: <ClipboardDocumentListIcon className="size-6" />,
  },
  {
    label: 'Intel Sources',
    query: 'threats',
    icon: <GlobeAltIcon className="size-6" />,
  },
  {
    label: 'Proof of Exploits',
    query: 'assets',
    icon: <ShieldCheckIcon className="size-6" />,
  },
  {
    label: 'Risk Definitions',
    query: 'definitions',
    icon: <BookOpenIcon className="size-6" />,
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
      <Body className="border border-gray-200 bg-layer0 pb-4 shadow-sm">
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
  const { mutateAsync: uploadFile } = useUploadFile();
  const [filename, setFilename] = useState('');
  const [filetype, setFiletype] = useState('');
  const [content, setContent] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
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

  const favoritedFiles = useMemo(
    () => files.filter(file => favorites.includes(file.name)),
    [files, favorites]
  );

  const getLabel = (query: string) => {
    switch (query) {
      case 'home':
        return 'Upload File';
      case 'malware':
        return 'Procedure';
      case 'threats':
        return 'Intel Source';
      case 'assets':
        return 'Proof of Exploit';
      case 'definitions':
        return 'Risk Definition';
      default:
        return 'Upload File';
    }
  };

  return (
    <div>
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
      <div className="flex items-center space-x-6 border-b border-gray-200 bg-gray-50 px-8 py-6 shadow-sm">
        <Dropdown
          menu={{
            items: TreeData.map(folder => ({
              label: folder.label,
              value: folder.query,
              icon: folder.icon,
            })),
            onClick: value => {
              if (value) {
                setCurrentFolder({
                  label:
                    TreeData.find(folder => folder.query === value)?.label ??
                    '',
                  query: value,
                  icon: TreeData.find(folder => folder.query === value)?.icon,
                });
              }
            },
          }}
          className="h-12 w-[200px] border border-gray-300 text-left capitalize shadow-sm"
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
            className="h-12 w-full rounded-sm border border-gray-300 p-2.5 pl-12 shadow-sm"
          />
          <MagnifyingGlassIcon className="absolute left-4 top-3 size-5 text-gray-400" />
          {search.length > 0 && (
            <Tooltip title="Clear Search">
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-3"
              >
                <XMarkIcon className="size-5 text-gray-400" />
              </button>
            </Tooltip>
          )}
        </div>
        <Button
          className="h-12 w-[180px] rounded-sm border border-gray-300 px-6 py-3 text-left text-sm shadow-sm"
          startIcon={<PlusIcon className="size-5" />}
          onClick={() => setIsUploadFileDialogOpen(true)}
        >
          <div className="w-full">{getLabel(currentFolder.query ?? '')}</div>
        </Button>
      </div>
      <div className="flex w-full flex-row flex-wrap p-6 transition-all">
        {favoritedFiles.length > 0 && (
          <>
            <h4 className="ml-2 w-full text-sm font-medium text-gray-500">
              Favorites
            </h4>
            {favoritedFiles.map(file => (
              <FileItem
                key={file.name}
                file={file}
                currentFolder={currentFolder}
                setFavorites={setFavorites}
                setFilename={setFilename}
                setFiletype={setFiletype}
                handleDownload={handleDownload}
                favorites={favorites}
              />
            ))}
            <Divider />
          </>
        )}
        {filteredFiles.map(file => (
          <FileItem
            key={file.name}
            file={file}
            currentFolder={currentFolder}
            setFavorites={setFavorites}
            setFilename={setFilename}
            setFiletype={setFiletype}
            handleDownload={handleDownload}
            favorites={favorites}
          />
        ))}
        {files.length === 0 && !childFolders && (
          <NoData title={noData.title} description={noData.description} />
        )}
      </div>

      <Modal
        open={filename.length > 0 && filetype.length > 0}
        onClose={() => setFilename('')}
        size="xl"
        title={filename}
        footer={{
          text: 'Save',
          onClick: async () => {
            uploadFile({
              ignoreSnackbar: true,
              name: filename,
              content: content ?? '',
            })
              .then(() => {
                Snackbar({
                  title: filename,
                  description: 'The file has been saved successfully.',
                  variant: 'success',
                });
                setFilename('');
              })
              .catch(() => {
                Snackbar({
                  title: filename,
                  description: 'Failed to save the file.',
                  variant: 'error',
                });
              });
            console.log('save', filename, content);
          },
        }}
      >
        <FileViewer
          fileName={filename}
          fileType={filetype}
          onChange={changed => setContent(changed)}
        />
      </Modal>
    </div>
  );
};

interface FileItemProps {
  file: MyFile;
  currentFolder: Folder;
  setFavorites: React.Dispatch<React.SetStateAction<string[]>>;
  setFilename: React.Dispatch<React.SetStateAction<string>>;
  setFiletype: React.Dispatch<React.SetStateAction<string>>;
  handleDownload: (item: MyFile) => void;
  favorites: string[];
}

const FileItem: React.FC<FileItemProps> = ({
  file,
  currentFolder,
  setFavorites,
  setFilename,
  setFiletype,
  handleDownload,
  favorites,
}) => {
  return (
    <div
      className={cn(
        ' relative py-4 pl-2 w-[290px] rounded-sm border border-gray-200 m-2'
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
          <span className="font-default text-sm">
            {file.name.replace(`${currentFolder.query}/` ?? '/', '')}
          </span>
          <p className="mt-1 text-xs text-gray-400">
            Added {formatDate(file.updated)}
          </p>
        </div>
      </div>
      <Dropdown
        menu={{
          items: [
            {
              label: favorites.includes(file.name) ? 'Unfavorite' : 'Favorite',
              icon: <BookmarkIcon className="size-6 text-default" />,
              onClick: () => {
                if (favorites.includes(file.name)) {
                  setFavorites(favorites.filter(fav => fav !== file.name));
                  return;
                } else {
                  setFavorites([...favorites, file.name]);
                }
              },
            },
            {
              icon: <DocumentTextIcon className="size-6 text-default" />,
              label: 'View',
              onClick: () => {
                setFilename(file.name);
                setFiletype(
                  file.name.endsWith('png') || file.name.endsWith('jpg')
                    ? 'image'
                    : 'text'
                );
              },
            },
            {
              icon: <ArrowDownOnSquareIcon className="size-7 text-default" />,
              label: 'Download',
              onClick: () => handleDownload(file),
            },
          ],
        }}
        className="absolute right-2 top-2 bg-layer0 p-0"
        endIcon={<EllipsisVerticalIcon className="size-6 text-default" />}
      />
    </div>
  );
};

export default Files;
