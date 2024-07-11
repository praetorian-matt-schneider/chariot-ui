import { useEffect, useState } from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { Editor } from '@monaco-editor/react';

import { Button } from '@/components/Button';
import { Loader } from '@/components/Loader';
import { Modal } from '@/components/Modal';

interface Props {
  comment: string;
  isLoading: boolean;
  onSave?: (comment: string) => Promise<void>;
  title?: string;
}

export const Comment: React.FC<Props> = ({
  isLoading,
  comment,
  onSave,
  title = 'Comment',
}: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [value, setValue] = useState('');

  useEffect(() => {
    setValue(isEditing ? comment : '');
  }, [isEditing]);

  return (
    <>
      <Loader className="h-32" isLoading={isLoading}>
        {comment && (
          <p className="whitespace-pre-wrap break-words">{comment}</p>
        )}
        {!comment && (
          <span className="text-gray-500">No comment available</span>
        )}
        <Button
          styleType="text"
          className="mt-4 p-2 font-bold"
          endIcon={<PencilSquareIcon className="size-4" />}
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            setIsEditing(true);
          }}
        >
          Edit
        </Button>
      </Loader>
      <Modal
        size="xl"
        title="Edit Comment"
        open={isEditing}
        onClose={() => {
          setIsEditing(false);
        }}
        footer={{
          text: 'Save',
          onClick: async () => {
            try {
              setIsSaving(true);
              onSave && (await onSave(value));
              setIsEditing(false);
            } catch (e) {
              console.error(e);
            } finally {
              setIsSaving(false);
            }
          },
          isLoading: isSaving,
        }}
      >
        <Editor
          height="60vh"
          language="yaml"
          value={value}
          onChange={value => {
            setValue(value || '');
          }}
          options={{
            scrollBeyondLastLine: false,
          }}
        />
      </Modal>
    </>
  );
};
