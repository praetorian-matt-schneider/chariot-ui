import { useEffect, useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/solid';
import { Editor } from '@monaco-editor/react';

import { Accordian } from '@/components/Accordian';
import { Button } from '@/components/Button';
import { Loader } from '@/components/Loader';
import { Modal } from '@/components/Modal';
import { NoData } from '@/components/ui/NoData';
import { useSearchParams } from '@/hooks/useSearchParams';
import { StorageKey } from '@/utils/storage/useStorage.util';

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
  const { searchParams, removeSearchParams } = useSearchParams();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [value, setValue] = useState('');

  useEffect(() => {
    if (!isLoading) {
      const focusOnComment = searchParams.get(StorageKey.FOCUS_ON_COMMENT);

      if (focusOnComment !== null) {
        setTimeout(() => {
          setIsEditing(true);

          removeSearchParams(StorageKey.FOCUS_ON_COMMENT);
        }, 200);
      }
    }
  }, [isLoading]);

  useEffect(() => {
    setValue(isEditing ? comment : '');
  }, [isEditing]);

  return (
    <Accordian
      title={title}
      titlerightContainer={
        onSave && (
          <Button
            styleType="textPrimary"
            className="p-0 text-xs font-bold"
            endIcon={<ChevronRightIcon className="ml-1 size-3" />}
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              setIsEditing(true);
            }}
          >
            Edit
          </Button>
        )
      }
    >
      <Loader className="h-32" isLoading={isLoading}>
        {comment && (
          <p className="whitespace-pre-wrap break-words">{comment}</p>
        )}
        {!comment && <NoData title="No Comment"></NoData>}
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
    </Accordian>
  );
};
