import React, { PropsWithChildren, ReactNode } from 'react';
import { useDropzone } from 'react-dropzone';
import { PlusCircleIcon } from '@heroicons/react/24/solid';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';

import { cn } from '@/utils/classname';
import { mbToBytes } from '@/utils/file.util';

import { Snackbar } from './Snackbar';

export type FileResult = string | ArrayBuffer | null;

export type Files = { result: FileResult; file: File }[];

interface Props extends PropsWithChildren {
  onFilesDrop: (files: Files) => void;
  validate?: (result: string | ArrayBuffer | null, file: File) => boolean;
  title?: string;
  subTitle?: string;
  maxFileSizeInMb?: number;
  maxFileSizeMessage?: ReactNode;
  maxFileSizeErrorMessage?: ReactNode;
}

export const Dropzone: React.FC<Props> = (props: Props) => {
  const {
    onFilesDrop,
    validate,
    title = 'Drop files here',
    subTitle = 'Suggest file types: TXT, CSV, JSON, or XML',
    children,
    maxFileSizeInMb,
    maxFileSizeMessage,
    maxFileSizeErrorMessage,
  } = props;
  interface Error {
    title: string;
    message: React.ReactNode;
  }
  const [error, setError] = React.useState<Error | false>(false);

  const handleDrop = (files: File[]): void => {
    const fileValue: Files = [];

    const totalSize = files.reduce((acc, file) => acc + file.size, 0);

    if (maxFileSizeInMb && totalSize > mbToBytes(maxFileSizeInMb)) {
      setError({
        title: 'Limit Exceeded',
        message:
          maxFileSizeErrorMessage ||
          `Uploads cannot exceed ${maxFileSizeInMb}MB in file size.`,
      });

      return;
    }

    files.forEach((file, index) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result;
        const isValid = validate ? validate(result, file) : true;
        if (isValid) {
          fileValue.push({ result, file });
        } else {
          handleError();
        }

        if (files.length - 1 === index && fileValue.length > 0) {
          onFilesDrop(fileValue);
        }
      };
      reader.onerror = handleError;
      reader.readAsText(file);
    });
  };

  function handleError() {
    Snackbar({
      title: 'Cannot process the file you have uploaded.',
      description: '',
      variant: 'error',
    });
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
  });

  return (
    <>
      <div
        {...getRootProps()}
        className={cn(
          'mt-4 flex flex-col items-center justify-center border-2 border-dashed border-default bg-primary bg-opacity-5 p-4 hover:bg-opacity-10 h-60 rounded hover:cursor-pointer',
          isDragActive ? 'bg-opacity-10' : ''
        )}
      >
        <input {...getInputProps()} />
        {children}
        {!children && (
          <>
            <div>
              {error ? (
                <ExclamationCircleIcon className="size-20 text-disabled" />
              ) : (
                <PlusCircleIcon className="size-20 text-disabled" />
              )}
            </div>
            <h3 className="my-2 font-semibold">
              {error ? error.title : title}
            </h3>
            <p className="text-center">{error ? error.message : subTitle}</p>
          </>
        )}
      </div>

      {maxFileSizeInMb && (
        <div className="mb-2 mt-4 text-center text-sm text-default-light">
          {maxFileSizeMessage ||
            `Upload cannot exceed ${maxFileSizeInMb}MB in file size`}
        </div>
      )}
    </>
  );
};
