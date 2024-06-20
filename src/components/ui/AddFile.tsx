import React from 'react';

import { useUploadFile } from '@/hooks';

import { Dropzone, Files } from '../Dropzone';
import { Modal } from '../Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AddFile: React.FC<Props> = (props: Props) => {
  const { isOpen, onClose } = props;
  const { mutate: uploadFile } = useUploadFile();

  const handleFilesDrop = (files: Files): void => {
    onClose();

    files.forEach(({ content, file }) => {
      uploadFile({
        name: file.name,
        content,
      });
    });
  };

  return (
    <Modal title="Upload Document" open={isOpen} onClose={onClose}>
      <Dropzone
        onFilesDrop={handleFilesDrop}
        title="Click or drag and drop documents here."
        subTitle="Documents will be stored on S3."
        maxFileSizeInMb={6}
      />
    </Modal>
  );
};
